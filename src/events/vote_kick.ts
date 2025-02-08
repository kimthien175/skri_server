import { WithId } from "mongodb";
import { SocketPackage } from "../types/socket_package";
import { ServerRoom } from "../types/room";

export const registerVoteKick = (socketPkg: SocketPackage) =>
    socketPkg.socket.on('vote_kick', async function (victimId: string, callback: (arg: VotekickResponse) => void) {
        // try {
        //     var room: WithId<Pick<ServerRoom, 'players'>> | null = await socketPkg.room.findOne({ code: socketPkg.roomCode }, {projection:{_id: 1, players: 1, }})
        //     if (room == null) {
        //         callback({ success: false, reason: 'room not found' })
        //         return
        //     }

        //     var victim = getVictim(room.players, victimId)

        //     if (victim.votekick_by_ids == undefined)
        //         victim.votekick_by_ids = []

        //     if (victim.votekick_by_ids.includes(socketPkg.socket.id)) {
        //         callback({ success: false, reason: 'already voted' })
        //         return
        //     }

        //     if (victim.votekick_by_ids.length >= Math.floor(room.players.length /2)+1){
        //         // kick and notify
        //     } else {
        //         // notify
        //         socketPkg.socket.to(socketPkg.roomCode).emit()
        //     }
        // } catch (e: any) {
        //     callback({ success: false, reason: e })
        //     return
        // }
    })

export function getVictim(players: Player[], victimId: String): Player {
    for (let player of players) {
        if (player.id == victimId) return player
    }
    throw new Error('player not found')
}

type VotekickResponse = {
    success: true
    should_remove: boolean
} | {
    success: false
    reason: any
}