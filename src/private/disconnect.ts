import { ObjectId, UpdateFilter } from "mongodb";
import { SocketPackage } from "../types/socket_package.js";
import { Mongo } from "../utils/db/mongo.js";
import { PlayerLeaveMessage } from "../types/message.js";
import { getRunningState, PrivateRoom } from "../types/room.js";
import { GameState } from "./state/state.js";


export async function onLeavingRoom(socketPkg: SocketPackage) {
    try {
        const filter = {
            _id: new ObjectId(socketPkg.roomId),
            [`players.${socketPkg.playerId}`]: { $exists: true }
        }

        var room = await socketPkg.room.findOne(filter)
        if (room == null) throw Error('room not found')

        //#region CASE 1: ALONE PLAYER IN ROOM: DELETE ROOM
        if (Object.keys(room.players).length <= 1) {
            console.log('DISCONNECT CASE 1');
            // delete room and move to endedPrivateRoom
            await Promise.all([
                socketPkg.room.deleteOne(filter),
                Mongo.endedPrivateRooms.insertOne(room)
            ])
            console.log(`onLeavingPrivateRoom: done moving to endedPrivateRoom`);
            return
        }
        //#endregion

        // no need to delete room, player leave
        const playerLeaveMsg = new PlayerLeaveMessage(socketPkg.playerId as string, socketPkg.name)
        socketPkg.io.to(socketPkg.roomId).emit('player_leave', playerLeaveMsg)

        var state = getRunningState(room)
        var updateFilter: UpdateFilter<PrivateRoom> =
            (state.player_id == socketPkg.playerId) ?
                await GameState.onMainPlayerLeave(room, state, socketPkg, playerLeaveMsg)
                : {
                    $push: { messages: playerLeaveMsg },
                    $unset: {
                        [`players.${socketPkg.playerId}`]: "",
                        [`current_round_done_players.${socketPkg.playerId}`]: ""
                    }
                }
        console.log(updateFilter);
        var updateResult = await socketPkg.room.updateOne(filter, updateFilter);
        if (updateResult.modifiedCount != 1) throw new Error('update error');

        console.log(`onLeavingPrivateRoom: Remove player ${socketPkg.playerId} out of room ${socketPkg.roomId}`);
    } catch (e) {
        console.log(`[DISCONNECT] ${e}`);
    }
}