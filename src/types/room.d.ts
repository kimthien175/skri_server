import { RoomOptions, RoomSettings, RoomSystem } from './type'
import { Message } from './message'
import { GameState } from '../private/state/state'
import { Banned, BlackItem, Kicked } from './black_list'
import { Document, ObjectId } from 'mongodb'
import { ServerTicket } from './ticket'

export interface ServerRoom {
    //_id?:ObjectId
    players: Player[]
    settings: RoomSettings
    messages: Message[]

    future_states: GameState[]

    states: GameState[]

    code: String

    system: RoomSystem

    round_white_list: String[]

    current_round: number

    //black_list?: (Banned | Kicked)[]
    tickets?: ServerTicket[]
}

/** ful doc: including states*/
export interface PublicRoom extends ServerRoom { }

/**ful doc: including states*/
export interface PrivateRoom extends ServerRoom {
    host_player_id: String
    options: RoomOptions
}
