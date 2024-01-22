import { Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { privateRoomCollection } from "../../utils/db/collection.js";
import { addPlayerToExistingRoomWithoutClosingDb } from "../functions/add_player_without_closing_db.js";
import { mongoClient } from "../../utils/db/mongo.js";
import { SocketPackage } from "../../types/socket_package.js";


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