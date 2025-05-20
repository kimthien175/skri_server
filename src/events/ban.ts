import { ObjectId, UpdateFilter, WithId } from "mongodb"
import { SocketPackage } from "../types/socket_package.js"
import { getNewRoomCode } from "../utils/get_room_code.js"
import { PlayerGotBannedMessage } from "../types/message.js"
import { getVictim } from "./vote_kick.js"
import { ServerRoom } from "../types/room.js"
import { io } from "../socket_io.js"

export const registerBan = async function (socketPkg: SocketPackage) {
    socketPkg.socket.on('host_ban', async function (victimId: string, callback: (res: BanResponse) => void) {
        // verify host
        try {
            var room = await socketPkg.room.findOne({
                _id: new ObjectId(socketPkg.roomId),
                host_player_id: socketPkg.socket.id,
                players: { $elemMatch: { id: victimId } }
            })
            if (room == null) {
                callback({ success: false, reason: 'room not found' })
                return
            }
            await ban(victimId, socketPkg, room)
            callback({success: true, data: null})
            return
        } catch (e: any) {
            callback({ success: false, reason: e })
            return
        }
    })
}

type BanResponse = {
    success: true
    data: any
} | {
    success: false
    reason: any
}

async function ban(victimId: string, socketPkg: SocketPackage, room: WithId<ServerRoom>) {
    var new_code = await getNewRoomCode(socketPkg.room)
    var message = new PlayerGotBannedMessage(getVictim(room.players, victimId).name)

    var updateFilter: UpdateFilter<ServerRoom> = {
        $push: { messages: message },
        $pull: {
            players: { id: victimId },
            round_white_list: victimId
        },
        $set: { code: new_code }
    }

    var updateResult = await socketPkg.room.updateOne({ _id: new ObjectId(socketPkg.roomId) }, updateFilter)

    if (updateResult.acknowledged &&
        updateResult.modifiedCount == 1) {
        io.to(victimId).emit('player_got_banned', { victim_id: victimId })
        io.to(socketPkg.roomId).except(victimId).emit('player_got_banned', {
            message, new_code, victim_id: victimId
        })
    } else throw new Error('updating is not right')
}