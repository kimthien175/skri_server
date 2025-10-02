import { ObjectId, UpdateFilter } from "mongodb";
import { getRunningState, PrivateRoom, ServerRoom, StateStatus } from "../types/room.js";
import {  SocketPackage } from "../types/socket_package.js";
import { DrawState, DrawStateEnd, GameState, PickWordState, PrivatePreGameState } from "../private/state/state.js";
import { Mutable } from "../types/type.js";
import { Random } from "../utils/random/random.js";
import { io } from "../socket_io.js";
import { Player } from "../types/player.js";

export async function endDrawState<T extends ServerRoom>(socketPkg: SocketPackage<T>, room: T, state: GameState, removedPlayerId?: Player['id']): Promise<Mutable<UpdateFilter<T>>> {
    state.end_date = new Date()

    var outdatedState = room.henceforth_states[room.status.current_state_id]

    var $set = {} as NonNullable<Mutable<UpdateFilter<ServerRoom>['$set']>>

    var nextState: GameState

    var bonus: {
        end_state: {
            word: string,
            points: DrawState['points']
        }
        end_game?:
        { [id: string]: Player }
    } | {
        end_game?:
        { [id: string]: Player }
    } | undefined

    if (state.type == DrawState.TYPE) {
        (state as DrawState).draw_data = room.latest_draw_data
        bonus = {
            end_state: {
                word: (state as DrawState).word as string,
                points: (state as DrawState).points
            }
        }
    }

    var endState: DrawStateEnd = (removedPlayerId != undefined) ? 'end_game' : DrawState.getEndState(room)

    //#region CREATE NEXT STATE AFTER DRAW STATE
    if (endState == 'end_game') {
        // it's time to switch to new round or pre game state (if private room) or round 1(if public room)

        // pre game state or round 1 for public room
        if (socketPkg.isPublicRoom) {
            // public round 1
            // PICK WORD STATE WITH ROUND NOTIFY
            var nextPickerId: string
            const idList = Object.keys(room.players)

            if (removedPlayerId != undefined) {
                const index = idList.indexOf(removedPlayerId)
                if (index != -1) idList.splice(index, 1)
            }

            nextPickerId = idList[Math.floor(Math.random() * idList.length)]

            nextState = new PickWordState({ player_id: nextPickerId, words: await Random.getWords(room.settings), round_notify: 1 })

            // reset done players
            $set.current_round_done_players = { [nextPickerId]: true }
        } else {
            // pre game state
            nextState = new PrivatePreGameState((room as unknown as PrivateRoom).host_player_id)
        }
        $set.current_round = 1

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

        if (bonus == undefined) bonus = {}
        bonus.end_game = room.players

        // reset all player score to 0, reset crown
        for (var id in room.players) {
            if (id == removedPlayerId) continue
            $set[`players.${id}.score`] = 0
            $set[`players.${id}.winner`] = bestPlayerIds.includes(id)
        }
    } else if (endState == 'end_round') {
        // PICK WORD STATE WITH ROUND NOTIFY
        var nextPickerId: string
        const idList = Object.keys(room.players)
        // remove removedPlayerId
        if (removedPlayerId != undefined) {
            const index = idList.indexOf(removedPlayerId)
            if (index != -1) idList.splice(index, 1)
        }

        nextPickerId = idList[Math.floor(Math.random() * idList.length)]

        nextState = new PickWordState({ player_id: nextPickerId, words: await Random.getWords(room.settings), round_notify: room.current_round + 1 })

        // reset done players
        $set.current_round_done_players = { [nextPickerId]: true }
        $set.current_round = room.current_round + 1
    } else {
        // next as pickword state like usual

        const idList = Object.keys(room.players)
        // remove removedPlayer in idList
        if (removedPlayerId != undefined) {
            const index = idList.indexOf(removedPlayerId)
            if (index != -1) idList.splice(index, 1)
        }

        // delete done players in the list
        for (let key in room.current_round_done_players) {
            const index = idList.indexOf(key)
            if (index != -1) idList.splice(index, 1)
        }
        var nextPickerId = idList[Math.floor(Math.random() * idList.length)]

        nextState = new PickWordState({ player_id: nextPickerId, words: await Random.getWords(room.settings) })

        $set[`current_round_done_players.${nextPickerId}`] = true
    }
    //#endregion

    const status: StateStatus = {
        current_state_id: state.id,
        command: 'end',
        date: state.end_date,
        next_state_id: nextState.id,
        bonus,
    }

    io.to(socketPkg.roomId).emit('new_states', {
        status,
        henceforth_states: { [nextState.id]: nextState }
    })

    $set.status = status
    $set[`henceforth_states.${nextState.id}`] = nextState;

    var result: UpdateFilter<ServerRoom>= {
        $set,
        $push: { outdated_states: outdatedState },
        $unset: { [`henceforth_states.${outdatedState.id}`]: "" }
    }
    return result as UpdateFilter<T>
}

export function registerEndDrawState(socketPkg: SocketPackage) {
    socketPkg.socket.on('end_draw_state', async function () {
        try {
            const filter = { _id: new ObjectId(socketPkg.roomId) }

            var room = await socketPkg.room.findOne(filter)
            if (room == null) throw Error('room not found')

            var state = getRunningState(room)
            if (state.type != DrawState.TYPE || state.player_id != socketPkg.playerId) throw Error('wrong state')

            await socketPkg.room.updateOne(filter, await endDrawState(socketPkg, room, state))
        } catch (e) {
            console.log(`[END DRAW STATE]: ${e}`);
        }
    })
}