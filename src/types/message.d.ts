interface MessageFromServer {
    type: string
    timestamp: Date
}

interface HostingMessageFromServer extends MessageFromServer {
    type: 'hosting'
    player_name: string,
}

interface DrawingMessageFromServer extends MessageFromServer {
    type: 'drawing'
    player_name: string

}

interface GuessMessageFromSever extends MessageFromServer {
    type: 'guess'
    player_name: string
    guess: string

}

interface CorrectGuessMessageFromServer extends MessageFromServer{
    type: 'correct_guess'
    player_name: string

}

//type Message = HostingMessage | DrawingMessage | GuessMessage | CorrectGuessMessage