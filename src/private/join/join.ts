import { Mongo } from "../../utils/db/mongo.js";
import { SocketPackage } from "../../types/socket_package.js";
import { addPlayerToExistingRoom } from "../../utils/add_player_to_room.js";

export function registerJoinPrivateRoom(socketPkg: SocketPackage) {
    socketPkg.socket.on('join_private_room', async function (arg: RequestJoinRoom, callback) {
        var result: ResponseJoinRoom = Object({})
        await Mongo.connect();
        try {
            result.success = true
            result.data = await addPlayerToExistingRoom(socketPkg, Mongo.privateRooms(), arg);
        } catch (e: any) {
            console.log(e);
            result.success = false
            result.data = e
        } finally {
            callback(result)
        }
    });
}