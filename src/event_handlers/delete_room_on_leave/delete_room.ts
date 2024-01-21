import { Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { endedPrivateRoomCollection, privateRoomCollection } from "../../utils/db/collection.js";
import { mongoClient } from "../../utils/db/mongo.js";

export function registerDeleteRoomOnLeave(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
    socket.on('delete_room_on_leave', async function (roomCode, callback) {
        console.log('DELETE_ROOM_ON_LEAVE');
        try {
            // delete room
            var deletedRoom = await (await privateRoomCollection()).findOneAndDelete({ code: roomCode })
            console.log('done delete room');
            // move to ended
            if (deletedRoom != null) {
                const { _id, ...roomData  } = deletedRoom;
                await (await endedPrivateRoomCollection()).insertOne(roomData as Document).catch((e) => { console.log(e); })
                console.log('done insert deleted room to ended rooms');
            }
        } catch (e) {
            console.log('DELETE_ROOM_ON_LEAVE_ERROR');
            console.log(e);
        } finally {
            mongoClient.close()
            callback('whatever, just disconnec')
        }
    })
}
