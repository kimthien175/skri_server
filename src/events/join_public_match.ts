import { Collection, Filter, ObjectId, UpdateFilter } from "mongodb";
import { Player } from "../types/player.js";
import { deleteRoomSensitiveInformation, getRunningState, PublicRoom, RoomProjection, ServerRoom, StateStatus } from "../types/room.js";
import { getNewRoomCode, SocketPackage } from "../types/socket_package.js";
import { Mutable, RoomRequestPackage, RoomResponse } from "../types/type.js";

import { getLastestSpecs, Mongo } from "../utils/db/mongo.js";
import { Random } from "../utils/random/random.js";
import { Message, PlayerJoinMessage } from "../types/message.js";
import { GameState, PickWordState, PublicLobbyState } from "../private/state/state.js";
import { Redis } from "../utils/redis.js";

type JoinPublicRoomCallback = (arg: RoomResponse<PublicRoom>) => void

export async function registerJoinPublicMatch(socketPkg: SocketPackage<PublicRoom>) {
    socketPkg.socket.on('join_public_match',
        async function (requestPkg: RoomRequestPackage,
            callback: JoinPublicRoomCallback) {
            try {
                //await Mongo.connect()
                const socket = socketPkg.socket
                const player = requestPkg.player

                //#region PLAYER
                player.id = new ObjectId().toString()
                player.socket_id = socket.id
                player.score = 0
                if (player.name === "") {
                    player.name = (await Random.getWords({ word_count: 1, language: requestPkg.lang }))[0];
                }
                //#endregion

                //#region MODIFY SOCKETPACKAGE EXCEPT ROOMID
                socketPkg.name = player.name
                socketPkg.playerId = player.id
                socketPkg.roomType = 'public'
                //#endregion

                const message = new PlayerJoinMessage(player.id, player.name)

                console.log(player);
                await _joinPublicRoom(socketPkg, callback, player, message)
                    .catch(async (e) => {

                        console.log(`[JOIN PUBLIC ROOM]`)
                        if (!(e instanceof NotRoomFoundError)) {
                            console.log(`[ERROR]: ${e}`)
                            throw e
                        }

                        console.log(`[FAILED]: SKIP TO INIT LOBBY ROOM`);
                        await _initLobbyRoom(socketPkg, callback, player)
                            .catch((e) => {
                                console.log(`[INIT LOBBY ROOM]:ERROR ${e}`);
                                throw e
                            })
                    })

            } catch (e: any) {
                console.log(`[JOIN PUBLIC ROOM REQUEST] ${e}`);
                callback({
                    success: false,
                    reason: e.message
                })
            }
        })
}

/// modify socketPkg.roomid
async function _joinPublicRoom(socketPkg: SocketPackage<PublicRoom>, callback: JoinPublicRoomCallback, player: Player, message: PlayerJoinMessage) {
    var room = await socketPkg.room.findOne({ is_available: true }, { projection: RoomProjection })
    if (room == null) throw new NotRoomFoundError()

    const roomId = room._id.toString()
    // modify socket pkg room id
    await Redis.setRoomId(socketPkg.socket.id, roomId)


    const updateFilter: UpdateFilter<PublicRoom>[] = [
        {
            $set: {
                [`players.${player.id}`]: player,
                messages: { $concatArrays: ['$messages', [message as Message]] }
            }
        } as unknown as UpdateFilter<PublicRoom>
    ]

    const runningState = getRunningState(room) as PublicLobbyState
    const totalPlayers = Object.keys(room.players).length
    if (totalPlayers == 1 || runningState.type == PublicLobbyState.TYPE) {
        console.log(`START GAME`);
        //#region START GAME
        if (runningState.type != PublicLobbyState.TYPE || totalPlayers != 1) throw Error('wrong state')

        var pickWordPkg = await PickWordState.from(room, { ...room.players, [`${player.id}`]: player })
        var startGamePkg = GameState.switchState(room, pickWordPkg.state)


        updateFilter.push(...startGamePkg)
        updateFilter.push(pickWordPkg.update)
        //#endregion

        //#region THE SAME IN BOTH BLOCK
        // join
        await socketPkg.socket.join(roomId)

        console.log(updateFilter);
        room = await socketPkg.room.findOneAndUpdate({ _id: room._id }, updateFilter, { returnDocument: 'after', projection: RoomProjection })
        if (room == null) throw new NotRoomFoundError()

        // notify other players
        socketPkg.socket.to(roomId).emit('player_join', {
            message,
            player
        })
        //#endregion

        //EXCEPT THIS
        console.log(`EMIT NEW STATES`);
        const status = ((startGamePkg[0] as UpdateFilter<ServerRoom>
        ).$set as NonNullable<UpdateFilter<ServerRoom>['$set']>
        ).status as StateStatus

        if (pickWordPkg.state.player_id != socketPkg.playerId){
            PickWordState.removeSensitiveProperties(pickWordPkg.state)
        }
        socketPkg.emitNewStates({ except: socketPkg.socket.id }, status, pickWordPkg.state)
    } else if (totalPlayers >= 7) {
        updateFilter.push({
            is_available: false
        })

        //#region THE SAME IN BOTH BLOCK
        // join
        await socketPkg.socket.join(roomId)

        console.log(updateFilter);
        room = await socketPkg.room.findOneAndUpdate({ _id: room._id }, updateFilter, { returnDocument: 'after', projection: RoomProjection })
        if (room == null) throw new NotRoomFoundError()

        // notify other players
        socketPkg.socket.to(roomId).emit('player_join', {
            message,
            player
        })
        //#endregion
    }

    deleteRoomSensitiveInformation(room, socketPkg.playerId as Player['id'])
    callback({
        success: true,
        player,
        room
    })
}

