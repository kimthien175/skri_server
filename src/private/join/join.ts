import { mongoClient } from "../../utils/db/mongo.js";
import { SocketPackage } from "../../types/socket_package.js";
import { privateRoomCollection } from "../../utils/db/collection.js";
import { addPlayerToExistingRoomWithoutClosingDb } from "../../utils/add_player_without_closing_db.js";

export function registerJoinPrivateRoom(socketPkg: SocketPackage) {
    socketPkg.socket.on('join_private_room', async function (arg: RequestJoinRoom, callback) {
        var result: ResponseJoinRoom = Object({})

        try {
            result.success = true
            result.data = await addPlayerToExistingRoomWithoutClosingDb(socketPkg, await privateRoomCollection(), arg.code, arg.player);
        } catch (e: any) {
            console.log(e);
            result.success = false
            result.data = e
        } finally {
            mongoClient.close()
            callback(result)
        }
    });
}