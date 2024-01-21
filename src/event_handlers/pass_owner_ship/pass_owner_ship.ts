import { Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { mongoClient } from "../../utils/db/mongo.js";
import { storeMessage } from "../private_room/listen_guess/listen_guess.js";
import { privateRoomCollection } from "../../utils/db/collection.js";
import { PushOperator } from "mongodb";

export function registerPassOwnershipOnLeave(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
    socket.on('pass_ownership_on_leave', async function (passOwnerShipMsg:{code: string, playerId: string}, callback) {
        console.log('PASS_OWNERSHIP_ON_LEAVE');
        try {
            socket.to(passOwnerShipMsg.code).emit('room_owner_leave', passOwnerShipMsg.playerId);
            // change player list on db
            var update:    PushOperator<object> = {
                $push: { players: {}}
            };
            (await privateRoomCollection()).updateOne(
                {code: passOwnerShipMsg.code}, 
                {}
            )
        } catch (e) {
            console.log('PASS_OWNERSHIP_ON_LEAVE_ERROR');
            console.log(e);
        } finally {
            callback('whatever, just disconnec')
        }
    })
}
