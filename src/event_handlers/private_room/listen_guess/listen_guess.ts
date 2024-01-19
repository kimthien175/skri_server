import { Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

export function registerListenChatMessages(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
    socket.on('guess', function (arg: GuessMessageFromClient) {
        console.log('RECIEVE MSG FROM CLIENT');
        console.log(arg);
        console.log(socket.rooms);
    })
}