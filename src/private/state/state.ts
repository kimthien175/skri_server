//START GAME

import { ObjectId } from "mongodb"
import { ServerRoom } from "../../types/room"
import { Random } from "../../utils/random/random"
import { WordMode } from "../../types/type"

//START ROUND

//CHOOSE WORD
//DRAW
//DRAW RESULT

//GAME RESULT
type MetaDate = { started_at?: Date, previous_state_end_date?: Date }

export abstract class GameState {
    constructor(public type: string) {
        this.id = (new ObjectId()).toString()
    }
    start_date?: Date
    end_date?: Date
    id: string

    static removeSensitiveProperties(raw: GameState) {
        switch (raw.type) {
            case PickWordState.TYPE:
                delete (raw as PickWordState).words
                break;
            case DrawState.TYPE:
                delete (raw as DrawState).word
                break;
            default:
                break;
        }
    }
}

export class PrivatePreGameState extends GameState {
    constructor() { super(PrivatePreGameState.TYPE) }
    static TYPE: string = 'pre_game'

    // removeSensitiveProperties() { }
}

export class PickWordState extends GameState {
    constructor(arg: { player_id: string, words: string[], round_notify?: number }) {
        super(PickWordState.TYPE)
        this.player_id = arg.player_id
        this.words = arg.words
        this.round_notify = arg.round_notify
    }

    player_id: string
    words?: Array<string>
    round_notify?: number

    static TYPE = 'pick_word'

    // removeSensitiveProperties() {
    //     delete this.words
    // }
}

export class DrawState extends GameState {
    constructor(arg: { player_id: string, word: string, word_mode: WordMode }) {
        super(DrawState.TYPE)
        this.player_id = arg.player_id
        this.word = arg.word
        if (arg.word_mode != 'Hidden')
            this.hint = arg.word.replaceAll(/\S/g, '_')

        //this.draw_data = {tail_id:0, past_steps:{}, current_step: null}
    }
    word?: string
    hint?: string
    player_id: string
    static TYPE = 'draw'

    removeSensitiveProperties() {
        delete this.word
    }

    //TODO: when draw state end, move draw data to this
    draw_data?: DrawData

    static isFirstStepEver(drawData: DrawData): boolean {
        return Object.keys(drawData.past_steps).length == 0 && drawData.current_step == null
    }
}