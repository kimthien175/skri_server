import { SocketPackage } from "../types/socket_package";
import { Mongo } from "../utils/db/mongo.js";

export function registerChangeSettings(socketPkg: SocketPackage) {
    socketPkg.socket.on('change_settings', async function (setting: _SettingItem) {
// change settings on db
            var settingKey = Object.keys(setting)[0]
          await Mongo.privateRooms().updateOne({ code: socketPkg.roomCode }, {$set: {[`settings.${settingKey}`] :setting[settingKey]}}) 

        socketPkg.socket.to(socketPkg.roomCode).emit('change_settings', setting)
    })
}

interface _SettingItem {
    [settingItem: string]: any
}