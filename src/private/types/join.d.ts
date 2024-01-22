interface ResponseJoinRoom{
    success: boolean
    data: RoomWithNewPlayer | object
}

interface RoomWithNewPlayer {
    player: Player
    room: Room
}

interface RequestJoinRoom{
    player: Player
    code: string
}

interface NewPlayerEmit{
    player: Player
    message: NewPlayerMessageFromServer
}