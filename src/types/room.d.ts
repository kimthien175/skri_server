import { RoomOptions, RoomSettings, RoomSystem } from './type'
import { Message } from './message'
import { GameState } from '../private/state/state'
import { ServerTicket } from './ticket'

export type StateStatus = {
    current_state_id: GameState['id']
} &
    (
        {
            command: 'start'
            date?: Date
        } |
        {
            command: 'end'
            date: Date
            next_state_id: GameState['id']
        } 
    )

export interface ServerRoom {
    players: Player[]
    settings: RoomSettings
    messages: Message[]

    status: StateStatus

    henceforth_states: Record<GameState['id'], GameState>

    old_states: GameState[]

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
