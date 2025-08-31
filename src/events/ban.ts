import { ObjectId, UpdateFilter, WithId } from "mongodb"
import { SocketPackage } from "../types/socket_package.js"
import { getNewRoomCode } from "../utils/get_room_code.js"
import { PlayerGotBannedMessage } from "../types/message.js"
import { ServerRoom } from "../types/room.js"
import { io } from "../socket_io.js"

export const registerBan = async function (socketPkg: SocketPackage) {
    socketPkg.socket.on('host_ban', async function (victimId: string, callback: (res: BanResponse) => void) {
        // verify host
        try {
            var room = await socketPkg.room.findOne({
                _id: new ObjectId(socketPkg.roomId),
                host_player_id: socketPkg.playerId,
                players: { $elemMatch: { id: victimId } }
            })
            if (room == null) {
                callback({ success: false, reason: 'room not found' })
                return
            }
            await ban(victimId, socketPkg, room)
            callback({ success: true, data: null })
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
    var message = new PlayerGotBannedMessage(room.players[victimId].name)

    var updateFilter: UpdateFilter<ServerRoom> = {
        $push: { messages: message },
        //$pull: { round_white_list: victimId },
        $set: { code: new_code },
        $unset: {
            [`players.${victimId}`]: "",
            [`current_round_done_players.${victimId}`]:""
        }
    }

    var updateResult = await socketPkg.room.findOneAndUpdate({ _id: new ObjectId(socketPkg.roomId) }, updateFilter,
        {
            includeResultMetadata: true,
            returnDocument: "after"
        })



    if (updateResult.ok == 0 || updateResult.value == null) throw Error('[BAN] update failed')

    var victim = updateResult.value.players[victimId]

    if (victim == undefined) throw Error('[BAN]: not found player')

    io.to(victim.socket_id).emit('player_got_banned', { victim_id: victimId })
    io.to(socketPkg.roomId).except(victim.socket_id).emit('player_got_banned', {
        message, new_code, victim_id: victimId
    })

}