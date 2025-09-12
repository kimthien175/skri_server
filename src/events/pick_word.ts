import { Filter, ObjectId, UpdateFilter } from "mongodb";
import { SocketPackage } from "../types/socket_package";
import { DrawState, PickWordState } from "../private/state/state.js";
import { getRunningState, ServerRoom, StateStatus } from "../types/room.js";
import { io } from "../socket_io.js";
import { Mutable } from "../types/type";

export function registerPickWord(socketPkg: SocketPackage) {
    socketPkg.socket.on('pick_word', async (word: string, callback: (res: { success: true } | { success: false, reason: any }) => void) => {
        // reset draw data
        // set state
        // emit to players
        console.log(`[PICK WORD] received word: ${word}`);
        try {
            const filter: Filter<ServerRoom> = { _id: new ObjectId(socketPkg.roomId) }

            var room = await socketPkg.room.findOne(filter)
            if (room == null) throw Error('room not found')

            // check state, current state is pick word, which mean room.status.next_state_id is pickword
            var pickWordState = getRunningState(room) as PickWordState
            if (pickWordState.type != PickWordState.TYPE || pickWordState.player_id != socketPkg.playerId || !pickWordState.words?.includes(word))
                throw Error('room not found')
            pickWordState.end_date = new Date()

            var drawState = new DrawState({
                player_id: pickWordState.player_id,
                word,
                room
            })

            var status: StateStatus = {
                current_state_id: pickWordState.id,
                command: 'end',
                date: pickWordState.end_date,
                next_state_id: drawState.id
            }

            var outdatedState = room.henceforth_states[room.status.current_state_id]

            var updatePkg: UpdateFilter<ServerRoom> & { $set: Mutable<NonNullable<UpdateFilter<ServerRoom>['$set']>> } = {
                $set: {
                    status,
                    [`henceforth_states.${drawState.id}`]: drawState
                },
                $push: { outdated_states: outdatedState },
                $unset: {
                    [`henceforth_states.${outdatedState.id}`]: ""
                }
            }

            var result = await socketPkg.room.updateOne(filter, updatePkg)
            if (result.modifiedCount != 1) throw Error('update failed')

            callback({ success: true })

            io.to(socketPkg.socket.id).emit('new_states', { status, henceforth_states: { [drawState.id]: drawState } })

            drawState.removeSensitiveProperties()

            socketPkg.socket.to(socketPkg.roomId)
                .emit('new_states', { status, henceforth_states: { [drawState.id]: drawState } })
        } catch (e: any) {
            console.log(`[PICK_WORD]: ${e}`);
            callback({ success: false, reason: e })
        }
    });
}