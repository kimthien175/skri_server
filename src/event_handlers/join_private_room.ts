import { Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

export function registerJoinPrivateRoom(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
    socket.on('join_private_room', async function (player: Player, roomCode: string,  callback) {

    })
}

