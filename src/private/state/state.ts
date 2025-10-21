import { ObjectId, UpdateFilter } from "mongodb"
import { ServerRoom, StateStatus } from "../../types/room.js"
import { Player } from "../../types/player"

import { Mutable } from "../../types/type.js"
import { Random } from "../../utils/random/random.js"

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

    static switchState(room: ServerRoom, nextState: GameState, endGame?: boolean): UpdateFilter<ServerRoom> &
    {
        $set: NonNullable<UpdateFilter<ServerRoom>['$set']> &
        { status: StateStatus & { command: 'end' } }
    } {
        var endDate = new Date()
        if (room.status.command == 'start') {

            return {
                $set: {
                    status: {
                        current_state_id: room.status.current_state_id,
                        command: 'end',
                        date: endDate,
                        next_state_id: nextState.id
                    },
                    [`henceforth_states.${room.status.current_state_id}.end_date`]: endDate,
                    [`henceforth_states.${nextState.id}`]: nextState
                }
            }
        }

        var status: StateStatus & { command: 'end' } = {
            current_state_id: room.status.next_state_id,
            command: 'end',
            date: endDate,
            next_state_id: nextState.id
        }

        var $set: NonNullable<UpdateFilter<ServerRoom>['$set']> & { status: StateStatus & { command: 'end' } } = {
            status,
            [`henceforth_states.${room.status.next_state_id}.end_date`]: endDate,
            [`henceforth_states.${nextState.id}`]: nextState
        }

        var endUpdateFilter: UpdateFilter<ServerRoom> & {
            $set: NonNullable<UpdateFilter<ServerRoom>['$set']> &
            { status: StateStatus & { command: 'end' } }
        }
            = {
            $set,
            $unset: {
                [`henceforth_states.${room.status.current_state_id}`]: ''
            },
            $push: {
                outdated_states: room.henceforth_states[room.status.current_state_id]
            }
        }

        // IF ENDING STATE IS DRAW STATE: push draw data to draw state for record, add word reveal
        var endingState = room.henceforth_states[status.current_state_id]
        if (endingState.type == DrawState.TYPE) {
            endUpdateFilter.$set[`henceforth_states.${status.current_state_id}.draw_data`] = room.latest_draw_data
            status.bonus = {
                end_state: {
                    word: (endingState as DrawState).word as string,
                    points: (endingState as DrawState).points
                }
            }
        }

        if (endGame) {
            // update bonus
            status.bonus = {
                ...status.bonus,
                end_game: room.players
            }
            // update win player
            // set won players
            const IDs = Object.keys(room.players)

            var bestPlayerIds = [IDs[0]]

            for (var index = 1; index < IDs.length; index++) {
                var currentBestPlayerScore = room.players[bestPlayerIds[0]].score
                var comparedScore = room.players[IDs[index]].score
                if (comparedScore > currentBestPlayerScore) {
                    bestPlayerIds = [IDs[index]]
                } else if (comparedScore == currentBestPlayerScore) {
                    bestPlayerIds.push(IDs[index])
                }
            }

            // reset all player score to 0, reset crown
            for (var id in room.players) {
                $set[`players.${id}.score`] = 0
                $set[`players.${id}.winner`] = bestPlayerIds.includes(id)
            }
        }

        return endUpdateFilter
    }

    static isEndRound(room: ServerRoom): boolean {
        for (let playerId in room.players) {
            if (!room.current_round_done_players[playerId]) return false
        }
        return true
    }
}

type PrivatePreGameStateType = 'pre_game'
export class PrivatePreGameState extends GameState {
    constructor(player_id: string) {
        super(PrivatePreGameState.TYPE, player_id)
    }

    static TYPE: PrivatePreGameStateType = 'pre_game'
    declare player_id: string
}

type PickWordStateType = 'pick_word'
export class PickWordState extends GameState {
    constructor(arg: { player_id: string, words: string[], round_notify?: number }) {
        super(PickWordState.TYPE, arg.player_id)
        this.words = arg.words
        this.round_notify = arg.round_notify
    }

    /** remember to update `player_id` to `room.current_round_done_players`
     * `players`: incase the players have some modified such as player leave
     * */
    static async from(room: ServerRoom, players: ServerRoom['players'] = room.players): Promise<{ state: PickWordState, update: UpdateFilter<ServerRoom> & { $set: NonNullable<UpdateFilter<ServerRoom>['$set']> } }> {

        var round_notify: number | undefined

        var $set: Mutable<UpdateFilter<ServerRoom>['$set']> = {}
        var player_id: Player['id']

        var pickerList: Player['id'][] = Object.keys(players)
        pickerList.filter(id => room.current_round_done_players[id] === true)
        if (pickerList.length == 0) {
            // reset pickerList to original 
            pickerList = Object.keys(players)

            player_id = pickerList[Math.floor(Math.random() * pickerList.length)]

            // switch to new round
            $set.current_round = room.current_round + 1 > room.settings.rounds ? 1 : room.current_round + 1
            $set.current_round_done_players = { [player_id]: true }
            round_notify = $set.current_round

        } else {
            player_id = pickerList[Math.floor(Math.random() * pickerList.length)]
            $set[`current_round_done_players.${player_id}`] = true
        }

        return {
            state: new PickWordState({
                player_id,
                words: await Random.getWords(room.settings),
                round_notify
            }),
            update: { $set }
        }
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

export class PublicLobbyState extends GameState {
    constructor() {
        super(PublicLobbyState.TYPE)
    }
    static TYPE = 'public_lobby'
}