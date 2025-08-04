import { Collection, FindOneAndUpdateOptions, MatchKeysAndValues, ObjectId, PushOperator, ReturnDocument, UpdateFilter, WithId } from "mongodb";
import { SocketPackage } from "../types/socket_package.js";
import { PrivateRoom, ServerRoom } from "../types/room.js";
import { PlayerGotKickedMessage } from "../types/message.js";
import { getVictim } from "./vote_kick.js";
import { getNewRoomCode } from "../utils/get_room_code.js";
import { io } from "../socket_io.js";
import { ServerTicket } from "../types/ticket.js";
import { Player } from "../types/player.js";

export const registerKick = async function (socketPkg: SocketPackage) {
    socketPkg.socket.on('host_kick', async function (victimId: string, callback: (res: KickResponse) => void) {
        // verify host 
        try {
            var room = await (socketPkg.room as unknown as Collection<PrivateRoom>).findOne(
                {
                    _id: new ObjectId(socketPkg.roomId),
                    host_player_id: socketPkg.socket.id,
                    players: { $elemMatch: { id: victimId } }
                }

            )
            if (room == null) {
                callback({ success: false, reason: 'room not found' })
                return
            }

            await kick(getVictim(room.players, victimId), socketPkg, room)
            callback({ success: true, data: null })
            return
        } catch (e: any) {
            callback({ success: false, reason: e })
            return
        }
    })
}

type KickResponse = {
    success: true
    data: any
} | { success: false, reason: any }

export async function kick(victim: Player, socketPkg: SocketPackage, room: WithId<ServerRoom>) {
    var roomObjId = new ObjectId(socketPkg.roomId)

    var new_code = await getNewRoomCode(socketPkg.room)
    var message = new PlayerGotKickedMessage(victim.name)

    var updateFilter: UpdateFilter<ServerRoom> & { $set: MatchKeysAndValues<ServerRoom> } & { $push: PushOperator<ServerRoom> } = {
        $push: {
            messages: message
        },
        $pull: {
            players: { id: victim.id },
            round_white_list: victim.id
        },
        $set: { code: new_code }
    }
    var options: FindOneAndUpdateOptions & {
        includeResultMetadata: false;
    } = {
        returnDocument: ReturnDocument.AFTER,
        projection: { _id: 1 },
        includeResultMetadata: false
    }

    var ticket = await ServerTicket.init(victim.id)

    // check existing ticket
    if (room.tickets != undefined) {
        for (var serverTicket of room.tickets) {
            if (serverTicket.victim_id == victim.id) {
                console.log(`found exist ticket ${serverTicket}`);
                // replace ticket
                updateFilter.$set['tickets.$[b]'] = ticket
                options.arrayFilters = [{ "b.victim_id": victim.id }]

                break
            }
        }
    }

    if (options.arrayFilters == undefined) {
        (updateFilter.$push as any).tickets = ticket
    }

    //save to db
    var updateResult = await socketPkg.room.findOneAndUpdate(
        { _id: roomObjId },
        updateFilter,
        options)

    if (updateResult != null) {
        console.log(updateResult._id);
        // emit to victim
        console.log(`server ticket ${ticket}`);
        console.log(`client ticket ${ticket.toClientTicket(roomObjId.toString())}`);
        io.to(victim.id).emit('player_got_kicked', ticket.toClientTicket(roomObjId.toString()))

        // emit to everyone else
        io.to(socketPkg.roomId).except(victim.id).emit('player_got_kicked', {
            message, new_code, victim_id: victim.id
        })
    } else {
        throw new Error('updating is not right')
    }
}