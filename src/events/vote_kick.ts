import { Filter, ObjectId } from "mongodb";
import { SocketPackage } from "../types/socket_package";

import { PlayerVotekickMessage } from "../types/message.js";
import { kick } from "./kick.js";
import { io } from "../socket_io.js";
import { ServerRoom } from "../types/room";

export const registerVoteKick = (socketPkg: SocketPackage) =>
    socketPkg.socket.on('vote_kick', async function (victimId: string, callback: (arg: VotekickResponse) => void) {
        try {
            const filter: Filter<ServerRoom> = {
                _id: new ObjectId(socketPkg._roomId),
                [`players.${socketPkg.playerId}`]: { $exists: true },
                [`players.${victimId}`]: { $exists: true }
            }

            var room = await socketPkg.room.findOne(filter)
            if (room == null) throw Error('room not found')

            var victim = room.players[victimId]

            if (victim.votekick == undefined) {
                victim.votekick = {
                    voter_id_list: [],
                    min_vote: Math.floor((Object.keys(room.players).length - 1) / 2) + 1
                }
            }

            if (victim.votekick.voter_id_list.includes(socketPkg.playerId as string)) throw Error('already voted')

            victim.votekick.voter_id_list.push(socketPkg.playerId as string)

            var message = new PlayerVotekickMessage(socketPkg.name, victim.name, victim.votekick.voter_id_list.length, victim.votekick.min_vote)
            io.to(socketPkg.roomId).except(victim.socket_id).emit('system_message', message)

            var updateFilter = (victim.votekick.voter_id_list.length >= victim.votekick.min_vote) ?// its time to kick
                await kick(victim, socketPkg, room, message) :
                {
                    $push: { messages: message },
                    $set: { [`players.${victimId}.votekick`]: victim.votekick }
                }
                console.log(updateFilter);
            // save to db
            var updateResult = await socketPkg.room.updateOne(filter, updateFilter)
            if (updateResult.modifiedCount != 1) throw Error('update failed')

            callback({ success: true })
        } catch (e) {
            console.log(`[VOTE KICK] ${e}`);
            callback({ success: false, reason: e })
        }
    })

type VotekickResponse = {
    success: true
} | {
    success: false
    reason: any
}