interface ServerMessage {
    type: string
    timestamp: Date
}

interface NewHostServerMessage extends ServerMessage {
    type: 'new_host'
    player_id: string,
}

interface DrawingServerMessage extends ServerMessage {
    type: 'drawing'
    player_id: string
}

interface GuessServerMessage extends ServerMessage {
    type: 'guess'
    player_id: string
    guess: string
}

interface CorrectGuessMessageFromServer extends ServerMessage {
    type: 'correct_guess'
    player_id: string
}

interface PlayerJoinMessageFromServer extends ServerMessage {
    type: 'player_join',
    player_id: string
}

interface PlayerServerMessage extends ServerMessage {
    type: 'player_leave',
    player_id: string
}
