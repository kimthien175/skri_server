import { SocketPackage } from "../types/socket_package.js";


import { Mongo } from "../utils/db/mongo.js";
import { PlayerChatMessage } from "../types/message.js";
import { ObjectId } from "mongodb";

export function registerListenChatMessages(socketPkg: SocketPackage) {
    socketPkg.socket.on('player_chat', async function (chat: string) {
        await Mongo.connect()
        try {
            var msg = new PlayerChatMessage(socketPkg.playerId as string, socketPkg.name, chat)

            await socketPkg.room.updateOne(
                {
                    _id: new ObjectId(socketPkg.roomId),
                    [`players.${socketPkg.playerId}`]: { $exists: true }
                },
                { $push: { messages: msg } }
            )

            socketPkg.socket.to(socketPkg.roomId).emit('player_chat', msg)
            console.log(`player_chat:${socketPkg.playerId}: ${chat}`);


        } catch (e) {
            console.log(`player_chat: ${e}`);
        }
    })
}