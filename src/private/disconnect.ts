import { UpdateFilter, WithId } from "mongodb";
import { SocketPackage } from "../types/socket_package.js";
import { Mongo } from "../utils/db/mongo.js";
import { Message, NewHostMessage, PlayerJoinMessage, PlayerLeaveMessage } from "../types/message.js";
import { GameState, PrivatePreGameState, PublicLobbyState } from "./state/state.js";
import { deleteRoomSensitiveInformation, getRunningState, PrivateRoom, PublicRoom, RoomProjection, roomStringifier, ServerRoom, StateStatus } from "../types/room.js";
import { io } from "../socket_io.js";
import { endDrawState } from "../events/end_draw_state.js";
import { Redis } from "../utils/redis.js";
import { Player } from "../types/player.js";

/**
 * send PlayerLeaveMessage, handle cases when player leave 
 * 
 */
export async function registerOnDisconnect(socketPkg: SocketPackage) {
    socketPkg.socket.on('disconnect', async () => {
        console.log('[ON_DISCONNECT]')
        try {
            if (socketPkg.socket.data.isForceDisconnect) {
                console.log('player is forced disconnected, skip resolve game data');
                return
            }

            const roomId = await Redis.getRoomId(socketPkg.socket.id)
            const filter = socketPkg.getFilter({
                [`players.${socketPkg.playerId}`]: { $exists: true }
            })

            const room = await socketPkg.room.findOne(filter)
            if (room == null) throw Error('room not found')

            //#region CASE 1: ALONE PLAYER IN ROOM: DELETE ROOM
            if (Object.keys(room.players).length <= 1) {
                console.log('CASE 1: ALONE PLAYER IN ROOM: DELETE ROOM');
                // delete room and move to ended rooms
                await Mongo.doSession(async (session) => {
                    await socketPkg.room.deleteOne(filter, { session })
                    await socketPkg.endedRoom.insertOne(room as WithId<ServerRoom>, { session })
                })
                console.log(`moved room doc to ${socketPkg.endedRoom.collectionName}`);
                return
            }
            //#endregion

            // no need to delete room, player leave
            const playerLeaveMsg = new PlayerLeaveMessage(socketPkg.playerId as string, socketPkg.name)

            io.to(roomId).emit('player_leave', playerLeaveMsg)
            console.log(`emitted ${JSON.stringify(playerLeaveMsg, null, 2)} to room ${roomId}`);

            const updateFilter: UpdateFilter<ServerRoom>[] = [
                {
                    $set: {
                        messages: { $concatArrays: ['$messages', [playerLeaveMsg]] }
                    }
                } as unknown as UpdateFilter<ServerRoom>,
                {
                    $unset: `players.${socketPkg.playerId}`
                } as unknown as UpdateFilter<ServerRoom>,
                ...await handleCasesWhenPlayerLeave(socketPkg, socketPkg.playerId as string, room)
            ]

            if (socketPkg.roomType == 'public') updateFilter.push({ $set: { is_available: true } })

            console.log(`updating db with ${JSON.stringify(updateFilter, roomStringifier, 2)}`);
            var updateResult = await socketPkg.room.updateOne(filter, updateFilter);
            if (updateResult.modifiedCount != 1) throw new Error('update error');

            console.log(`[onLeavingPrivateRoom]: Remove player ${socketPkg.playerId} out of room ${roomId}`);

            // clear resources of leaving player
            await Redis.clear(socketPkg.socket.id)

            // find the lonely player in public room if any
            if (socketPkg.roomType == 'public' && Object.keys(room.players).length == 2) {
                await findLonelyPlayerNewPublicRoom(room as WithId<PublicRoom>)
            }
        } catch (e) {
            console.log(`[DISCONNECT] ${JSON.stringify(e)}`);
        }
    })
}

function _randomNewHostId(players: ServerRoom['players'], except: Player['id']) {
    const newOwnerCandidatesIds = Object.keys(players)
    const oldOwnerIdIndex = newOwnerCandidatesIds.indexOf(except)
    if (oldOwnerIdIndex !== -1) {
        newOwnerCandidatesIds.splice(oldOwnerIdIndex, 1)
    } else {
        throw Error('leaving player is supposed to exist in data before player handler')
    }
    return newOwnerCandidatesIds[Math.floor(Math.random() * newOwnerCandidatesIds.length)]
}

