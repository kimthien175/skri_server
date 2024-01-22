import { privateRoomCollection, publicRoomCollection } from "../utils/db/collection.js";
import { storeMessageWithoutClosingDb } from "../utils/store_message_withou_closing_db.js";
import { SocketPackage } from "../types/socket_package.js";
import { mongoClient } from "../utils/db/mongo.js";
import { Collection } from "mongodb";

export function registerListenGuessMessages(socketPkg: SocketPackage) {
    socketPkg.socket.on('player_guess', async function (guess:string) {
        try {
            var msg:PlayerGuessMessage={
                type: 'player_guess',
                player_name: socketPkg.name as string,
                guess,
                timestamp: new Date()
            }

            socketPkg.socket.to(socketPkg.roomCode).emit('player_guess',msg)
            console.log(`player_guess:${socketPkg.socket.id}: ${guess}`);

            var collection: Collection<Document> = socketPkg.roomCode.startsWith('p_') ? (await publicRoomCollection()) : (await privateRoomCollection())
            await storeMessageWithoutClosingDb(collection, socketPkg.roomCode, msg);
        } catch(e){
            console.log(`player_guess: ${e}`);
        }finally{
            mongoClient.close();
        }
    })
}