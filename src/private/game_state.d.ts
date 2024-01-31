interface GameState {
    type: string
}
interface StartPrivateGameState extends GameState {
    type: 'start_private_game'
    word_options: any
    player_id: string
    started_at: Date
}

interface DrawState extends GameState {
    type: 'draw_state'
    word: string
    player_id: string
    started_at: Date
}