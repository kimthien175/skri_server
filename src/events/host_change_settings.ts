import { ObjectId } from "mongodb";
import { SocketPackage } from "../types/socket_package";
import { Redis } from "../utils/redis.js";

export function registerChangeSettings(socketPkg: SocketPackage) {
    socketPkg.socket.on('change_settings', async function (setting: _SettingItem) {
        try {
            if (socketPkg.roomType != 'private') throw Error('not private room')
            const roomId = await Redis.getRoomId(socketPkg.socket.id)
            await socketPkg.room.updateOne({
                _id: new ObjectId(roomId),
                host_player_id: socketPkg.playerId
            }, { $set: { [`settings.${setting.key}`]: setting.value } })

            socketPkg.socket.to(roomId).emit('change_settings', setting)
        } catch (e) {
            console.log(`[CHANGE SETTINGS] ${e}`);
        }
    })
}

interface _SettingItem {
    key: string,
    value: any
}