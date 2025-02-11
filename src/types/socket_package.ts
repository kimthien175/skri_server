
import { Server, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { Mongo } from '../utils/db/mongo.js';
import { ServerRoom } from './room.js';
import { Collection } from 'mongodb';


export class SocketPackage {
    constructor(io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
        socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
        this.io = io;
        this.socket = socket;
    }
    io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
    socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>

    _roomId?: string
    get roomId(): string { return this._roomId as string}
    set roomId(code: string) { this._roomId = code }

    _name?: string
    get name(): string { return this._name as string }
    set name(name: string) { this._name = name }

    get room(): Collection<ServerRoom> {
        return this.isPublicRoom ? Mongo.publicRooms : Mongo.privateRooms as unknown as Collection<ServerRoom>
    }

    _isPublicRoom?:boolean
    get isPublicRoom(): boolean{return this._isPublicRoom === true}
    set isPublicRoom(value: boolean){this._isPublicRoom=value}

    _isOwner?: boolean
    set isOwner(value: boolean) { this._isOwner = value }
    get isOwner() { return this._isOwner === true }
}