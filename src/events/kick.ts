import { Collection, Filter, UpdateFilter } from "mongodb";
import { SocketPackage } from "../types/socket_package.js";
import { PrivateRoom, ServerRoom } from "../types/room";
import { PlayerGotKickedMessage } from "../types/message.js";
import { getVictim } from "./vote_kick.js";
import { Kicked } from "../types/black_list.js";
import { getNewRoomCode } from "../utils/get_room_code.js";
import { io } from "../socket_io.js";

export const registerKick = async function (socketPkg: SocketPackage) {

    socketPkg.socket.on('host_kick', async function (victimId: string, callback: (res: KickResponse) => void) {
        // verify host 
        try {
            var room = await (socketPkg.room as Collection<PrivateRoom>).findOne(
                {
                    code: socketPkg.roomCode,
                    host_player_id: socketPkg.socket.id,
                    players: { $elemMatch: { id: victimId } }
                }

            )
            if (room == null) {
                callback({ success: false, reason: 'room not found' })
                return
            }

            await kick(victimId, socketPkg)
            callback({success: true, data: null})
            return
        } catch (e: any) {
            callback({ success: false, reason: e })
            return
        }
    })
}

type KickResponse = {
    success: true
    data: any
} | { success: false, reason: any }

async function kick(victimId: String, socketPkg: SocketPackage) {
    var room = await socketPkg.room.findOne({ code: socketPkg.roomCode })
    if (room == null) throw new Error('room not found')

    var new_code = await getNewRoomCode(socketPkg.room as Collection<ServerRoom>)
    var message = new PlayerGotKickedMessage(getVictim(room.players, victimId).name)
    var black_item = new Kicked(socketPkg.roomCode, victimId)

    //save to db
    var updateResult = await socketPkg.room.updateOne({ code: socketPkg.roomCode }, {
        $push: {
            messages: message,
            black_list: black_item
        },
        $pull: { players: { id: victimId } },
        $set: { code: new_code }
    })

    if (updateResult.modifiedCount == 1) {
        // emit to victim
        io.to(victimId as string).emit('player_got_kicked', {
            ticket: updateResult.upsertedId,
            date: black_item.date,
            victim_id: victimId
        })
        // emit to everyone else
        io.to(socketPkg.roomCode as string).except(victimId as string).emit('player_got_kicked', {
            message, new_code, victim_id: victimId
        })
    } else {
        throw new Error('updating is not right')
    }
}