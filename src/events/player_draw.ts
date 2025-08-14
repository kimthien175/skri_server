
import { ObjectId } from "mongodb";
import { SocketPackage } from "../types/socket_package.js";
import { DrawState } from "../private/state/state.js";

export function registerPlayerDraw(socketPkg: SocketPackage) {
    socketPkg.socket.on('draw:send_past', async (drawStep: DrawStep) => {
        try {
            var objectId = new ObjectId(socketPkg.roomId)
            var room = await socketPkg.room.findOne({ _id: objectId })

            if (room == null) throw Error('room not found')

            var stateId = (room.status.command == 'end') ? room.status.next_state_id : room.status.current_state_id
            var state = room.henceforth_states[stateId]

            if (state == null || state.type != DrawState.TYPE) throw Error('state not found')

            var stateDrawData = (state as DrawState).draw_data

            if (stateDrawData == null) {
                // set tail id
                var drawData: DrawData = {
                    tail_id: drawStep.id,
                    past_steps: { [drawStep.id]: drawStep },
                    current_step: null
                }

                await socketPkg.room.updateOne({ _id: objectId }, {
                    $set: {
                        [`henceforth_states.${stateId}.draw_data`]: drawData
                    }
                })
            } else {
                // update tail id

                var updatePkg: any = {
                    [`henceforth_states.${stateId}.draw_data.past_steps.${drawStep.id}`]: drawStep
                }

                if (stateDrawData.tail_id < drawStep.id)
                    updatePkg[`henceforth_states.${stateId}.draw_data.tail_id`] = drawStep.id

                await socketPkg.room.updateOne({ _id: objectId }, {
                    $set: updatePkg
                })
            }

            // emit spectators
            socketPkg.socket.to(socketPkg.roomId).emit('draw:send_past', drawStep)
        } catch (e) {
            console.log(e)
        }
    })

    socketPkg.socket.on('draw:remove_past', async (targetId: number) => {
        try {
            var objectId = new ObjectId(socketPkg.roomId)
            var room = await socketPkg.room.findOne({ _id: objectId })

            if (room == null) throw Error('room not found')

            var stateId = (room.status.command == 'end') ? room.status.next_state_id : room.status.current_state_id
            var state = room.henceforth_states[stateId]

            if (state == null || state.type != DrawState.TYPE) throw Error('state not found')

            // when remove, it is supposed to be not null
            var stateDrawData = (state as DrawState).draw_data as DrawData


            var updatePkg: any = {
                $unset: {
                    [`henceforth_states.${stateId}.draw_data.${targetId}`]: ""
                }
            }

            if (stateDrawData.tail_id == targetId) {
                var newTailId: number
                // find new tail id
                var tailPrevId = stateDrawData.past_steps[targetId].prev_id

                if (tailPrevId == null) {
                    // performer head
                    // then just make id is 0
                    newTailId = 0
                } else {
                    newTailId = tailPrevId

                    do {
                        if (stateDrawData.past_steps[newTailId] != null) break;
                        newTailId--
                    } while (newTailId > 0);
                }

                updatePkg.$set = {
                    [`henceforth_states.${stateId}.draw_data.tail_id`]: newTailId
                }
            }

            await socketPkg.room.updateOne({ _id: objectId }, updatePkg)

            // emit spectators
            socketPkg.socket.to(socketPkg.roomId).emit('draw:remove_past', targetId)
        } catch (e) {
            console.log(e)
        }
    })

    socketPkg.socket.on('draw:start_current', async (drawStep: DrawStep) => {
        try {
            var objectId = new ObjectId(socketPkg.roomId)
            var room = await socketPkg.room.findOne({ _id: objectId })

            if (room == null) throw Error('room not found')

            var stateId = (room.status.command == 'end') ? room.status.next_state_id : room.status.current_state_id
            var state = room.henceforth_states[stateId]

            if (state == null || state.type != DrawState.TYPE) throw Error('state not found')

            var updatePkg: any = {
                $set: {
                    [`henceforth_states.${stateId}.draw_data.current_step`]: drawStep
                }
            }

            await socketPkg.room.updateOne({ _id: objectId }, updatePkg)

            // emit spectators
            socketPkg.socket.to(socketPkg.roomId).emit('draw:start_current', drawStep)
        } catch (e) {
            console.log(e)
        }
    })

    socketPkg.socket.on('draw:update_current', async (drawStepAddon) => {
        try {
            var objectId = new ObjectId(socketPkg.roomId)
            var room = await socketPkg.room.findOne({ _id: objectId })

            if (room == null) throw Error('room not found')

            var stateId = (room.status.command == 'end') ? room.status.next_state_id : room.status.current_state_id
            var state = room.henceforth_states[stateId]

            if (state == null || state.type != DrawState.TYPE) throw Error('state not found')

            //var brushStep = (state as DrawState).draw_data?.current_steps[drawStepAddon.id] as BrushStep

            var updatePkg: any = {
                $push: {
                    [`henceforth_states.${stateId}.draw_data.current_step.points`]: drawStepAddon.point
                }
            }

            await socketPkg.room.updateOne({ _id: objectId }, updatePkg)

            console.log(drawStepAddon);

            // emit spectators
            socketPkg.socket.to(socketPkg.roomId).emit('draw:update_current', drawStepAddon)
        } catch (e) {
            console.log(e)
        }
    })

    socketPkg.socket.on('draw:end_current', async ()=>{
        socketPkg.socket.to(socketPkg.roomId).emit('draw:end_current')
    })
}