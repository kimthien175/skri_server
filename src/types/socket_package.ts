import { BroadcastOperator, Server, Socket } from 'socket.io';
import { DecorateAcknowledgementsWithMultipleResponses, DefaultEventsMap } from 'socket.io/dist/typed-events';
import { Mongo } from '../utils/db/mongo.js';
import { PrivateRoom, PublicRoom, ServerRoom, StateStatus } from './room.js';
import { Collection, ObjectId, UpdateFilter, WithId } from 'mongodb';
import { GameState } from '../private/state/state.js';
import { Player } from './player.js';
import cryptoRandomString from "crypto-random-string";

type _PUBLIC = 'public'
type _PRIVATE = 'private'
type RoomType = _PUBLIC | _PRIVATE

type _MappingRoomType<T> = T extends PrivateRoom ? _PRIVATE : T extends PublicRoom ? _PUBLIC: never
type _MappingIsPublic<T> = T extends PrivateRoom ? false : T extends PublicRoom ? true : never

//export type AnyRoom = PublicRoom | PrivateRoom
export class SocketPackage<T extends ServerRoom = ServerRoom> {
    constructor(io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
        socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
        this.io = io;
        this.socket = socket;
    }
    io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
    socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>

    _roomId?: string
    get roomId(): string { return this._roomId as string }
    set roomId(code: string) { this._roomId = code }

    _name?: string
    get name(): string { return this._name as string }
    set name(name: string) { this._name = name }

    _roomType?: _MappingRoomType<T>

    set roomType(type: _MappingRoomType<T>) { this._roomType = type }
    get roomType(): RoomType {
        if (this._roomType == null) throw Error('Unset room type')
        return this._roomType
    }

    get room(): Collection<T> {
        return Mongo._db.collection(this.roomType)
    }

    getFilter(addOn?: UpdateFilter<ServerRoom>): UpdateFilter<ServerRoom> {
        return { _id: new ObjectId(this.roomId), ...addOn }
    }

    get endedRoom(): Collection<ServerRoom> {
        return Mongo._db.collection(`ended_${this.roomType}`)
    }

    get isPublicRoom(): _MappingIsPublic<T> { return (this.roomType === 'public')  as _MappingIsPublic<T> }

    _isOwner?: boolean
    set isOwner(value: boolean) { this._isOwner = value }
    get isOwner() { return this._isOwner === true }

    playerId?: string

    emitNewStates(to: { wholeRoom: true } | { except: Player['id'] } | { only: Player['id'] }, status: StateStatus, state: GameState) {
        var sender: BroadcastOperator<DecorateAcknowledgementsWithMultipleResponses<DefaultEventsMap>, any>
        if ((to as any).wholeRoom != undefined) {
            sender = this.io.to(this.roomId)
        } else {
            var except: Player['id'] = (to as any).except
            if (except != undefined) {
                sender = this.io.to(this.roomId).except(except)
            } else {
                sender = this.io.to((to as any).only)
            }
        }

        sender.emit('new_states', {
            status,
            henceforth_states: {
                [state.id]: state
            }
        })
    }
}

const codeLength = 4; // code including numeric chars or lowercase alphabet chars or both
export async function getNewRoomCode(roomType: RoomType) {
    var _codeLength = codeLength
    var code: String
    var existingRoom: WithId<ServerRoom> | null

    do {
        code = cryptoRandomString({ length: _codeLength, type: "alphanumeric" }).toLowerCase();
        if (roomType == 'public') code = `p_${code}`
        existingRoom = await (Mongo._db.collection(roomType) as Collection<ServerRoom>).findOne({ code: code })
        _codeLength++
    } while (existingRoom != null)

    return code
}