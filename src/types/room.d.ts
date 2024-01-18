interface DBRoomOptionsItemMinMax {
    min: number;
    max: number;
}

interface DBRoomOptionsItemList<T> {
    list: Array<T>
}

interface DBRoomSettings {
    players: number;
    language: string;
    drawtime: number;
    rounds: number;
    word_mode: string;
    word_count: number;
    hints: number,
    use_custom_words_only: boolean,

    custom_words?: Array<string>
}

interface DBRoomSettingsDocument extends Document {
    default: {
        players: number;
        language: string;
        drawtime: number;
        rounds: number;
        word_mode: string;
        word_count: number;
        hints: number;
    };
    options: {
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
}

interface SucceededCreatedRoomData {
    ownerName?: string;
    code: string;
    settings: DBRoomSettingsDocument;
}

interface ResponseCreatedRoomData {
    success: boolean;
    data: SucceededCreatedRoomData | object
}