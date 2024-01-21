import { Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { endedPrivateRoomCollection, privateRoomCollection } from "../../utils/db/collection.js";
import { mongoClient } from "../../utils/db/mongo.js";

export function registerDeleteRoom(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
    socket.on('delete_room', async function (roomCode) {
        try {
            // delete room
            var deletedRoom = await (await privateRoomCollection()).findOneAndDelete({ code: roomCode })
            console.log('done delete room');
            console.log(deletedRoom);
            // move to ended
            if (deletedRoom != null) {
                const { _id, ...roomData  } = deletedRoom;
                console.log(roomData);
                await (await endedPrivateRoomCollection()).insertOne(roomData as Document).catch((e) => { console.log(e); })
                console.log('done insert deleted room to ended rooms');
            }
        } catch (e) {
            console.log('error on delete_room');
        } finally {
            mongoClient.close()
        }
    })
}
