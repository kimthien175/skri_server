interface Message {
    type: string
    timestamp: Date
}

interface HostingMessage extends Message {
    type: 'hosting'
    player_name: string,
}

interface DrawingMessage extends Message {
    type: 'drawing'
    player_name: string

}

interface GuessMessage extends Message {
    type: 'guess'
    playerName: string
    guess: string

}

interface CorrectGuessMessage extends Message{
    type: 'correct_guess'
    player_name: string

}

//type Message = HostingMessage | DrawingMessage | GuessMessage | CorrectGuessMessage