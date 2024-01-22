import { OptionalId, WithId } from "mongodb";

import { mongoClient } from "../utils/db/mongo.js";
import { SocketPackage } from "../types/socket_package.js";
import { endedPrivateRoomCollection, privateRoomCollection } from "../utils/db/collection.js";



export async function onLeavingPrivateRoom(socketPkg: SocketPackage) {
    try {
        var collection = (await privateRoomCollection())
        var foundRoomDoc: WithId<Room> | null = await collection.findOne({ code: socketPkg.roomCode }) as WithId<Room> | null
        if (foundRoomDoc == null){
            console.log(`roomCode: ${socketPkg.roomCode}`);
            throw Error('onLeavingPrivateRoom: Unhandled usecase')
        }


        if (foundRoomDoc.players.length == 1) {
            // delete room and move to endedPrivateRoom
            await Promise.all([
                collection.deleteOne({ code: socketPkg.roomCode }),
                (await endedPrivateRoomCollection()).insertOne(foundRoomDoc as unknown as OptionalId<Document>)
            ])
            console.log(`onLeavingPrivateRoom: done moving to endedPrivateRoom`);
            // END FUNCTION
            return
        }

        // no need to delete room, player leave
        // prepare message for case
        var playerLeaveMsg: PlayerServerMessage = {
            type: 'player_leave',
            player_id: socketPkg.socket.id,
            timestamp: new Date()
        }

        if (socketPkg.isOwner) {
            // pass ownership to randomized player

            // get randomized player
            var newOwnerIndex: number
            var players = foundRoomDoc.players
            do {
                newOwnerIndex = Math.floor(Math.random() * players.length)
            } while (players[newOwnerIndex].id == socketPkg.socket.id)

            var newOwnerId = players[newOwnerIndex].id

            var newHostMsg: NewHostServerMessage={
                type: 'new_host',
                player_id: newOwnerId,
                timestamp: new Date()
            }

            await collection.updateOne({ code: socketPkg.roomCode },
                {
                    $push: {
                        messages: [playerLeaveMsg, newHostMsg]
                    },
                    $pull: {
                        players: { id: socketPkg.socket.id }
                    },
                    $set: { "players.$[e].isOwner": true }
                },
                {
                    arrayFilters: [{ "e.id": newOwnerId }]
                }
            )
            console.log(`onLeavingPrivateRoom: Pass owner ship to player: ${newOwnerId}`);


            socketPkg.io.to(socketPkg.roomCode).emit('host_leave', [playerLeaveMsg, newHostMsg])
        } else {
            // room still has players and this player just leave
            await collection.updateOne(
                { code: socketPkg.roomCode },
                {
                    $push: {
                        messages: playerLeaveMsg
                    },
                    $pull: {
                        players: { id: socketPkg.socket.id }
                    }
                }
            );
            // notify every one
            socketPkg.io.to(socketPkg.roomCode).emit('player_leave', playerLeaveMsg)
        }

        console.log(`onLeavingPrivateRoom: Remove player ${socketPkg.socket.id} out of room ${socketPkg.roomCode}`);
    } finally {
        mongoClient.close()
    }
}