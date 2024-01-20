interface ResponseJoinRoom{
    success: boolean
    data: SuccessJoinRoom | object
}

interface SuccessJoinRoom {
    player: Player
    room: JoinRoomData
}

interface JoinRoomData{
    currentRoundStartedAt?: Timestamp
    currentRound?: number
    words?: Array<string>

    messages: Array<MessageFromServer>
    settings: DBRoomSettingsDocument["default"]
    status: string
    code: string
    players: Array<Player>
}

interface RequestJoinRoom{
    player: Player
    code: string
}

interface NewPlayerEmit{
    player: Player
    message: NewPlayerMessageFromServer
}