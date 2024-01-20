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

interface NewPlayerMessageFromServer extends MessageFromServer{
    type:'new_player',
    player_id: string
}

//type Message = HostingMessage | DrawingMessage | GuessMessage | CorrectGuessMessage