interface Room {
    players: Array<Player>
    code: string
    status: string
    settings: DBRoomSettingsDocument["default"]
    messages: Array<MessageFromServer>

    currentRoundStartedAt?: Timestamp
    currentRound?: number
    words?: Array<string>
}