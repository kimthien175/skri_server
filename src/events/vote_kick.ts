import { ObjectId, WithId } from "mongodb";
import { SocketPackage } from "../types/socket_package";
import { ServerRoom } from "../types/room";
import { PlayerVotekickMessage } from "../types/message.js";
import { kick } from "./kick.js";
import { io } from "../socket_io.js";
import { Player } from "../types/player";

export const registerVoteKick = (socketPkg: SocketPackage) =>
    socketPkg.socket.on('vote_kick', async function (victimId: string, callback: (arg: VotekickResponse) => void) {
        try {
            var roomObjId = new ObjectId(socketPkg._roomId)
            var room = await socketPkg.room.findOne({_id: roomObjId, players: {$elemMatch: {id: victimId}}})

            if (room ==null){
                callback({success: false, reason: 'room not found'})
                return
            }
            
            var victim = room.players[ victimId]

            if (victim.votekick == undefined){
                victim.votekick = {
                    voter_id_list: [],
                    min_vote: Math.floor((Object.keys(room.players).length-1) /2)+1
                }
            }

            if (victim.votekick.voter_id_list.includes(socketPkg.playerId as string)){
                callback({success: false, reason: 'already voted'})
                return
            }

            victim.votekick.voter_id_list.push(socketPkg.playerId as string)

// add message
var message = new PlayerVotekickMessage(socketPkg.name, victim.name, victim.votekick.voter_id_list.length, victim.votekick.min_vote)
           

                // save to db
            var updateResult = await socketPkg.room.updateOne({_id: roomObjId},{
                $push:{
                    messages: message
                },
                $set:{'players.$[v].votekick': victim.votekick}
            }, {
                arrayFilters: [{'v.id': victimId}]
            })

            if (!updateResult.acknowledged || !updateResult.modifiedCount){
                callback({success: false, reason: 'update failed'})
                return
            }

            // notify to everyone else except victim
            io.to(socketPkg.roomId).except(victimId).emit('system_message',message)

            if (victim.votekick.voter_id_list.length == victim.votekick.min_vote) {
                // its time to kick
                await kick(victim, socketPkg, room)
            } else if (victim.votekick.voter_id_list.length > victim.votekick.min_vote){
                callback({success: false, reason: 'vote overflow'})
                return
            }

            callback({ success: true })
            return
        } catch (e){
            callback({success: false, reason: e})
            return
        }
    })

// export function getVictim(players: Player[], victimId: String): Player {
//     for (let player of players) {
//         if (player.id == victimId) return player
//     }
//     throw new Error('player not found')
// }

type VotekickResponse = {
    success: true
} | {
    success: false
    reason: any
}