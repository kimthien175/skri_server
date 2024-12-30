//START GAME

//START ROUND

//CHOOSE WORD
//DRAW
//DRAW RESULT

//GAME RESULT

export class GameState {
    constructor(type: string) { this.type = type }
    type: string
    started_at: Date = new Date()
}

export class PrivatePreGameState extends GameState {
    constructor() { super('pre_game') }
}

interface PickWordState extends GameState {
    player_id: string
    words: Array<string>
    type: 'pick_word'
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

