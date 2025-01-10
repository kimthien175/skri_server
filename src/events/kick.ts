import { Collection } from "mongodb";
import { SocketPackage } from "../types/socket_package.js";
import { PrivateRoom } from "../types/room";
import { PlayerGotKickedMessage } from "../types/message.js";
import { getVictim } from "./vote_kick.js";

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
            if (room == null){
                callback({success: false, reason: 'room not found'})
                return
            }

            var update = {
                $push:{messages: new PlayerGotKickedMessage(getVictim(room.players, victimId).name)},
                $pull: {players: {id: victimId}}
            }
            var result = await socketPkg.room.updateOne({_id: room._id},update)
            if (result.modifiedCount ==1){
                callback({success: true , data: update})
                socketPkg.socket.to(socketPkg.roomCode).emit('player_got_kicked',update)
                return
            }
            callback({success: false, reason: result})
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