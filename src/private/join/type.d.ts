interface ResponseJoinRoom{
    success: boolean
    data: RoomAndNewPlayer | any
}

interface RoomAndNewPlayer{
    player: player
    room: RoomWithOptions
}

interface RequestJoinRoom{
    player: Player
    code: string
    lang: string
}

interface NewPlayerEmit{
    player: Player
    message: PlayerJoinMessage
}

