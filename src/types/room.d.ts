import { RoomOptions, RoomSettings, RoomSystem } from './type'
import { Message } from './message'
import { GameState } from '../private/state/state'
import { BlackItem } from './black_list'
import { Document, ObjectId } from 'mongodb'

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

    black_list?: BlackItem[]
}

/** ful doc: including states*/
export interface PublicRoom extends ServerRoom { }

/**ful doc: including states*/
export interface PrivateRoom extends ServerRoom {
    host_player_id: String
    options: RoomOptions
}
