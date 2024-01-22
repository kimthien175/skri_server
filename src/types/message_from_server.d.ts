interface MessageFromServer {
    type: string
    timestamp: Date
}

interface HostingMessageFromServer extends MessageFromServer {
    type: 'hosting'
    player_id: string,
}

interface DrawingMessageFromServer extends MessageFromServer {
    type: 'drawing'
    player_id: string

}

interface GuessMessageFromSever extends MessageFromServer {
    type: 'guess'
    player_id: string
    guess: string

}

interface CorrectGuessMessageFromServer extends MessageFromServer{
    type: 'correct_guess'
    player_id: string
}

interface PlayerJoinMessageFromServer extends MessageFromServer{
    type:'player_join',
    player_id: string
}

interface PlayerLeaveFromServer extends MessageFromServer{
    type: 'player_leave',
    player_id: string
}

interface HostLeaveFromServer extends MessageFromServer{
    new_host_id: string
}

//type Message = HostingMessage | DrawingMessage | GuessMessage | CorrectGuessMessage