export async function handleCasesWhenPlayerLeave(socketPkg: SocketPackage, leavingPlayerId: string, room: ServerRoom): Promise<UpdateFilter<ServerRoom>[]> {
    console.log('[handleCasesWhenPlayerLeave]');
    const updateFilter: UpdateFilter<ServerRoom>[] = []
    const roomId = await Redis.getRoomId(socketPkg.socket.id)

    //#region PRIVATE ROOM: LEAVING PLAYER AS HOST PLAYER
    if (socketPkg.roomType == 'private' && leavingPlayerId == (room as unknown as PrivateRoom).host_player_id) {
        console.log('random new host');

        const newHostId = _randomNewHostId(room.players, leavingPlayerId)

        const newHostMsg: Message = new NewHostMessage(newHostId, room.players[newHostId].name)
        io.to(roomId).emit('new_host', newHostMsg);
        console.log(`emit ${JSON.stringify(newHostMsg)} to room ${roomId}`);

        const newHostUpdateFilter: UpdateFilter<PrivateRoom> = {
            $set: {
                host_player_id: newHostId,
                messages: { $concatArrays: ['$messages', [newHostMsg]] } as NonNullable<UpdateFilter<PrivateRoom>['$set']>['$messages']
            }
        }

        updateFilter.push(newHostUpdateFilter as unknown as UpdateFilter<PublicRoom>);

        // change host in local room
        (room as unknown as PrivateRoom).host_player_id = newHostId
        console.log(`hange local data host id to ${newHostId}`)
    }
    //#endregion

    const playersIdList = Object.keys(room.players)
    const state = getRunningState(room)

    // the game is not running, just return though
    if (state.type === PrivatePreGameState.TYPE) {
        console.log(`update filter: ${JSON.stringify(updateFilter, roomStringifier, 2)}`);
        return updateFilter
    }

    //#region END GAME IF THERE IS 1 PLAYER LEFT
    if (playersIdList.length === 2) {
        console.log('the game is running, end game');
        const newState: GameState = socketPkg.roomType == 'public' ?
            new PublicLobbyState() :
            new PrivatePreGameState((room as unknown as PrivateRoom).host_player_id)

        const endGameUpdatePkg = GameState.switchState(room, newState)
        updateFilter.push(...endGameUpdatePkg)

        const status = endGameUpdatePkg[0].$set.status
        // add end game bonus
        status.bonus = {
            end_game: room.players
        }

        socketPkg.emitNewStates({ wholeRoom: true }, status, newState)
    }
    //#endregion

    //#region SWITCH STATE IF LEAVING PLAYER HAVE IMPACT ON CURRENT STATE IN RUNNING GAME

    else if (leavingPlayerId == state.player_id) {
        updateFilter.push(...(await endDrawState(socketPkg, room, leavingPlayerId)))
    }
    //#endregion
    console.log(`update filter: ${JSON.stringify(updateFilter, roomStringifier, 2)}`);
    return updateFilter
}

/**
 * no checking, find room for first player at `Object.keys(room.players)[0]`
 * @param room current room
 * @returns 
 */
export async function findLonelyPlayerNewPublicRoom(room: WithId<PublicRoom>) {
    const lonelyPlayer = room.players[Object.keys(room.players)[0]]

    const joinMessage: Message = new PlayerJoinMessage(lonelyPlayer.id, lonelyPlayer.name)

    const newRoom = await Mongo.publicRooms.findOneAndUpdate(
        {
            is_available: true,
            _id: { $ne: room._id }
        },
        {
            $push: { messages: joinMessage },
            $set: {
                [`players.${lonelyPlayer.id}`]: lonelyPlayer
            }
        },
        {
            projection: RoomProjection,
            returnDocument: 'after'
        }
    )
    if (newRoom == null) {
        console.log(`[FINDING NEW ROOM FOR LONELY PLAYER]: NEW ROOM NOT FOUND`);
        return
    }

    const oldRoomId = room._id.toString()
    const newRoomId = newRoom._id.toString()


    //#region HANDLE OLD ROOM

    //MONGODB
    await Mongo.publicRooms.deleteOne({ _id: room._id })
    await Mongo.endedPublicRooms.insertOne(room)


    const sockets = await io.in(oldRoomId).fetchSockets()
    if (sockets.length != 1 || sockets[0].id != lonelyPlayer.socket_id) {

        // make that only player exit
        io.to(lonelyPlayer.socket_id).emit('reload', { success: false, reason: '' })

        throw Error(`[findLonelyPlayerNewPublicRoom]: sockets is supposed to have only 1 socket`)
    }
    sockets[0].leave(oldRoomId)
    sockets[0].join(newRoomId)

    //REDIS
    await Redis.setRoomId(lonelyPlayer.socket_id, newRoomId)

    deleteRoomSensitiveInformation(newRoom, lonelyPlayer.id)
    io.to(lonelyPlayer.socket_id).emit('reload', { success: true, room: newRoom })

    //#endregion

    // notify other players in the new room
    io.to(newRoomId).except(lonelyPlayer.socket_id).emit('player_join', { message: joinMessage, player: lonelyPlayer })
}

export async function forceDisconnect(socketId: string){
    // force client disconnect
    const victimSocket = io.sockets.sockets.get(socketId)
    if (victimSocket == undefined) throw Error(`victim socket ${socketId} is undefined!`);

    victimSocket.data.isForceDisconnect = true

    victimSocket.disconnect(true)
    console.log(`forced socket ${socketId} to disconnect`);

    // clear resources of leaving player
    await Redis.clear(socketId)
}