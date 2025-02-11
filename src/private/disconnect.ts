import { ObjectId, OptionalId, UpdateFilter } from "mongodb";

import { SocketPackage } from "../types/socket_package.js";
import { Mongo } from "../utils/db/mongo.js";
import { Message, NewHostMessage, PlayerLeaveMessage } from "../types/message.js";
import { PrivateRoom } from "../types/room.js";



export async function onLeavingPrivateRoom(socketPkg: SocketPackage) {
    try {
        var collection = Mongo.privateRooms;
        var roomObjId = new ObjectId(socketPkg.roomId)
        var foundRoomDoc = await collection.findOne({ _id: roomObjId })
        // ROOM NULL
        if (foundRoomDoc == null) {
            console.log(`roomId: ${socketPkg.roomId}`);
            console.log('onLeavingPrivateRoom: Unhandled usecase')
            return
        }

        // if player disconnected by being kicked or banned, do nothing at all
        if (foundRoomDoc.players.find((e) => e.id == socketPkg.socket.id) === undefined) return

        //#region CASE 1: ALONE PLAYER IN ROOM: DELETE ROOM
        if (foundRoomDoc.players.length <= 1) {
            console.log('DISCONNECT CASE 1');
            // delete room and move to endedPrivateRoom
            await Promise.all([
                collection.deleteOne({ _id: roomObjId }),
                Mongo.endedPrivateRooms().insertOne(foundRoomDoc)
            ])
            console.log(`onLeavingPrivateRoom: done moving to endedPrivateRoom`);
            return
        }
        //#endregion

        // no need to delete room, player leave
        // prepare message for case
        const playerLeaveMsg = new PlayerLeaveMessage(socketPkg.socket.id, socketPkg.name)
        var messages: Message[] = [playerLeaveMsg]
        var updateFilter: UpdateFilter<PrivateRoom> = {
            $push: {
                messages: { $each: messages }
            },
            $pull: {
                players: { id: socketPkg.socket.id },
                round_white_list: socketPkg.socket.id
            }
        }

        //#region CASE 2: ROOM HAS MANY PLAYERS, THIS PLAYER IS HOST
        if (socketPkg.isOwner) {
            console.log('DISCONNECT CASE 2: change room owner');
            // pass ownership to randomized player
            // get randomized player
            var newOwnerIndex: number
            var players = foundRoomDoc.players
            do {
                newOwnerIndex = Math.floor(Math.random() * players.length)
            } while (players[newOwnerIndex].id == socketPkg.socket.id)

            var newOwnerId = players[newOwnerIndex].id

            const newHostMsg = new NewHostMessage(newOwnerId, players[newOwnerIndex].name)

            updateFilter.$set = { host_player_id: newOwnerId }
            messages.push(newHostMsg)

            console.log(`onLeavingPrivateRoom: Pass owner ship to player: ${newOwnerId}`);

            //#region SAME_FOR_ALL_CASE
            var updateResult = await collection.updateOne({ _id: roomObjId }, updateFilter);

            if (!(updateResult.acknowledged && updateResult.modifiedCount == 1)) throw new Error('update error');

            // notify every one
            socketPkg.io.to(socketPkg.roomId).emit('player_leave', playerLeaveMsg)

            console.log(`onLeavingPrivateRoom: Remove player ${socketPkg.socket.id} out of room ${socketPkg.roomId}`)
            //#endregion

            socketPkg.io.to(socketPkg.roomId).except(newOwnerId).emit('new_host', newHostMsg)

            newHostMsg.settings = foundRoomDoc.settings
            socketPkg.io.to(newOwnerId).emit('new_host', newHostMsg)

            return
        }
        //#endregion

        //#region SAME_FOR_ALL_CASE
        var updateResult = await collection.updateOne({ _id: roomObjId }, updateFilter);

        if (!(updateResult.acknowledged && updateResult.modifiedCount == 1)) throw new Error('update error');

        // notify every one
        socketPkg.io.to(socketPkg.roomId).emit('player_leave', playerLeaveMsg)

        console.log(`onLeavingPrivateRoom: Remove player ${socketPkg.socket.id} out of room ${socketPkg.roomId}`);
        //#endregion
    } catch (e) {
        console.log('disconnect');
        console.log(e);
    }
}