import { RoomOptions, RoomSettings, RoomSystem } from './type'
import { Message } from './message'
import { GameState } from '../private/state/state'
import { BlackItem } from './black_list'

export interface ServerRoom {
    players: Player[]
    settings: RoomSettings
    messages: Message[]

    future_states: GameState[]

    states: GameState[]

    code: string

    system: RoomSystem

    round_white_list: string[]

    current_round: number 

    black_list?: BlackItem[]
}

/** ful doc: including states*/
export interface PublicRoom extends ServerRoom { }

/**ful doc: including states*/
export interface PrivateRoom extends ServerRoom {
    host_player_id: string
    options: RoomOptions
}
