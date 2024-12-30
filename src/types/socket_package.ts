
import { Server, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { Mongo } from '../utils/db/mongo.js';


export class SocketPackage {
    constructor(io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
        socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
        this.io = io;
        this.socket = socket;
    }
    io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
    socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>

    _roomCode?: string
    get roomCode(): string { return this._roomCode as string }
    set roomCode(code: string) { this._roomCode = code }

    _name?: string
    get name(): string { return this._name as string }
    set name(name: string) { this._name = name }

    get room() {
        return this.isPublicRoom ? Mongo.publicRooms : Mongo.privateRooms
    }

    get isPublicRoom() { return this.roomCode.startsWith('p') }

    _isOwner?: boolean
    set isOwner(value: boolean) { this._isOwner = value }
    get isOwner() { return this._isOwner === true }
}