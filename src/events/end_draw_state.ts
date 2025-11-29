import { UpdateFilter } from "mongodb";
import { getRunningState, PrivateRoom, roomStringifier, ServerRoom, StateStatus } from "../types/room.js";
import { SocketPackage } from "../types/socket_package.js";
import { DrawState, GameState, PickWordState, PrivatePreGameState } from "../private/state/state.js";

import { Player } from "../types/player.js";

/**
 * switch to new state but
 * @param socketPkg 
 * @param room 
 * @param excludedPlayerId 
 * @returns 
 */
export async function endDrawState(socketPkg: SocketPackage, room: ServerRoom, excludedPlayerId?: Player['id']): Promise<UpdateFilter<ServerRoom>[]> {
    console.log('[endDrawState]');
    const updateFilter: UpdateFilter<ServerRoom>[] = []
    var newState: GameState

    const isEndGame = DrawState.getEndState(room) == 'end_game'
    if (isEndGame && socketPkg.roomType == 'private') {
        newState = new PrivatePreGameState((room as unknown as PrivateRoom).host_player_id)
    } else {
        var players: ServerRoom['players'] | undefined
        if (excludedPlayerId) {
            players = { ...room.players }
            delete players[excludedPlayerId]
        }

        var pickWordPkg = await PickWordState.from(room, players)
        newState = pickWordPkg.state
        updateFilter.push(pickWordPkg.update)
    }

    var switchStateUpdate = GameState.switchState(room, newState, isEndGame)
    updateFilter.push(...switchStateUpdate)

    socketPkg.emitNewStates({ wholeRoom: true },
        switchStateUpdate[0].$set.status,
        newState)
    console.log(`update filter: ${JSON.stringify(updateFilter, roomStringifier, 2)}`);

    return updateFilter
}

export function registerEndDrawState(socketPkg: SocketPackage) {
    socketPkg.socket.on('end_draw_state', async function () {
        try {
            const filter = await socketPkg.getFilter()

            var room = await socketPkg.room.findOne(filter)
            if (room == null) throw Error('room not found')

            var state = getRunningState(room)
            if (state.type != DrawState.TYPE || state.player_id != socketPkg.playerId) throw Error('wrong state')

            await socketPkg.room.updateOne(filter, await endDrawState(socketPkg, room))
        } catch (e) {
            console.log(`[END DRAW STATE]: ${JSON.stringify(e)}`);
        }
    })
}