import { ObjectId, OptionalId } from "mongodb";
import { SocketPackage } from "../types/socket_package.js";
import { RoomProjection, ServerRoom } from "../types/room.js";

export async function registerReloading(socketPkg: SocketPackage) {
    socketPkg.socket.on('reload', async function (callback) {
        try {
            const data = await socketPkg.room.findOne({
                _id: new ObjectId(socketPkg.roomId),
                [`players.${socketPkg.playerId}`]: { $exists: true }
            }, {
                projection: RoomProjection
            })
            if (data == null) throw Error('room not found')

            delete (data as OptionalId<ServerRoom>)._id
            callback({ success: true, data })
        } catch (e) {
            console.log(`[RELOAD] ${e}`);
            callback({ success: false, reason: e })
        }
    })
}