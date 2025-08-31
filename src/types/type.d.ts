import { ServerRoom } from "./room"
import { Player} from './player'

type RoomResponse<T extends ServerRoom> =
    {
        success: true
        data: RoomResponseData<T>
    }
    | {
        success: false
        data: {type: 'room_not_found'}  | {type: 'room_full'}
    }

interface RoomResponseData< T extends  ServerRoom> {
    player: Player
    room: T
}

interface Specs{
    settings: RoomSettings
    options: RoomOptions
    system: RoomSystem
}

interface RoomSystem {
    pick_word_time: number
    kick_interval: number
}

interface DBRoomOptionsItemMinMax {
    min: number;
    max: number;
}

type Language = 'en_US' | 'vi_VN'

interface RoomOptions {
    players: DBRoomOptionsItemMinMax,
    language: Array<Language>,
    draw_time: Array<number>,
    rounds: DBRoomOptionsItemMinMax,
    word_mode: Array<string>,
    word_count: DBRoomOptionsItemMinMax,
    hints: DBRoomOptionsItemMinMax,
    custom_words_rules: {
        min_words: number;
        min_char_per_word: number;
        max_char_per_word: number;
        max_char: number
    }
}

type WordMode = 'Normal' | 'Hidden' | 'Combination'

type NonEmptyArray<T> = [T,...T[]]
type  RoomSettings ={
    players: number;
    language: Language;
    rounds: number;
    word_mode: WordMode;
    word_count: number;
    hints: number;
    draw_time: number;
    
} & ({
    use_custom_words_only: true
    custom_words: NonEmptyArray<string>
} | {
    use_custom_words_only?: false 
    custom_words?: NonEmptyArray<string>
} )

interface RoomRequestPackage {
    player: Player
    lang: Language
}

interface PrivateRoomJoinRequest extends RoomRequestPackage {
    code: string
}

interface JoinRoomRequestPackage extends RoomRequestPackage{
    code: string
}

interface PrivateRoomRejoinRequest extends RoomRequestPackage{
    ticket_id: string 
    room_id: string
}

type Mutable<T> = {
    -readonly [K in keyof T]: T[K];
};