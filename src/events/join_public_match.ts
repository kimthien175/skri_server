import { ObjectId } from "mongodb";
import { Player } from "../types/player.js";
import { getRunningState, PublicRoom, StateStatus } from "../types/room.js";
import { SocketPackage } from "../types/socket_package.js";
import { RoomRequestPackage } from "../types/type.js";

import { getLastestSpecs, Mongo } from "../utils/db/mongo.js";
import { Random } from "../utils/random/random.js";
import { PlayerJoinMessage } from "../types/message.js";
import { GameState, PickWordState, PublicLobbyState } from "../private/state/state.js";
import { io } from "../socket_io.js";

type JoinPublicRoomCallback = (arg: { success: true, player: Player, room: PublicRoom }
    | { success: false, reason: any }) => void

export async function registerJoinPublicMatch(socketPkg: SocketPackage) {
    socketPkg.socket.on('join_public_match',
        async function (requestPkg: RoomRequestPackage,
            callback: JoinPublicRoomCallback) {
            try {
                await Mongo.connect()
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
                socketPkg.isPublicRoom = true
                socketPkg.playerId = player.id
                //#endregion

                const message = new PlayerJoinMessage(player.id, player.name)

                await _joinPublicRoom(socketPkg, callback, player, message)
                    .catch((e) => {
                        if ((e as NotRoomFoundError).message != NotRoomFoundError.reason) throw e
                        return _joinLobbyRoom(socketPkg, callback, player, message)
                    })
                    .catch((e) => {
                        if ((e as NotRoomFoundError).message != NotRoomFoundError.reason) throw e
                        return _initLobbyRoom(socketPkg, callback, player)
                    })

            } catch (e) {
                console.log(`[JOIN PUBLIC ROOM REQUEST]: ${e}`);
                callback({
                    success: false,
                    reason: e
                })
            }
        })
}

/// modify socketPkg.roomid
async function _joinPublicRoom(socketPkg: SocketPackage, callback: JoinPublicRoomCallback, player: Player, message: PlayerJoinMessage) {
    const room = await Mongo.publicRooms.findOneAndUpdate({ is_available: true },
        [
            {
                $set: {
                    [`players.${player.id}`]: player,
                    messages: { $concatArrays: ["$messages", [message]] }
                }
            },
            {
                $set: {
                    is_available: {
                        $lt: [
                            { $size: { $objectToArray: "$players" } },
                            8
                        ]
                    }
                }
            }
        ],
        { returnDocument: 'after' }
    )

    if (room == null) {
        console.log('[JOIN PUBLIC ROOM]: ');
        throw new NotRoomFoundError();
    }

    // modify socket pkg room id
    socketPkg.roomId = room._id.toString()

    // join
    await socketPkg.socket.join(socketPkg.roomId)

    // notify other players
    socketPkg.socket.to(socketPkg.roomId).emit('player_join', {
        message,
        player
    })

    callback({
        success: true,
        player,
        room
    })
}

/// modify socketPkg.roomid
async function _joinLobbyRoom(socketPkg: SocketPackage, callback: JoinPublicRoomCallback, player: Player, message: PlayerJoinMessage) {
    var pkg = await Mongo.doSession<{ state: PickWordState, room: PublicRoom }>(async function (session) {
        var room = await Mongo.publicLobby.findOneAndDelete(
            {
                // leave empty so just find a room, 
                // if you want to add condition or sort to find the last room added
                //  just add or modify the callback
            },
            { session }
        )
        if (room == null) throw new NotRoomFoundError()

        //#region UPDATE ROOM
        room.messages.push(message)
        room.players[player.id] = player

        var waitingState = getRunningState(room)
        if (waitingState.type != PublicLobbyState.TYPE) throw Error('[JOIN LOBBY ROOM]: wrong game state')
        waitingState.end_date = new Date()

        //#region new state
        const idList = Object.keys(room.players)
        if (idList.length <= 1) throw Error('[JOIN LOBBY ROOM]: not enough player to start game')
        const pickerId = idList[Math.floor(Math.random() * idList.length)]

        const state = new PickWordState({
            player_id: pickerId,
            words: await Random.getWords(room.settings),
            round_notify: 1
        })
        //#endregion

        room.status = {
            current_state_id: waitingState.id,
            command: 'end',
            date: waitingState.end_date,
            next_state_id: state.id
        }
        room.henceforth_states[state.id] = state
        room.current_round_done_players = { [pickerId]: true }
        //#endregion

        // MOVE TO PUBLIC ROOM
        var insertResult = await Mongo.publicRooms.insertOne(room, { session })
        if (!insertResult.acknowledged) throw Error('[JOIN LOBBY ROOM]: insert failed')

        // MODIFY SOCKET PACKAGE ROOM ID
        socketPkg.roomId = insertResult.insertedId.toString()

        return { state, room }
    })

    await socketPkg.socket.join(socketPkg.roomId)

    // NOTIFY OTHER PLAYERS
    io.to(socketPkg.roomId).emit('player_join', { message, player })

    //#region START GAME
    if (pkg.state.player_id == socketPkg.playerId) {
        callback({
            success: true,
            player,
            room: pkg.room
        })

        PickWordState.removeSensitiveProperties(pkg.state)
        socketPkg.emitNewStates({ except: pkg.state.player_id }, pkg.room.status, pkg.state)

    } else {
        socketPkg.emitNewStates({ only: pkg.state.player_id }, pkg.room.status, pkg.state)

        // the room is supposed to have 2 players, but this code carry the case which have greater than 2 players 
        //socketPkg.emitNewStates({except: [socketPkg.playerId as string, pkg.state.player_id]}, pkg.room.status, pkg.state)

        PickWordState.removeSensitiveProperties(pkg.state)
        callback({
            success: true,
            player,
            room: pkg.room
        })
    }
    //#endregion
}


/// modify socketPkg.roomid
async function _initLobbyRoom(socketPkg: SocketPackage, callback: JoinPublicRoomCallback, player: Player) {
    const state: GameState = new PublicLobbyState()
    const status: StateStatus = {
        current_state_id: state.id,
        command: 'start',
        date: new Date()
    }
    const room: PublicRoom = {
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

    var insertResult = await Mongo.publicLobby.insertOne(room)
    if (!insertResult.acknowledged) throw Error('[INIT LOBBY ROOM]: insert room failed')

    // modify socket room
    socketPkg.roomId = insertResult.insertedId.toString()

    // join this room
    await socketPkg.socket.join(socketPkg.roomId)

    // resolve request
    callback({
        success: true,
        player,
        room
    })
}

class NotRoomFoundError extends Error {
    constructor(){
        super(NotRoomFoundError.reason)
    }
    static reason = 'room not found'
}