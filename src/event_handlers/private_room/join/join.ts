import { Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { privateRoomCollection } from "../../../utils/db/collection.js";
import { Collection, PushOperator } from "mongodb";
import { randomName } from "../../../utils/random_name.js";
import { storeMessage } from "../listen_guess/listen_guess.js";
import { addPlayerToExistingRoomWithoutClosingDb } from "../../functions/add_player_without_closing_db.js";
import { mongoClient } from "../../../utils/db/mongo.js";


export function registerJoinPrivateRoom(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
    socket.on('join_private_room', async function (arg: RequestJoinRoom, callback) {
        var result: ResponseJoinRoom = Object({})

        try {        
            result.success = true
            result.data = await addPlayerToExistingRoomWithoutClosingDb(socket, await privateRoomCollection(), arg.code, arg.player);
        } catch (e: any) {
            console.log(e);
            result.success = false
            result.data = e
        } finally{
            mongoClient.close()
        }

        callback(result)
    });
}