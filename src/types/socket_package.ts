import { Server, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

export class SocketPackage {
    constructor(io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
        socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, roomCode: string) {
        this.io = io;
        this.socket = socket;
        this.roomCode = roomCode;
    }
    io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
    socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
    roomCode: string
    isOwner?: boolean
}