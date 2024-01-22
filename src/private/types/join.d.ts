interface ResponseJoinRoom{
    success: boolean
    data: RoomAndNewPlayer | object
}

interface RoomAndNewPlayer{
    player: player
    room: WithId<RoomWithOptions>
}

interface RequestJoinRoom{
    player: Player
    code: string
}

interface NewPlayerEmit{
    player: Player
    message: NewPlayerMessageFromServer
}