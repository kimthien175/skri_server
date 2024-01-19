interface ResponseCreatedRoom {
    success: boolean;
    data: CreatedRoomData | object
}

interface CreatedRoomData {
    ownerName?: string
    code: string
    settings: DBRoomSettingsDocument
    message: HostingMessage
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

interface DBRoomOptionsItemMinMax {
    min: number;
    max: number;
}

interface DBRoomOptionsItemList<T> {
    list: Array<T>
}