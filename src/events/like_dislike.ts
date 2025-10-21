import { ObjectId, UpdateFilter } from "mongodb";
import { Message, PlayerDislikeMessage, PlayerLikeMessage } from "../types/message.js";
import { SocketPackage } from "../types/socket_package.js";
import { ServerRoom, StateStatus } from "../types/room.js";
import { DrawState } from "../private/state/state.js";
import { io } from "../socket_io.js";
import { Mutable } from "../types/type.js";

export async function registerLikeDislike(socketPkg: SocketPackage) {
    socketPkg.socket.on('like_dislike', async function (flag: boolean) {
        try {
            if (flag != true && flag != false)
                throw Error('wrong type')

            const roomId = await socketPkg.getRoomId()
            var _id = { _id: new ObjectId(roomId) }
            var room = await socketPkg.room.findOne(_id)
            if (room == null) throw Error('room not found')

            var state = room.henceforth_states[(room.status as StateStatus & { command: 'end' }).next_state_id] as DrawState
            if (state.type != DrawState.TYPE || state.liked_by.includes(socketPkg.playerId as string))
                throw Error('wrong state')

            var msg: PlayerLikeMessage | PlayerDislikeMessage = flag ? new PlayerLikeMessage(socketPkg.playerId as string, socketPkg.name) : new PlayerDislikeMessage(socketPkg.name)
            var updatePkg: UpdateFilter<ServerRoom> & { $push: Mutable<NonNullable<UpdateFilter<ServerRoom>['$push']>> } = {
                $push: { messages: msg }
            }

            if (msg.type == PlayerLikeMessage.TYPE) {
                var score = state.points[state.player_id]
                if (score == null)
                    score = 0

                score += (msg as PlayerLikeMessage).performer_point
                updatePkg.$set = {
                    [`henceforth_states.${state.id}.points.${state.player_id}`]: score,
                },

                updatePkg.$push[`henceforth_states.${state.id}.liked_by`] = socketPkg.playerId
            }

            var result = await socketPkg.room.updateOne(_id, updatePkg)
            if (result.modifiedCount != 1) throw Error('update failed')
            io.to(roomId).emit('like_dislike', msg)
        } catch (e) {
            console.log(`[SYSTEM MESSAGE] ${e}`);
        }
    })

}