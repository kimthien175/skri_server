import { Mongo } from "../../utils/db/mongo.js";
import { SocketPackage } from "../../types/socket_package.js";
import { PrivateRoomJoinRequest, PrivateRoomRejoinRequest, RoomResponse } from "../../types/type.js";
import { PrivateRoom, RoomProjection } from "../../types/room.js";
import { Random } from "../../utils/random/random.js";
import { Collection, Filter, ObjectId, ReturnDocument, UpdateFilter } from "mongodb";
import { PlayerJoinMessage } from "../../types/message.js";
import { GameState } from "../state/state.js";
import { Player } from "../../types/player.js";

/**
 * 
 * send full data, except `settings.custom_words` and states sensitive properties
 */
export function registerJoinPrivateRoom(socketPkg: SocketPackage<PrivateRoom>) {
    socketPkg.socket.on('join_private_room', async function (requestPkg: PrivateRoomJoinRequest | PrivateRoomRejoinRequest, callback: (arg: RoomResponse<PrivateRoom>) => void
    ) {
        try {
            await Mongo.connect()
            //#region PLAYER
            const player = requestPkg.player
            player.socket_id = socketPkg.socket.id
            player.score = 0

            //player.ip = socket.handshake.address
            if (player.name === '') {
                player.name = (await Random.getWords({ word_count: 1, language: requestPkg.lang }))[0];
            }
            //#endregion

            //#region SOCKET PACKAGE
            //socketPkg.isOwner = false
            socketPkg.name = player.name
            socketPkg.roomType = 'private'
            socketPkg.playerId = player.id
            //#endregion

            var ticketId = (requestPkg as PrivateRoomRejoinRequest).id
            var roomFilter
            if (ticketId != null) {
                roomFilter = {
                    [`tickets.${ticketId}.valid_date`]: { $lt: new Date() },  // as kicked player rejoining          
                    [`tickets.${ticketId}.victim_id`]: (requestPkg as PrivateRoomRejoinRequest).victim_id
                }
                player.id = (requestPkg as PrivateRoomRejoinRequest).victim_id
            } else {
                roomFilter = {
                    code: (requestPkg as PrivateRoomJoinRequest).code, // as fresh new player joining
                }
                player.id = new ObjectId().toString()
            }

            const filter: Filter<PrivateRoom> = {
                $and: [
                    roomFilter,
                    { [`players.${player.id}`]: { $exists: false } }, // prevent player id collision error
                    { $expr: { $lt: [{ $size: { $objectToArray: "$players" } }, "$settings.players"] } } // number of existing players must be lower than allowed max players
                ]
            }

            const updateFilter: UpdateFilter<PrivateRoom> & { $push: NonNullable<UpdateFilter<PrivateRoom>> } = {
                $push: { messages: new PlayerJoinMessage(player.id, player.name) },
                $set: { [`players.${player.id}`]: player }
            }

            var room = await socketPkg.room.findOneAndUpdate(filter, updateFilter, {
                projection: RoomProjection,
                returnDocument: ReturnDocument.AFTER
            })
            if (room == null) throw Error('room_not_found')

            // modify socketPkg
            const roomId = room._id.toString()
            await socketPkg.setRoomId(roomId) 

            await socketPkg.socket.join(roomId)

            // notify other players
            socketPkg.socket.to(roomId).emit('player_join', { message: updateFilter.$push.messages, player })

            //#region REMOVE SENSITIVE INFORMATION BEFORE SENDING TO CLIENT
            delete room.settings.custom_words
            GameState.removeSensitiveProperties(room.henceforth_states[room.status.current_state_id])
            if (room.status.command == 'end')
                GameState.removeSensitiveProperties(room.henceforth_states[room.status.next_state_id])
            delete (room as any)._id
            //#endregion

            callback({ success: true, player, room })
        } catch (e: any) {
            console.log(`[JOIN PRIVATE ROOM]: ${socketPkg.playerId} ${requestPkg}`)
            console.log(e);
            callback({ success: false, reason: (e as Error).message })
        }
    })
}
