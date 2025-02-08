import { SocketPackage } from "../types/socket_package.js";


import { Mongo } from "../utils/db/mongo.js";
import { PlayerChatMessage } from "../types/message.js";

export function registerListenChatMessages(socketPkg: SocketPackage) {
    socketPkg.socket.on('player_chat', async function (chat: string) {
        await Mongo.connect()
        try {
            var msg = new PlayerChatMessage(socketPkg.socket.id, socketPkg.name, chat)

            await socketPkg.room.updateOne({ code: socketPkg.roomCode }, { $push: { messages: msg } })

            socketPkg.socket.to(socketPkg.roomCode as string).emit('player_chat', msg)
            console.log(`player_chat:${socketPkg.socket.id}: ${chat}`);


        } catch (e) {
            console.log(`player_chat: ${e}`);
        }
    })
}