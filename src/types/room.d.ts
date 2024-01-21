interface Room {
    currentRoundStartedAt?: Timestamp
    currentRound?: number
    words?: Array<string>

    messages: Array<MessageFromServer>
    settings: DBRoomSettingsDocument["default"]
    status: string
    code: string
    players: Array<Player>
}