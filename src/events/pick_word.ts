// import { Collection } from "mongodb";

import { ObjectId, UpdateFilter } from "mongodb";
import { SocketPackage } from "../types/socket_package";
import { DrawState, PickWordState } from "../private/state/state.js";
import { getOutdatedState, getRunningState, StateStatus } from "../types/room.js";
import { io } from "../socket_io.js";

export function registerPickWord(socketPkg: SocketPackage) {
    socketPkg.socket.on('pick_word', async (word: string, callback: (res: { success: true } | { success: false, reason: any }) => void) => {
        // set end date for current state
        // expected data: pregame with 'end' command
        // what to do: change current_state_id to next_state_id, date: new Date()
        try {
            var roomObjId = new ObjectId(socketPkg.roomId)
            var room = await socketPkg.room.findOne({
                _id: roomObjId
            })

            if (room == null) {
                callback({ success: false, reason: 'room not found' })
                return
            }

            // check state, current state is pick word, which mean room.status.next_state_id is pickword
            var currentState: PickWordState = getRunningState(room) as PickWordState
            if (currentState.type != PickWordState.TYPE || currentState.player_id != socketPkg.socket.id || !currentState.words?.includes(word)) {
                callback({ success: false, reason: 'room not found' })
                return
            }

            // switch current_state_id
            var oldState = getOutdatedState(room)

            var newState = new DrawState({
                player_id: currentState.player_id,
                word,
                word_mode: room.settings.word_mode
            })

            var status: StateStatus = {
                current_state_id: currentState.id,
                command: 'end',
                date: new Date(),
                next_state_id: newState.id
            }

            var result = await socketPkg.room.updateOne({ _id: roomObjId }, {
                $set: { status, [`henceforth_states.${newState.id}`]: newState },
                $push: { outdated_states: oldState },
                $pull: { round_white_list: currentState.player_id },
                $unset: { [`henceforth_states.${oldState.id}`]: 1 }
            })

            if (result.modifiedCount != 1) {
                callback({ success: false, reason: 'update failed' })
                return
            }

            callback({ success: true })

            console.log(`[PICK_WORD]: send to chosen player ${newState}`);
            io.to(socketPkg.socket.id).emit('new_states', { status, henceforth_states: { [newState.id]: newState } })

            newState.removeSensitiveProperties()

            console.log(`[PICK_WORD]: send to other players ${newState}`);
            
            socketPkg.socket.to(socketPkg.roomId)
                .emit('new_states', { status, henceforth_states: { [newState.id]: newState } })
        } catch (e: any) {
            console.log(`[PICK_WORD]: ${e}`);
            callback({ success: false, reason: e })
        }
    });
}