import { ServerRoom } from "./room"


type RoomResponse<T extends ServerRoom> =
    {
        success: true
        data: RoomResponseData<T>
    }
    | {
        success: false
        data: object
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
}

interface DBRoomOptionsItemMinMax {
    min: number;
    max: number;
}

interface RoomOptions {
    players: DBRoomOptionsItemMinMax,
    language: Array<string>,
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

interface RoomSettings {
    players: number;
    language: string;
    draw_time: number;
    pick_word_time: number;
    rounds: number;
    word_mode: 'Normal' | 'Hidden' | 'Combination';
    word_count: number;
    hints: number;
    use_custom_words_only: boolean
    custom_words: Array<string>
}

interface RoomRequestPackage {
    player: Player
    lang: string
}

interface PrivateRoomJoinRequest extends RoomRequestPackage {
    code: string
}

interface JoinRoomRequestPackage extends RoomRequestPackage{
    code: string
}