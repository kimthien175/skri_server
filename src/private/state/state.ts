//START GAME

import { ObjectId, UpdateFilter } from "mongodb"
import { doCurrentRoundHaveAllPlayersDrawed,  ServerRoom } from "../../types/room.js"
import { Player } from "../../types/player"
import { Message, NewHostMessage } from "../../types/message.js"
import { SocketPackage } from "../../types/socket_package.js"
import { io } from "../../socket_io.js"
import { endDrawState } from "../../events/end_draw_state.js"

//START ROUND

//CHOOSE WORD
//DRAW
//DRAW RESULT

//GAME RESULT


export abstract class GameState{
    constructor(public type: string, player_id?:Player['id']) {
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

    player_id?:Player['id']

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
    static async onMainPlayerLeave(room: ServerRoom, state: GameState, socketPkg: SocketPackage, firstMessage?: Message): Promise<UpdateFilter<ServerRoom>> {
        var updateFilter: UpdateFilter<ServerRoom>
        switch (state.type) {
            case PrivatePreGameState.TYPE:
                //#region find player to be new owner
                var newOwnerIndex: number
                var players = room.players
                const idList = Object.keys(players)
                do {
                    newOwnerIndex = Math.floor(Math.random() * idList.length)
                } while (players[idList[newOwnerIndex]].id == socketPkg.playerId)
                //#endregion

                var newOwnerId = players[idList[newOwnerIndex]].id

                const newHostMsg = new NewHostMessage(newOwnerId, players[newOwnerId].name)
                io.to(socketPkg.roomId).emit('new_host', newHostMsg)

                updateFilter = {
                    $set: { host_player_id: newOwnerId },
                    $push: {
                        messages: { $each: firstMessage != undefined ? [firstMessage, newHostMsg] : [newHostMsg] }
                    }
                }
                break

            default:
                updateFilter = await endDrawState(socketPkg, room, state)
                if (firstMessage != undefined) {
                    updateFilter.$push = {
                        ...updateFilter.$push,
                        messages: firstMessage
                    }
                }
                break
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

type PickWordStateType ='pick_word'
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

type DrawStateType='draw'
export class DrawState extends GameState{
    constructor(arg: { player_id: string, word: string, room: ServerRoom }) {
        super(DrawState.TYPE, arg.player_id)
        this.word = arg.word
        if (arg.room.settings.word_mode != 'Hidden')
            this.hint = arg.word.replaceAll(/\S/g, '_')

        this.points = {}
        this.end_state = DrawState.getEndState(arg.room)
        this.liked_by = []
    }
    word?: string
    hint?: string

    liked_by: string[]
    static TYPE:DrawStateType = "draw"
    declare player_id: Player['id']
    //declare type: DrawStateType

    static getEndState(room: ServerRoom): DrawStateEnd {
        return doCurrentRoundHaveAllPlayersDrawed(room) ? (room.current_round == room.settings.rounds ? 'end_game' : 'end_round') : null
    }

    removeSensitiveProperties() {
        delete this.word
    }

    draw_data?: DrawData

    static isFirstStepEver(drawData: DrawData): boolean {
        return Object.keys(drawData.past_steps).length == 0 && drawData.current_step == null
    }

    points: PlayersPointData
    end_state: DrawStateEnd

    static isEndState(state: DrawState, players: { [id: string]: Player }): boolean {
        for (var id in players) {
            if (id == state.player_id) continue;
            if (state.points[id] == null) return false
        }
        return true
    }
}

type DrawStateEnd = 'end_round' | 'end_game' | null

export type PlayersPointData = { [key: string]: number }