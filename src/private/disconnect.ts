import { Collection, Filter, UpdateFilter, WithId } from "mongodb";
import { SocketPackage } from "../types/socket_package.js";
import { Mongo } from "../utils/db/mongo.js";
import { Message, NewHostMessage, PlayerLeaveMessage } from "../types/message.js";
import { DrawState, GameState, PickWordState, PrivatePreGameState, PublicLobbyState } from "./state/state.js";
import { getRunningState, PrivateRoom, PublicRoom, ServerRoom } from "../types/room.js";
import { io } from "../socket_io.js";
import { endDrawState } from "../events/end_draw_state.js";

/**
 * send PlayerLeaveMessage, handle cases when player leave 
 * 
 */
export async function onLeavingRoom(socketPkg: SocketPackage) {
    try {
        const roomId = await socketPkg.getRoomId()
        const filter = socketPkg.getFilter({
            [`players.${socketPkg.playerId}`]: { $exists: true }
        })

        var room = await socketPkg.room.findOne(filter)
        if (room == null) throw Error('room not found')

        //#region CASE 1: ALONE PLAYER IN ROOM: DELETE ROOM
        if (Object.keys(room.players).length <= 1) {
            console.log('DISCONNECT CASE 1');
            // delete room and move to ended rooms
            await Mongo.doSession(async (session) => {
                await socketPkg.room.deleteOne(filter, { session })
                await socketPkg.endedRoom.insertOne(room as WithId<ServerRoom>, { session })
            })
            console.log(`onLeavingPrivateRoom: done moving to endedPrivateRoom`);
            return
        }
        //#endregion

        // no need to delete room, player leave
        const playerLeaveMsg = new PlayerLeaveMessage(socketPkg.playerId as string, socketPkg.name)
        io.to(roomId).emit('player_leave', playerLeaveMsg)

        const updateFilter: UpdateFilter<ServerRoom>[] = [
            {
                $push: { messages: playerLeaveMsg },
                $unset: {
                    [`players.${socketPkg.playerId}`]: "",
                }
            },
            ...await handleCasesWhenPlayerLeave(socketPkg, socketPkg.playerId as string, room)]

        if (socketPkg.roomType == 'public') updateFilter.push({ $set: { is_available: true } } as UpdateFilter<PublicRoom>)

        var updateResult = await socketPkg.room.updateOne(filter, updateFilter);
        if (updateResult.modifiedCount != 1) throw new Error('update error');

        console.log(`[onLeavingPrivateRoom]: Remove player ${socketPkg.playerId} out of room ${roomId}`);

    } catch (e) {
        console.log(`[DISCONNECT] ${e}`);
    }
}

export async function handleCasesWhenPlayerLeave(socketPkg: SocketPackage, leavingPlayerId: string, room: ServerRoom): Promise<UpdateFilter<ServerRoom>[]> {
    const updateFilter: UpdateFilter<ServerRoom>[] = []

    //#region PRIVATE ROOM: LEAVING PLAYER AS HOST PLAYER
    if (socketPkg.roomType == 'private' && leavingPlayerId == (room as unknown as PrivateRoom).host_player_id) {

        var newOwnerCandidatesIds = Object.keys(room.players)
        var oldOwnerIdIndex = newOwnerCandidatesIds.indexOf(leavingPlayerId)
        if (oldOwnerIdIndex !== -1) {
            newOwnerCandidatesIds.splice(oldOwnerIdIndex, 1)
        }

        var newOwnerId = newOwnerCandidatesIds[Math.floor(Math.random() * newOwnerCandidatesIds.length)]

        const newHostMsg: Message = new NewHostMessage(newOwnerId, room.players[newOwnerId].name)
        io.to(await socketPkg.getRoomId()).emit('new_host', newHostMsg);

        updateFilter.push({
            $set: {
                host_player_id: newOwnerId
            },
            $push: {
                messages: newHostMsg
            }
        });

        // change host in local room
        (room as unknown as PrivateRoom).host_player_id = newOwnerId
    }
    //#endregion

    const playersIdList = Object.keys(room.players)
    const state = getRunningState(room)

    //#region END GAME IF THERE IS 1 PLAYER LEFT

    if (playersIdList.length <= 2) {
        const newState: GameState = socketPkg.roomType == 'public' ?
            new PublicLobbyState() :
            new PrivatePreGameState((room as unknown as PrivateRoom).host_player_id)

        const endGameUpdatePkg = GameState.switchState(room, newState)
        updateFilter.push(endGameUpdatePkg)

        const status = endGameUpdatePkg.$set.status
        // add end game bonus
        status.bonus = {
            end_game: room.players
        }

        socketPkg.emitNewStates({ wholeRoom: true }, status, newState)
    }
    //#endregion

    //#region SWITCH STATE IF LEAVING PLAYER HAVE IMPACT ON CURRENT STATE IN RUNNING GAME

    else if (leavingPlayerId == state.player_id && (state.type == PickWordState.TYPE || state.type == DrawState.TYPE)) {
        updateFilter.push(...(await endDrawState(socketPkg, room, leavingPlayerId)))
    }
    //#endregion

    if (playersIdList.length <= 2 && socketPkg.roomType == 'public') {
        // TODO: FIND THE LONE PLAYER A NEW ROOM
        new Promise(async (resolve) => {
            var room = await (socketPkg.room as unknown as Collection<PublicRoom>).findOne({ is_available: true })
        })
    }

    return updateFilter
}