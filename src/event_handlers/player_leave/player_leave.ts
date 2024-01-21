import { Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { Collection } from "mongodb";
import { mongoClient } from "../../utils/db/mongo.js";
import { privateRoomCollection, publicRoomCollection } from "../../utils/db/collection.js";

function baseRegisterLeaveRoom(event: string, socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, collectionCallback: () => Promise<Collection<Document>>){
    socket.on(event, async function (roomCode, callback) {
        (await collectionCallback()).findOneAndUpdate(
            { code: roomCode },
            {
                $push: {
                    messages: {
                        type: 'player_leave',
                        player_id: socket.id,
                        timestamp: new Date()
                    }
                },
                $pull: {
                    players: { id: socket.id }
                }
            },
            { returnDocument: 'after' }
        ).finally(() => {
            mongoClient.close();
        })

        console.log(`remove player ${socket.id} and add message to db`);

        console.log(`Remove player ${socket.id} out of room ${roomCode}`);

        socket.to(roomCode).emit("player_leave", socket.id);
        callback('')
    });
}

export function registerLeaveRoom(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> ){
    baseRegisterLeaveRoom('player_leave_on_private_room', socket, privateRoomCollection);
    baseRegisterLeaveRoom('player_leave_on_public_room', socket, publicRoomCollection);
}
