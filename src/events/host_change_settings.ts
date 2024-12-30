import { SocketPackage } from "../types/socket_package";
import { Mongo } from "../utils/db/mongo.js";

export function registerChangeSettings(socketPkg: SocketPackage) {
    socketPkg.socket.on('change_settings', async function (setting: _SettingItem) {

        await Mongo.privateRooms.updateOne({ code: socketPkg.roomCode }, { $set: { [`settings.${setting.key}`]: setting.value } })

        socketPkg.socket.to(socketPkg.roomCode).emit('change_settings', setting)
    })
}

interface _SettingItem {
    key: string,
    value: any
}