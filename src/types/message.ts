export class Message {
    constructor(type: string) { this.type = type }
    type: string
    timestamp = new Date()
}

export class NewHostMessage extends Message {
    constructor(player_id: string, player_name: string) {
        super('new_host')
        this.player_id = player_id
        this.player_name = player_name
    }
    player_id: string
    player_name: string
}

export class PlayerJoinMessage extends Message {
    constructor(player_id: string, player_name: string){
        super('player_join')
        this.player_id = player_id 
        this.player_name = player_name
    }
    player_id: string
    player_name: string
}

export class PlayerLeaveMessage extends Message {
    constructor(player_id: string, player_name: string) {
        super('player_leave')
        this.player_id = player_id
        this.player_name = player_name
    }

    player_id: string
    player_name: string
}

export class PlayerChatMessage extends Message {
    constructor(player_id: string, player_name: string, text: string) {
        super('player_chat')
        this.player_name = player_name
        this.text = text
        this.player_id = player_id
    }
    player_id: string
    text: string
    player_name: string
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