import { storeMessage } from "../utils/store_message.js";
import { SocketPackage } from "../types/socket_package.js";

import { Collection } from "mongodb";
import { Mongo } from "../utils/db/mongo.js";

export function registerListenChatMessages(socketPkg: SocketPackage) {
    socketPkg.socket.on('player_chat', async function (chat: string) {
        await Mongo.connect()
        try {
            var msg: PlayerChatMessage = {
                type: 'player_chat',
                player_name: socketPkg.name as string,
                chat,
                timestamp: new Date()
            }

            socketPkg.socket.to(socketPkg.roomCode).emit('player_chat', msg)
            console.log(`player_chat:${socketPkg.socket.id}: ${chat}`);

            await storeMessage(socketPkg.room as Collection<Document>, socketPkg.roomCode, msg);
        } catch (e) {
            console.log(`player_chat: ${e}`);
        }
    })
}