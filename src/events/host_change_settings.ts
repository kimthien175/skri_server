import { ObjectId } from "mongodb";
import { SocketPackage } from "../types/socket_package";
import { Mongo } from "../utils/db/mongo.js";
import { PrivateRoom } from "../types/room.js";

export function registerChangeSettings(socketPkg: SocketPackage) {
    socketPkg.socket.on('change_settings', async function (setting: _SettingItem) {
        try {
            if (socketPkg.isPublicRoom) throw Error('not private room')
            await socketPkg.room.updateOne({
                _id: new ObjectId(socketPkg.roomId),
                host_player_id: socketPkg.playerId
            }, { $set: { [`settings.${setting.key}`]: setting.value } })

            socketPkg.socket.to(socketPkg.roomId).emit('change_settings', setting)
        } catch (e) {
            console.log(`[CHANGE SETTINGS] ${e}`);
        }
    })
}

interface _SettingItem {
    key: string,
    value: any
}