import { Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { privateRoomCollection } from "../../utils/db/collection.js";

export async function storeMessage(roomCode: string, message: ServerMessage) {
    return (await privateRoomCollection()).updateOne({ code: roomCode }, { $push: { messages: message } })
}

export function registerListenChatMessages(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
    socket.on('chat', function (arg: GuessMessageFromClient) {
        console.log('RECIEVE MSG FROM CLIENT');
        console.log(arg);

        // send message to any one in the room except this socket
        var msg: GuessServerMessage = { type: 'guess', player_id: socket.id, guess: arg.guess, timestamp: new Date() }

        socket.to(arg.room).emit('message_from_server', msg)

        console.log('store to db');
        storeMessage(arg.room, msg).then((_) => {
            console.log('update msg success');
        }).catch((e) => {
            console.log(e);
        })
    })
}