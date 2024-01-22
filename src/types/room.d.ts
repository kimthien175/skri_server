interface Room {
    players: Array<Player>
    code: string
    status: string
    settings:RoomSettings
    messages: Array<MessageFromServer>

    currentRoundStartedAt?: Timestamp
    currentRound?: number
    words?: Array<string>
}

interface RoomWithOptions extends Room{
    options: RoomOptions
}