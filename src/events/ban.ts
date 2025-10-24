import { ObjectId, UpdateFilter } from "mongodb"
import { getNewRoomCode, SocketPackage } from "../types/socket_package.js"
import { PlayerGotBannedMessage } from "../types/message.js"
import { PrivateRoom, ServerRoom } from "../types/room.js"
import { io } from "../socket_io.js"
import { Redis } from "../utils/redis.js"

export const registerBan = async function (socketPkg: SocketPackage<PrivateRoom>) {
    socketPkg.socket.on('host_ban', async function (victimId: string, callback: (res: { success: true } | { success: false, reason: any }) => void) {
        // verify host
        try {
            const roomId = await Redis.getRoomId(socketPkg.socket.id)
            const filter: UpdateFilter<PrivateRoom> = await socketPkg.getFilter({
                host_player_id: socketPkg.playerId,
                [`players.${victimId}`]: { $exists: true }
            })
            var room = await socketPkg.room.findOne(filter)
            if (room == null) throw Error('room not found')

            var victim = room.players[victimId]

            var new_code = await getNewRoomCode('private')
            var message = new PlayerGotBannedMessage(room.players[victimId].name)

            var updateFilter: UpdateFilter<ServerRoom> = {
                $push: { messages: message },
                $set: { code: new_code },
                $unset: {
                    [`players.${victimId}`]: "",
                    [`current_round_done_players.${victimId}`]: ""
                }
            }

            var updateResult = await socketPkg.room.updateOne(filter, updateFilter)
            if (updateResult.modifiedCount != 1) throw Error('update failed')


            socketPkg.socket.to(victim.socket_id).emit('player_got_banned', { victim_id: victimId })
            io.to(roomId).except(victim.socket_id).emit('player_got_banned', {
                message, new_code, victim_id: victimId
            })

            callback({ success: true })
        } catch (e: any) {
            console.log(`[BAN] ${e}`);
            callback({ success: false, reason: e })
        }
    })
}