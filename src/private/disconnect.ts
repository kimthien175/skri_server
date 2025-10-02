import { ObjectId, WithId } from "mongodb";
import { SocketPackage } from "../types/socket_package.js";
import { Mongo } from "../utils/db/mongo.js";
import { PlayerLeaveMessage } from "../types/message.js";
import { GameState } from "./state/state.js";
import { ServerRoom } from "../types/room.js";


export async function onLeavingRoom(socketPkg: SocketPackage) {
    try {
        const filter = socketPkg.getFilter({
            [`players.${socketPkg.playerId}`]: { $exists: true }
        })

        if (socketPkg.isPublicRoom){
            //#region LOBBY CASE
            // if a player is in lobby - which mean alone as well, just delete it
            if ((await Mongo.publicLobby.findOneAndDelete(filter)) != null) return
            //#endregion
        } 

        var room = await socketPkg.room.findOne(filter)
        if (room == null) throw Error('room not found')

        //#region CASE 1: ALONE PLAYER IN ROOM: DELETE ROOM
        if (Object.keys(room.players).length <= 1) {
            console.log('DISCONNECT CASE 1');
            // delete room and move to endedPrivateRoom
            await Mongo.doSession(async (session)=>{
                await socketPkg.room.deleteOne(filter, {session})
                await socketPkg.endedRoom.insertOne(room as WithId<ServerRoom>, {session})
            })
            console.log(`onLeavingPrivateRoom: done moving to endedPrivateRoom`);
            return
        }
        //#endregion

        // no need to delete room, player leave
        const playerLeaveMsg = new PlayerLeaveMessage(socketPkg.playerId as string, socketPkg.name)
        socketPkg.io.to(socketPkg.roomId).emit('player_leave', playerLeaveMsg)

        const updateFilter =
            await GameState.onPlayerLeave(room, socketPkg, playerLeaveMsg)

        var updateResult = await socketPkg.room.updateOne(filter, updateFilter);
        if (updateResult.modifiedCount != 1) throw new Error('update error');

        console.log(`[onLeavingPrivateRoom]: Remove player ${socketPkg.playerId} out of room ${socketPkg.roomId}`);
    } catch (e) {
        console.log(`[DISCONNECT] ${e}`);
    }
}