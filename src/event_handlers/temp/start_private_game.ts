import { Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

export function registerStartPrivateGame(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>){
socket.on('start_private_game', function (callback){








    callback()
})
}