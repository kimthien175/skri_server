interface Room {
    players: Array<Player>,
    host_player_id: string,
    code: string
    settings:RoomSettings
    messages: Array<MessageFromServer>

    states: Array<GameState>,
    future_states?: Array<GameState>
}

interface RoomWithOptions extends Room{
    options: RoomOptions
}