import { RoomOptions, RoomSettings, RoomSystem } from './type'
import { Message } from './message'
import { GameState } from '../private/state/state'

export interface ServerRoom {
    players: Array<Player>
    settings: RoomSettings
    messages: Message[]

    future_states: Array<GameState>

    states: GameState[]

    code: string

    system: RoomSystem

    round_white_list: string[]

    current_round: number
}

/** ful doc: including states*/
export interface PublicRoom extends ServerRoom { }

/**ful doc: including states*/
export interface PrivateRoom extends ServerRoom {
    host_player_id: string
    options: RoomOptions
}
