import { Collection, MatchKeysAndValues, ObjectId, UpdateFilter } from "mongodb";
import { SocketPackage } from "../../types/socket_package.js";
import { Random } from "../../utils/random/random.js";
import { RoomSettings } from "../../types/type.js";
import { PickWordState, PrivatePreGameState } from "../state/state.js";
import { PrivateRoom, StateStatus } from "../../types/room.js";
import { io } from "../../socket_io.js";

const WordsOptions = 3;

export function registerStartPrivateGame(socketPkg: SocketPackage) {
    socketPkg.socket.on('start_private_game', async function (gameSettings: RoomSettings, callback: (res: { success: true } | { success: false, reason: any }) => void) {
        try {
            //#region PREPARE ROOM
            var roomCol = socketPkg.room as any as Collection<PrivateRoom>
            var roomObjId = new ObjectId(socketPkg.roomId)
            var room = await roomCol.findOne({
                _id: roomObjId,
                host_player_id: socketPkg.socket.id
            })
            //#endregion

            //#region CREATE STATE AND NEXT STATE
            // create new state, save to db, callback and emit to everyone else in the room

            if (room == null) {
                callback({ success: false, reason: 'You are not room host' })
                return
            }

            if (room.henceforth_states[room.status.current_state_id].type != PrivatePreGameState.TYPE) {
                callback({ success: false, reason: 'wrong game state' })
                return
            }

            var words = await Random.getWords(room.settings)

            var idList = room.round_white_list
            var firstPicker = idList[Math.floor(Math.random() * idList.length)]

            var secondPicker: String
            do {
                secondPicker = idList[Math.floor(Math.random() * idList.length)]
            } while (secondPicker == firstPicker)
            var newState = new PickWordState({ player_id: firstPicker, words: words.slice(0, WordsOptions), round_notify: 1 })

            var status: StateStatus = {
                current_state_id: room.status.current_state_id,
                command: 'end',
                date: new Date(),
                next_state_id: newState.id
            }

            var updateFilter: UpdateFilter<PrivateRoom> & { $set: MatchKeysAndValues<PrivateRoom> } = {
                $set: {
                    status,
                    [`henceforth_states.${newState.id}`]: newState
                }
            }

            // save to db and emit
            await roomCol.updateOne({ _id: roomObjId }, updateFilter)

            callback({ success: true })

            io.to(newState.player_id).emit('new_states', { status, henceforth_states: { [newState.id]: newState } })

            delete newState.words
            io.to(socketPkg.roomId).except(newState.player_id).emit('new_states', { status, henceforth_states: { [newState.id]: newState } })

            //#endregion
        } catch (e) {
            console.log(`[START_GAME]: ${e}`);
            callback({ success: false, reason: e })
        }
    })
}
