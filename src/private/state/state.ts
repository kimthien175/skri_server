//START GAME

import { ObjectId } from "mongodb"
import { ServerRoom } from "../../types/room"
import { Random } from "../../utils/random/random"

//START ROUND

//CHOOSE WORD
//DRAW
//DRAW RESULT

//GAME RESULT
type MetaDate = { started_at?: Date, previous_state_end_date?: Date }

export class GameState {
    constructor(type: string) {
        this.type = type
        this.id = (new ObjectId()).toString()
    }
    type: string
    started_at?: Date 
    previous_state_end_date?: Date 
    id: string
}

export class PrivatePreGameState extends GameState {
    constructor() { super(PrivatePreGameState.TYPE) }
    static TYPE: string = 'pre_game'
}

export class PickWordState extends GameState {
    constructor(arg: {player_id: String, words: string[], round_notify?: number }) {
        super('pick_word')
        this.player_id = arg.player_id
        this.words = arg.words
        this.round_notify = arg.round_notify 
    }

    static future = (player_id: String, words: string[], round_notify?: number) =>
        new PickWordState({player_id, words, round_notify})

    player_id: String
    words: Array<string>
    round_notify?: number
}

interface DrawState extends GameState {
    word: string
    player_id: string
    type: 'draw'
}

// export class DrawResult_ChooseWord extends GameState{
//     type: 'draw_result_choose_word'
// constructor(){
//     super('')
// }
// }

interface DrawResult_StartRound extends GameState {
    type: 'draw_result_start_round'
    word_options: Array<string>
    player_id: string
}

interface DrawResult_GameResult extends GameState {
    type: 'draw_result_game_result'
}

