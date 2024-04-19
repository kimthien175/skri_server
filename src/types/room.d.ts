interface Room {
    players: Array<Player>
    code: string
    settings:RoomSettings
    messages: Array<MessageFromServer>

    currentRound?: {
        round: number
        white_list: array<Player>
        state: GameState
    }

    state: {
        type: string
    }
}

interface RoomWithOptions extends Room{
    options: RoomOptions
}