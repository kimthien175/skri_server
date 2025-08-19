import { RoomSettings } from "./type"

export class Message {
    constructor(type: string) { this.type = type }
    type: string
    timestamp = new Date()
}

export class NewHostMessage extends Message {
    constructor(player_id: String, player_name: string) {
        super('new_host')
        this.player_id = player_id
        this.player_name = player_name
    }
    player_id: String
    player_name: string
    settings?:RoomSettings
}

export class PlayerJoinMessage extends Message {
    constructor(player_id: String, player_name: string){
        super('player_join')
        this.player_id = player_id 
        this.player_name = player_name
    }
    player_id: String
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

export class PlayerVotekickMessage extends Message{
    constructor(voter_name: string, victim_name: string, vote_count: number, min_count: number){
        super('player_votekick')
        this.voter_name = voter_name 
        this.victim_name = victim_name 
        this.vote_count = vote_count 
        this.min_count = min_count
    }
    voter_name: string 
    victim_name: string 
    vote_count: number 
    min_count: number
}

export class PlayerGotKickedMessage extends Message{
    constructor(player_name: string){
        super('player_got_kicked')
        this.player_name = player_name
    }

    player_name: string
}

export class PlayerGotBannedMessage extends Message{
    constructor(player_name: string){
        super('player_got_banned')
        this.player_name = player_name
    }
    player_name: string
}

export class PlayerStartDrawingMessage extends Message {
    constructor(player_name: string){
        super('player_draw')
        this.player_name = player_name
    }
    player_name: string
}

// interface GuessServerMessage extends Message {
//     type: 'guess'
//     player_id: string
//     guess: string
// }

// interface CorrectGuessMessageFromServer extends Message {
//     type: 'correct_guess'
//     player_id: string
// }