/// modify socketPkg.roomid
async function _initLobbyRoom(socketPkg: SocketPackage<PublicRoom>, callback: JoinPublicRoomCallback, player: Player) {
    const state: GameState = new PublicLobbyState()
    const status: StateStatus = {
        current_state_id: state.id,
        command: 'start',
        date: new Date()
    }
    const room: PublicRoom = {
        code: await getNewRoomCode('public'),
        is_available: true,
        players: { [player.id]: player },
        ...(await getLastestSpecs(true)),
        messages: [],
        status,
        henceforth_states: {
            [state.id]: state
        },
        outdated_states: [],
        tickets: {},
        latest_draw_data: {
            past_steps: {},
            black_list: {}
        },
        current_round_done_players: {},
        current_round: 1
    }

    var insertResult = await socketPkg.room.insertOne(room)
    if (!insertResult.acknowledged) throw Error('[INIT LOBBY ROOM]: insert room failed')

    const roomId = insertResult.insertedId.toString()

    // modify socket room
    await Redis.setRoomId(socketPkg.socket.id, roomId)

    // join this room
    await socketPkg.socket.join(roomId)

    console.log(`[INIT LOBBY ROOM]: ${room}`);
    // resolve request
    callback({
        success: true,
        player,
        room
    })
}

class NotRoomFoundError extends Error {
    constructor() { super('room not found') }
}




// /// modify socketPkg.roomid
// async function _joinLobbyRoom(socketPkg: SocketPackage<PublicRoom>, callback: JoinPublicRoomCallback, player: Player, message: PlayerJoinMessage) {
//     var pkg = await Mongo.doSession<{ state: PickWordState, room: PublicRoom }>(async function (session) {
//         var room = await socketPkg.room.findOne(
//             {
//                 // leave empty so just find a room, 
//                 // if you want to add condition or sort to find the last room added
//                 //  just add or modify the callback
//             },
//             { session }
//         )
//         if (room == null) throw new NotRoomFoundError()

//         //#region UPDATE ROOM
//         room.messages.push(message)
//         room.players[player.id] = player

//         var waitingState = getRunningState(room)
//         if (waitingState.type != PublicLobbyState.TYPE) throw Error('wrong game state')
//         waitingState.end_date = new Date()

//         //#region new state
//         const idList = Object.keys(room.players)
//         if (idList.length <= 1) throw Error('not enough player to start game')
//         const pickerId = idList[Math.floor(Math.random() * idList.length)]

//         const state = new PickWordState({
//             player_id: pickerId,
//             words: await Random.getWords(room.settings),
//             round_notify: 1
//         })
//         //#endregion

//         room.status = {
//             current_state_id: waitingState.id,
//             command: 'end',
//             date: waitingState.end_date,
//             next_state_id: state.id
//         }
//         room.henceforth_states[state.id] = state
//         room.current_round_done_players = { [pickerId]: true }
//         //#endregion

//         // MOVE TO PUBLIC ROOM
//         var insertResult = await socketPkg.room.insertOne(room, { session })
//         if (!insertResult.acknowledged) throw Error('insert failed')

//         // MODIFY SOCKET PACKAGE ROOM ID
//         socketPkg.roomId = insertResult.insertedId.toString()

//         return { state, room }
//     })

//     await socketPkg.socket.join(socketPkg.roomId)

//     // NOTIFY OTHER PLAYERS
//     socketPkg.socket.to(socketPkg.roomId).emit('player_join', { message, player })

//     console.log(`[JOIN LOBBY ROOM] ${JSON.stringify(pkg.room)}`);

//     //#region START GAME
//     if (pkg.state.player_id == socketPkg.playerId) {
//         callback({
//             success: true,
//             player,
//             room: pkg.room
//         })

//         PickWordState.removeSensitiveProperties(pkg.state)
//         socketPkg.emitNewStates({ except: pkg.state.player_id }, pkg.room.status, pkg.state)

//     } else {
//         socketPkg.emitNewStates({ only: pkg.state.player_id }, pkg.room.status, pkg.state)

//         // the room is supposed to have 2 players, but this code carry the case which have greater than 2 players 
//         //socketPkg.emitNewStates({except: [socketPkg.playerId as string, pkg.state.player_id]}, pkg.room.status, pkg.state)

//         PickWordState.removeSensitiveProperties(pkg.state)
//         callback({
//             success: true,
//             player,
//             room: pkg.room
//         })
//     }
//     //#endregion
// }