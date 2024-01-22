interface Message {
    type: string
    timestamp: Date
}

interface NewHostMessage extends Message {
    type: 'new_host'
    player_id: string,
    player_name:string,
}

interface PlayerJoinMessage extends Message {
    type: 'player_join',
    player_id: string,
    player_name: string,
}

interface PlayerLeaveMessage extends Message {
    type: 'player_leave',
    player_id: string,
    player_name: string,
}

interface PlayerGuessMessage extends Message{
    type: 'player_guess'
    guess: string,
    player_name: string,
}

// do later
// interface DrawingServerMessage extends Message {
//     type: 'drawing'
//     player_id: string
// }

// interface GuessServerMessage extends Message {
//     type: 'guess'
//     player_id: string
//     guess: string
// }

// interface CorrectGuessMessageFromServer extends Message {
//     type: 'correct_guess'
//     player_id: string
// }