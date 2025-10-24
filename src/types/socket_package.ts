import { BroadcastOperator, Socket } from 'socket.io';
import { DecorateAcknowledgementsWithMultipleResponses, DefaultEventsMap } from 'socket.io/dist/typed-events';
import { Mongo } from '../utils/db/mongo.js';
import { PrivateRoom, PublicRoom, ServerRoom, StateStatus } from './room.js';
import { Collection, ObjectId, UpdateFilter, WithId } from 'mongodb';
import { GameState } from '../private/state/state.js';
import { Player } from './player.js';
import cryptoRandomString from "crypto-random-string";
import { io } from '../socket_io.js';
import { Redis } from '../utils/redis.js';

type _PUBLIC = 'public'
type _PRIVATE = 'private'
type RoomType = _PUBLIC | _PRIVATE

type _MappingRoomType<T> = T extends PrivateRoom ? _PRIVATE : T extends PublicRoom ? _PUBLIC : never

//export type AnyRoom = PublicRoom | PrivateRoom
export class SocketPackage<T extends ServerRoom = ServerRoom> {
    constructor(
        public socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) { }

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
        return (this.roomType == 'public' ? Mongo.publicRooms : Mongo.privateRooms) as unknown as Collection<T>
    }

    async getFilter(addOn?: UpdateFilter<ServerRoom>): Promise<UpdateFilter<ServerRoom>> {
        var roomId = await Redis.getRoomId(this.socket.id)
        return { _id: new ObjectId(roomId), ...addOn }
    }

    get endedRoom(): Collection<ServerRoom> {
        return (this.roomType == 'public' ? Mongo.endedPublicRooms : Mongo.endedPrivateRooms) as unknown as Collection<ServerRoom>
    }

    // _isOwner?: boolean
    // set isOwner(value: boolean) { this._isOwner = value }
    // get isOwner() { return this._isOwner === true }

    playerId?: string

    async emitNewStates(to: { wholeRoom: true } | { except: Player['id'] } | { only: Player['id'] }, status: StateStatus, state: GameState) {
        var sender: BroadcastOperator<DecorateAcknowledgementsWithMultipleResponses<DefaultEventsMap>, any>

        var roomId = await Redis.getRoomId(this.socket.id)

        if ((to as any).wholeRoom != undefined) {
            sender = io.to(roomId)
        } else {
            var except: Player['id'] = (to as any).except
            if (except != undefined) {
                sender = io.to(roomId).except(except)
            } else {
                sender = io.to((to as any).only)
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