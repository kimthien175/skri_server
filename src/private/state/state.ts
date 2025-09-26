import { ObjectId, UpdateFilter } from "mongodb"
import { getRunningState, PrivateRoom, ServerRoom } from "../../types/room.js"
import { Player } from "../../types/player"
import { Message, NewHostMessage } from "../../types/message.js"
import { SocketPackage } from "../../types/socket_package.js"
import { io } from "../../socket_io.js"
import { endDrawState } from "../../events/end_draw_state.js"

export abstract class GameState {
    constructor(public type: string, player_id?: Player['id']) {
        this.id = (new ObjectId()).toString()
        this.player_id = player_id
    }
    start_date?: Date
    end_date?: Date
    id: string

    static removeSensitiveProperties(raw: GameState) {
        switch (raw.type) {
            case PickWordState.TYPE:
                delete (raw as PickWordState).words
                break;
            case DrawState.TYPE:
                delete (raw as unknown as DrawState).word
                break;
            default:
                break;
        }
    }

    player_id?: Player['id']

    /**
     * unset players and current_round_done_players, 
     * have $push messages, $unset players and current_round_done_players for sure
     * don't interact with db
     * @param room 
     * @param state 
     * @param socketPkg 
     * @param firstMessage 
     * @returns 
     */
    static async onPlayerLeave(room: ServerRoom, socketPkg: SocketPackage, firstMessage?: Message): Promise<UpdateFilter<ServerRoom>> {
        var state = getRunningState(room)

        var updateFilter: UpdateFilter<ServerRoom> =
            (state.type == DrawState.TYPE || state.type == PickWordState.TYPE) ?
                await endDrawState(socketPkg, room, state, socketPkg.playerId) : {}

        var messages: Message[] = firstMessage != undefined ? [firstMessage] : []

        //#region CHANGE ROOM OWNER IF CURRENT PLAYER IS OWNER
        if (!socketPkg.isPublicRoom && socketPkg.playerId == (room as PrivateRoom).host_player_id) {
            //#region find player to be new owner
            var players = room.players
            const idList = Object.keys(players)

            var newOwnerId: string
            do {
                newOwnerId = players[idList[Math.floor(Math.random() * idList.length)]].id
            } while (newOwnerId == socketPkg.playerId)
            //#endregion

            const newHostMsg = new NewHostMessage(newOwnerId, players[newOwnerId].name)
            io.to(socketPkg.roomId).emit('new_host', newHostMsg)

            messages.push(newHostMsg)

            updateFilter.$set = {
                ...updateFilter.$set,
                host_player_id: newOwnerId
            }
        }
        //#endregion

        if (messages.length != 0) {
            updateFilter.$push = {
                ...updateFilter.$push,
                messages: { $each: messages }
            }
        }

        updateFilter.$unset = {
            ...updateFilter.$unset,
            [`players.${socketPkg.playerId}`]: "",
            [`current_round_done_players.${socketPkg.playerId}`]: ""
        }

        return updateFilter
    }
}

type PrivatePreGameStateType = 'pre_game'
export class PrivatePreGameState extends GameState {
    constructor(player_id: string) {
        super(PrivatePreGameState.TYPE, player_id)
    }

    static TYPE: PrivatePreGameStateType = 'pre_game'
    //declare type: PrivatePreGameStateType
}

type PickWordStateType = 'pick_word'
export class PickWordState extends GameState {
    constructor(arg: { player_id: string, words: string[], round_notify?: number }) {
        super(PickWordState.TYPE, arg.player_id)
        this.words = arg.words
        this.round_notify = arg.round_notify
    }

    words?: Array<string>
    round_notify?: number

    static TYPE: PickWordStateType = 'pick_word'
    //declare type: PickWordStateType
    declare player_id: Player['id']
}

type DrawStateType = 'draw'
export class DrawState extends GameState {
    constructor(arg: { player_id: string, word: string, room: ServerRoom }) {
        super(DrawState.TYPE, arg.player_id)
        this.word = arg.word
        if (arg.room.settings.word_mode != 'Hidden')
            this.hint = arg.word.replaceAll(/\S/g, '_')

        this.points = {}
        //this.end_state = DrawState.getEndState(arg.room)
        this.liked_by = []
    }
    word?: string
    hint?: string

    liked_by: string[]
    static TYPE: DrawStateType = "draw"
    declare player_id: Player['id']
    //declare type: DrawStateType

    static getEndState(room: ServerRoom): DrawStateEnd {
        return DrawState.isEndRound(room) ? (room.current_round == room.settings.rounds ? 'end_game' : 'end_round') : null
    }

    static isEndRound(room: ServerRoom): boolean {
        for (let playerId in room.players) {
            if (!room.current_round_done_players[playerId]) return false
        }
        return true
    }

    removeSensitiveProperties() {
        delete this.word
    }

    draw_data?: DrawData

    static isFirstStepEver(drawData: DrawData): boolean {
        return Object.keys(drawData.past_steps).length == 0 && drawData.current_step == null
    }

    points: PlayersPointData
    //end_state: DrawStateEnd

    static isEndState(state: DrawState, players: { [id: string]: Player }): boolean {
        for (var id in players) {
            if (id == state.player_id) continue;
            if (state.points[id] == null) return false
        }
        return true
    }
}

export type DrawStateEnd = 'end_round' | 'end_game' | null

export type PlayersPointData = { [key: string]: number }

export class PublicLobbyState extends GameState{
    constructor(){
        super(PublicLobbyState.TYPE)
    }
    static TYPE = 'public_lobby'
}