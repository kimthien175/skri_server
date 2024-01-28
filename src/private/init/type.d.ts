interface ResponseCreatedRoom {
    success: boolean;
    data: CreatedRoom | object
}

interface CreatedRoom {
    ownerName?: string,
    player_id: string
    code: string
    settings: DBRoomSettingsDocument
    message: NewHostMessage
}

interface DBRoomSettingsDocument extends Document {
    default: RoomSettings
    options: RoomOptions
}

interface DBRoomOptionsItemMinMax {
    min: number;
    max: number;
}

interface DBRoomOptionsItemList<T> {
    list: Array<T>
}

interface RoomOptions{
    players: DBRoomOptionsItemMinMax,
    language: DBRoomOptionsItemList<string>,
    drawtime: DBRoomOptionsItemList<number>,
    rounds: DBRoomOptionsItemMinMax,
    word_mode: DBRoomOptionsItemList<string>,
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
    drawtime: number;
    rounds: number;
    word_mode: 'Normal' | 'Hidden' | 'Combination';
    word_count: number;
    hints: number;
    use_custom_words_only: boolean
    custom_words: Array<string>
}