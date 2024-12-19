//START GAME

//START ROUND

//CHOOSE WORD
//DRAW
//DRAW RESULT

//GAME RESULT

interface GameState {
    type: string
    started_at: Date
}

interface PrivatePreGameState extends GameState{
    type: 'pre_game'
}

interface PublicMatchMakingState extends GameState{
    type: 'match_making'
}

interface DrawState extends GameState{
    type: 'draw'
    word: string
    player_id: string
}

interface DrawResult_ChooseWord extends GameState{
    type: 'draw_result_choose_word'

}

interface DrawResult_StartRound extends GameState{
    type: 'draw_result_start_round'
    word_options: Array<string>
    player_id: string
}

interface DrawResult_GameResult extends GameState{
    type: 'draw_result_game_result'
}

