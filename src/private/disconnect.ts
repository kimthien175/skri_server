import { OptionalId } from "mongodb";

import { SocketPackage } from "../types/socket_package.js";
import { Mongo } from "../utils/db/mongo.js";
import { Message, NewHostMessage, PlayerLeaveMessage } from "../types/message.js";



export async function onLeavingPrivateRoom(socketPkg: SocketPackage) {
    try {
        await Mongo.connect();
        var collection = Mongo.privateRooms;
        var foundRoomDoc = await collection.findOne({ code: socketPkg.roomCode })

        // ROOM NULL
        if (foundRoomDoc == null) {
            console.log(`roomCode: ${socketPkg.roomCode}`);
            throw Error('onLeavingPrivateRoom: Unhandled usecase')
        }

        // CASE 1: ALONE PLAYER IN ROOM: DELETE ROOM
        if (foundRoomDoc.players.length == 1) {
            // delete room and move to endedPrivateRoom
            await Promise.all([
                collection.deleteOne({ code: socketPkg.roomCode }),
                Mongo.endedPrivateRooms().insertOne(foundRoomDoc as unknown as OptionalId<Document>)
            ])
            console.log(`onLeavingPrivateRoom: done moving to endedPrivateRoom`);
            // END FUNCTION
            return
        }

        // var playerName: string = '__'
        // for (var i = 0; i < foundRoomDoc.players.length; i++) {
        //     if (foundRoomDoc.players[i].id == socketPkg.socket.id) {
        //         playerName = foundRoomDoc.players[i].name;
        //         break;
        //     }
        // }
        // no need to delete room, player leave
        // prepare message for case
        const playerLeaveMsg = new PlayerLeaveMessage(socketPkg.socket.id, socketPkg.name)

        // CASE 2: ROOM HAS MANY PLAYERS, THIS PLAYER IS HOST
        if (socketPkg.isOwner) {
            // TODO: HOW ABOUT GAME IS PLAYING?
            // pass ownership to randomized player

            // get randomized player
            var newOwnerIndex: number
            var players = foundRoomDoc.players
            do {
                newOwnerIndex = Math.floor(Math.random() * players.length)
            } while (players[newOwnerIndex].id == socketPkg.socket.id)

            var newOwnerId = players[newOwnerIndex].id

            const newHostMsg = new NewHostMessage(newOwnerId, players[newOwnerIndex].name)

            await collection.updateOne({ code: socketPkg.roomCode },
                {
                    $push: { messages: { $each: [playerLeaveMsg, newHostMsg] as Message[] } },

                    $pull: { players: { id: socketPkg.socket.id }, whiteList: socketPkg.socket.id }
                },
            );

            await collection.updateOne({ code: socketPkg.roomCode },
                { $set: { "players.$[element].isOwner": true } },
                { arrayFilters: [{ "element.id": newOwnerId }] }
            );
            console.log(`onLeavingPrivateRoom: Pass owner ship to player: ${newOwnerId}`);

            (newHostMsg as any).settings = foundRoomDoc.settings

            socketPkg.io.to(socketPkg.roomCode).emit('host_leave', [playerLeaveMsg, newHostMsg])
        }

        // CASE 3: ROOM HAS MANY PLAYERS, THIS PLAYER IS NOT NOT HOST
        else {
            // TODO: HOW ABOUT GAME IS PLAYING?
            // room still has players and this player just leave
            await collection.updateOne(
                { code: socketPkg.roomCode },
                {
                    $push: {
                        messages: playerLeaveMsg
                    },
                    $pull: {
                        players: {
                            id: socketPkg.socket.id//, whiteList: socketPkg.socket.id 

                        }
                    }
                }
            );
            // notify every one
            socketPkg.io.to(socketPkg.roomCode).emit('player_leave', playerLeaveMsg)
        }

        console.log(`onLeavingPrivateRoom: Remove player ${socketPkg.socket.id} out of room ${socketPkg.roomCode}`);
    } catch (e) {
        console.log('disconnect');
        console.log(e);
    }
}