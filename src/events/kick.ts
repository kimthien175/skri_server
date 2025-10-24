import { ObjectId, UpdateFilter, WithId } from "mongodb";
import { getNewRoomCode, SocketPackage } from "../types/socket_package.js";
import { ServerRoom } from "../types/room.js";
import { PlayerGotKickedMessage } from "../types/message.js";
import { io } from "../socket_io.js";
import { ServerTicket } from "../types/ticket.js";
import { Player } from "../types/player.js";
import { handleCasesWhenPlayerLeave } from "../private/disconnect.js";
import { Redis } from "../utils/redis.js";

export const registerKick = async function (socketPkg: SocketPackage) {
    socketPkg.socket.on('host_kick', async function (victimId: string, callback: (res: {
        success: true
    } | { success: false, reason: any }) => void) {
        // verify host 
        try {
            if (victimId == socketPkg.playerId) throw Error("host can't kick themself")

            const filter = await socketPkg.getFilter({
                host_player_id: socketPkg.playerId,
                [`players.${victimId}`]: { $exists: true }
            })

            var room = await socketPkg.room.findOne(filter)
            if (room == null) throw Error('room not found')

            var updateResult = await socketPkg.room.updateOne(filter, await kick(room.players[victimId], socketPkg, room))
            if (updateResult.modifiedCount != 1) throw Error('update failed')

            callback({ success: true })
        } catch (e: any) {
            console.log(`[HOST KICK] ${e}`);
            callback({ success: false, reason: e })
        }
    })
}

/** emit to clients, not save to db, return update filter for other tasks
 *  */
export async function kick(victim: Player, socketPkg: SocketPackage, room: WithId<ServerRoom>): Promise<UpdateFilter<ServerRoom>> {
    const roomId = await Redis.getRoomId(socketPkg.socket.id)
    const message = new PlayerGotKickedMessage(victim.name)
    const newCode = await getNewRoomCode(socketPkg.roomType)
    // create new ticket or check for existing ticket
    const ticketSet = await _getTicket(room.tickets, victim.id)

    const updateFilter: UpdateFilter<ServerRoom>[] = [
        {
            $set: {
                code: newCode,
                [`tickets.${ticketSet.id}`]: ticketSet.ticket
            },
            $push: {
                messages: message
            },
            $unset: {
                [`players.${victim.id}`]: ""
            }
        },
        ...await handleCasesWhenPlayerLeave(socketPkg, victim.id, room as ServerRoom)
    ]

    // delete valid_date
    var clientTicket = { id: ticketSet.id, victim_id: ticketSet.ticket.victim_id }

    io.to(victim.socket_id).emit('player_got_kicked', { ticket: clientTicket });

    io.to(roomId).except(victim.socket_id).emit('player_got_kicked', {
        new_code: newCode,
        message,
        ticket: clientTicket
    })

    return updateFilter
}

async function _getTicket(tickets: ServerRoom['tickets'], victimId: string): Promise<{ id: string, ticket: ServerTicket }> {
    var newValidDate = await ServerTicket.getValidDate()

    for (var ticketId in tickets) {
        var ticket = tickets[ticketId]
        if (ticket.victim_id == victimId) {
            ticket.valid_date = newValidDate
            return {
                id: ticketId,
                ticket: ticket
            }
        }
    }

    return {
        id: new ObjectId().toString(),
        ticket: new ServerTicket(newValidDate, victimId)
    }
}