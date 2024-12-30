import { RoomSettings } from './type'
import { Message } from './message'
import { GameState } from '../private/state/state'

export interface ServerRoom {
    players: Array<Player>
    settings: RoomSettings
    messages: Message[]

    future_states: Array<GameState>

    states: GameState[]

    code: string
}


type LatestStateRoom<T extends ServerRoom> = Omit<T & { state: GameState }, keyof { states: GameState[] }>

/** ful doc: including states*/
type PublicRoom = ServerRoom

/**ful doc: including states*/
export interface PrivateRoom extends ServerRoom { host_player_id: string }

