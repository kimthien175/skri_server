import { Collection, Filter, MatchKeysAndValues, ObjectId, UpdateFilter } from "mongodb";
import { SocketPackage } from "../../types/socket_package.js";
import { Random } from "../../utils/random/random.js";
import { RoomSettings } from "../../types/type.js";
import { PickWordState, PrivatePreGameState } from "../state/state.js";
import { getRunningState, PrivateRoom, ServerRoom, StateStatus } from "../../types/room.js";
import { io } from "../../socket_io.js";

const WordsOptions = 3;

export function registerStartPrivateGame(socketPkg: SocketPackage<PrivateRoom>) {
    socketPkg.socket.on('start_private_game', async function (gameSettings: RoomSettings, callback: (res: { success: true } | { success: false, reason: any }) => void) {
        try {
            //#region PREPARE ROOM
            var roomCol = socketPkg.room
            var filter: Filter<ServerRoom> = {
                _id: new ObjectId(socketPkg.roomId),
                host_player_id: socketPkg.playerId
            }
            var room = await roomCol.findOne(filter)
            //#endregion

            if (room == null) throw Error('You are not room host')

            var preGameState = getRunningState(room)
            if (preGameState.type != PrivatePreGameState.TYPE) throw Error('wrong game state')
            preGameState.end_date = new Date()


            const idList = Object.keys(room.players)
            if (idList.length <= 1) throw Error('not enough player to start game')
            const pickerId = idList[Math.floor(Math.random() * idList.length)]

            var newState = new PickWordState({
                player_id: pickerId,
                words: await Random.getWords(room.settings),
                round_notify: 1
            })

            var updateFilter: UpdateFilter<PrivateRoom> & { $set: MatchKeysAndValues<PrivateRoom> } = {
                $set: {
                    status: {
                        current_state_id: preGameState.id,
                        command: 'end',
                        date: preGameState.end_date,
                        next_state_id: newState.id
                    },
                    [`henceforth_states.${newState.id}`]: newState,
                    current_round_done_players: { [pickerId]: true }
                }
            }

            // save to db and emit
            await roomCol.updateOne(filter, updateFilter)

            callback({ success: true })

            const pickerSocketId = room.players[pickerId].socket_id
            const clientsPkg = { status: updateFilter.$set.status, henceforth_states: { [newState.id]: newState } }

            console.log(`[START GAME]: send to picker socket id ${pickerSocketId}`);

            io.to(pickerSocketId).emit('new_states', clientsPkg)

            delete newState.words
            io.to(socketPkg.roomId).except(pickerSocketId).emit('new_states', clientsPkg)

        } catch (e) {
            console.log(`[START_GAME]: ${e}`);
            callback({ success: false, reason: e })
        }
    })
}
