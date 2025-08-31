import { Filter, ObjectId, UpdateFilter, WithId } from "mongodb";
import { doCurrentRoundHaveAllPlayersDrawed, getRunningState, ServerRoom, StateStatus } from "../types/room.js";
import { SocketPackage } from "../types/socket_package.js";
import { DrawState, GameState, PickWordState, PrivatePreGameState } from "../private/state/state.js";
import { Mutable } from "../types/type.js";
import { Random } from "../utils/random/random.js";
import { io } from "../socket_io.js";
import { Player } from "../types/player.js";

export async function endDrawState(socketPkg: SocketPackage, room: WithId<ServerRoom>, drawState: DrawState): Promise<{ state: GameState, updatePackage: UpdateFilter<ServerRoom> & { $set: NonNullable<UpdateFilter<ServerRoom>['$set']> } }> {
    drawState.draw_data = room.latest_draw_data
    drawState.end_date = new Date()

    var outdatedState = room.henceforth_states[room.status.current_state_id]

    var $set: Mutable<NonNullable<UpdateFilter<ServerRoom>['$set']>> = {}

    var nextState: GameState

    var bonus: {
        end_state: {
            word: string,
            points: DrawState['points']
        }
        end_game?:
        { [id: string]: Player }
    } = {
        end_state: {
            word: drawState.word as string,
            points: drawState.points
        }
    }

    //#region CREATE NEXT STATE AFTER DRAW STATE
    if (drawState.end_state == 'end_game') {
        // it's time to switch to new round or pre game state (if private room) or round 1(if public room)

        // pre game state or round 1 for public room
        if (socketPkg.isPublicRoom) {
            // public round 1
            // PICK WORD STATE WITH ROUND NOTIFY
            var nextPickerId: string
            const idList = Object.keys(room.players)

            nextPickerId = idList[Math.floor(Math.random() * idList.length)]

            nextState = new PickWordState({ player_id: nextPickerId, words: await Random.getWords(room.settings), round_notify: 1 })

            // reset done players
            $set.current_round_done_players = { [nextPickerId]: true }
        } else {
            // pre game state
            nextState = new PrivatePreGameState()
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
        for (var id in bestPlayerIds) {
            $set[`players.${id}.winner`] = true
        }
        bonus.end_game = room.players

        // reset all player score to 0
        for (var id in room.players) {
            $set[`players.${id}.score`] = 0
        }
    } else if (drawState.end_state == 'end_round') {
        // PICK WORD STATE WITH ROUND NOTIFY
        var nextPickerId: string
        const idList = Object.keys(room.players)

        nextPickerId = idList[Math.floor(Math.random() * idList.length)]

        nextState = new PickWordState({ player_id: nextPickerId, words: await Random.getWords(room.settings), round_notify: room.current_round + 1 })

        // reset done players
        $set.current_round_done_players = { [nextPickerId]: true }
        $set.current_round = room.current_round + 1
    } else {
        // next as pickword state like usual
        var nextPickerId: string
        const idList = Object.keys(room.players)

        // delete done players in the list
        for (let key in room.current_round_done_players) {
            const index = idList.indexOf(key)
            if (index != -1) idList.splice(index, 1)
        }

        nextPickerId = idList[Math.floor(Math.random() * idList.length)]

        nextState = new PickWordState({ player_id: nextPickerId, words: await Random.getWords(room.settings) })

        $set[`current_round_done_players.${nextPickerId}`] = true
    }
    //#endregion

    // change updatePkg
    $set[`henceforth_states.${nextState.id}`] = nextState

    $set.status = {
        current_state_id: drawState.id,
        command: 'end',
        date: drawState.end_date,
        bonus,
        next_state_id: nextState.id
    }

    return {
        state: nextState,
        updatePackage: {
            $set,
            $push: { outdated_states: outdatedState },
            $unset: { [`henceforth_states.${outdatedState.id}`]: "" }
        }
    }
}

export function registerEndDrawState(socketPkg: SocketPackage) {
    socketPkg.socket.on('end_draw_state', async function () {
        console.log('[END DRAW STATE ON TIME OUT]');
        try {
            var _id = { _id: new ObjectId(socketPkg.roomId) }
            var room = await socketPkg.room.findOne(_id)
            if (room == null) throw Error('room not found')

            var state = getRunningState(room) as DrawState
            if (state.type != DrawState.TYPE || state.player_id != socketPkg.playerId) throw Error('wrong state')

            var result = await endDrawState(socketPkg, room, state)

            await socketPkg.room.updateOne(_id, result.updatePackage)

            io.to(socketPkg.roomId).emit('new_states', {
                status: result.updatePackage.$set.status,
                henceforth_states: {
                    [result.state.id]: result.state
                }
            })
        } catch (e) {
            console.log(`[END DRAW STATE]: ${e}`);
        }
    })
}