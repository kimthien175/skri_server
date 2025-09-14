import { ObjectId, UpdateFilter, WithId } from "mongodb";
import { SocketPackage } from "../types/socket_package.js";
import { ServerRoom } from "../types/room.js";
import { Message, PlayerGotKickedMessage } from "../types/message.js";
import { getNewRoomCode } from "../utils/get_room_code.js";
import { io } from "../socket_io.js";
import { ServerTicket } from "../types/ticket.js";
import { Player } from "../types/player.js";
import { GameState } from "../private/state/state.js";

export const registerKick = async function (socketPkg: SocketPackage) {
    socketPkg.socket.on('host_kick', async function (victimId: string, callback: (res: {
        success: true
    } | { success: false, reason: any }) => void) {
        // verify host 
        try {
            if (victimId == socketPkg.playerId) throw Error("host can't kick themself")

            const filter = {
                _id: new ObjectId(socketPkg.roomId),
                host_player_id: socketPkg.playerId,
                [`players.${victimId}`]: { $exists: true }
            }

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
export async function kick<R extends ServerRoom>(victim: Player, socketPkg: SocketPackage, room: WithId<R>, firstMessage?: Message): Promise<UpdateFilter<ServerRoom>> {
    var message = new PlayerGotKickedMessage(victim.name)
    var newCode = await getNewRoomCode(socketPkg.room)

    // create new ticket or check for existing ticket
    var ticketSet = await _getTicket(room.tickets, victim.id)

    var updateFilter: UpdateFilter<ServerRoom> = await GameState.onPlayerLeave(room, socketPkg, firstMessage)

    updateFilter.$set = {
        ...updateFilter.$set,
        code: newCode,
        [`tickets.${ticketSet.id}`]: ticketSet.ticket
    }

    // delete valid_date
    var clientTicket = { id: ticketSet.id, victim_id: ticketSet.ticket.victim_id }

    io.to(victim.socket_id).emit('player_got_kicked', { ticket: clientTicket });

    io.to(socketPkg.roomId).except(victim.socket_id).emit('player_got_kicked', {
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