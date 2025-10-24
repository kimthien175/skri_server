
import { MatchKeysAndValues, UpdateFilter } from "mongodb";
import { SocketPackage } from "../types/socket_package.js";
import { DrawState } from "../private/state/state.js";
import { ServerRoom } from "../types/room.js";
import { io } from "../socket_io.js";
import { PlayerStartDrawingMessage } from "../types/message.js";
import { Redis } from "../utils/redis.js";

export function registerPlayerDraw(socketPkg: SocketPackage) {
    socketPkg.socket.on('draw:send_past', async (drawStep: DrawStep) => {
        try {
            const roomId = await Redis.getRoomId(socketPkg.socket.id)
            const filter = await socketPkg.getFilter()
            var room = await socketPkg.room.findOne(filter)

            if (room == null) throw Error('room not found')

            // check black list, which mean the undo signal comes before the drawStep as target
            if (room.latest_draw_data.black_list[drawStep.id]) return

            var updatePkg: UpdateFilter<ServerRoom> = {
                $set: {
                    [`latest_draw_data.past_steps.${drawStep.id}`]: drawStep
                }
            }

            if (room.latest_draw_data.tail_id == null || room.latest_draw_data.tail_id < drawStep.id) {
                (updatePkg.$set as MatchKeysAndValues<ServerRoom>)['latest_draw_data.tail_id'] = drawStep.id
            }

            // send message if this is the first step and current step ==null
            if (DrawState.isFirstStepEver(room.latest_draw_data)) {
                var msg = new PlayerStartDrawingMessage(socketPkg.name)
                updatePkg.$push = {
                    messages: msg
                }

                io.to(roomId).emit('system_message', msg)
            }


            await socketPkg.room.updateOne(filter, updatePkg)

            // emit spectators
            socketPkg.socket.to(roomId).emit('draw:send_past', drawStep)
        } catch (e) {
            console.log(e)
        }
    })

    socketPkg.socket.on('draw:remove_past', async (targetId: number) => {
        try {
            const roomId = await Redis.getRoomId(socketPkg.socket.id)
            const filter = await socketPkg.getFilter()
            var room = await socketPkg.room.findOne(filter)

            if (room == null) throw Error('room not found')

            var updatePkg: UpdateFilter<ServerRoom>

            // the target hasn't come yet, add to black list for adding step to ignore
            if (room.latest_draw_data.past_steps[targetId] == null) {
                updatePkg = {
                    $set: {
                        [`latest_draw_data.black_list.${targetId}`]: true
                    }
                }

            } else {
                // past steps has it, delete
                updatePkg = {
                    $unset: {
                        [`latest_draw_data.past_steps.${targetId}`]: ""
                    }
                }

                // check tail id
                var drawData = room.latest_draw_data
                if (targetId == drawData.tail_id) {
                    updatePkg.$set = {
                        [`latest_draw_data.tail_id`]: drawData.past_steps[targetId].prev_id
                    }
                }
            }

            await socketPkg.room.updateOne(filter, updatePkg)

            // emit spectators
            socketPkg.socket.to(roomId).emit('draw:remove_past', targetId)
        } catch (e) {
            console.log(e)
        }
    })

    socketPkg.socket.on('draw:start_current', async (drawStep: DrawStep) => {
        try {
            const roomId = await Redis.getRoomId(socketPkg.socket.id)
            const filter = socketPkg.getFilter()
            var room = await socketPkg.room.findOne(filter)

            if (room == null) throw Error('room not found')

            var updatePkg: UpdateFilter<ServerRoom> = {
                $set: {
                    [`latest_draw_data.current_step`]: drawStep
                }
            }

            // send message if this is the first step and current step ==null
            if (DrawState.isFirstStepEver(room.latest_draw_data)) {
                var msg = new PlayerStartDrawingMessage(socketPkg.name)
                updatePkg.$push = {
                    messages: msg
                }

                io.to(roomId).emit('system_message', msg)
            }

            await socketPkg.room.updateOne(filter, updatePkg)

            // emit spectators
            socketPkg.socket.to(roomId).emit('draw:start_current', drawStep)
        } catch (e) {
            console.log(e)
        }
    })

    socketPkg.socket.on('draw:update_current', async (drawStepAddon) => {
        try {
            const roomId = await Redis.getRoomId(socketPkg.socket.id)
            const filter = await socketPkg.getFilter()
            var room = await socketPkg.room.findOne(filter)

            if (room == null) throw Error('room not found')

            await socketPkg.room.updateOne(filter, {
                $push: {
                    [`latest_draw_data.current_step.points`]: drawStepAddon.point
                }
            })

            // emit spectators
            socketPkg.socket.to(roomId).emit('draw:update_current', drawStepAddon)
        } catch (e) {
            console.log(e)
        }
    })

    socketPkg.socket.on('draw:end_current', async (data) => {
        try {
            socketPkg.socket.to(await Redis.getRoomId(socketPkg.socket.id)).emit('draw:end_current', data)

        } catch (e) {
            console.log(`[DRAW:END_CURRENT] ${e}`);
        }
    })
}