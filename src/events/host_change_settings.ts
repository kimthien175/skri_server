import { ObjectId } from "mongodb";
import { SocketPackage } from "../types/socket_package";
import { Mongo } from "../utils/db/mongo.js";

export function registerChangeSettings(socketPkg: SocketPackage) {
    socketPkg.socket.on('change_settings', async function (setting: _SettingItem) {
        await Mongo.connect()
        await Mongo.privateRooms.updateOne({ _id: new ObjectId(socketPkg.roomId) }, { $set: { [`settings.${setting.key}`]: setting.value } })

        socketPkg.socket.to(socketPkg.roomId).emit('change_settings', setting)
    })
}

interface _SettingItem {
    key: string,
    value: any
}