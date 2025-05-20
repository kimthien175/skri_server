import { getLastestSpecs, Mongo } from "../../utils/db/mongo.js";
import { SocketPackage } from "../../types/socket_package.js";
import { PrivateRoomJoinRequest, PrivateRoomRejoinRequest, RoomResponse } from "../../types/type.js";
import { PrivateRoom, PublicRoom, ServerRoom } from "../../types/room.js";
import { Random } from "../../utils/random/random.js";
import { Collection, Filter, FindOneAndUpdateOptions, ModifyResult, ObjectId, PushOperator, ReturnDocument, UpdateFilter, WithId } from "mongodb";
import { PlayerJoinMessage } from "../../types/message.js";
import { BlackItem } from "../../types/black_list.js";

/**
 * 
 * send full data, except `settings.custom_words` and states sensitive properties
 */
export function registerJoinPrivateRoom(socketPkg: SocketPackage) {
    socketPkg.socket.on('join_private_room', async (requestPkg: PrivateRoomJoinRequest | PrivateRoomRejoinRequest, callback) =>
        callback(await new Promise<RoomResponse<PrivateRoom>>(async function (resolve) {
            await Mongo.connect()
            try {

                var filter: Filter<PrivateRoom>
                if ((requestPkg as PrivateRoomRejoinRequest).ticket_id != null) {
                    console.log(requestPkg);

                    filter = {
                        _id: new ObjectId((requestPkg as PrivateRoomRejoinRequest).room_id),
                        tickets: {
                            $elemMatch: {
                                ticket_id: (requestPkg as PrivateRoomRejoinRequest).ticket_id,
                                valid_date: { $lt: new Date() },
                            }
                        }
                    }
                    console.log(filter);
                } else {
                    filter = {
                        code: (requestPkg as PrivateRoomJoinRequest).code,
                    }
                }

                var foundRoom = await Mongo.privateRooms.findOne(filter, { projection: PrivateRoomProjection })

                if (foundRoom == null) {
                    resolve({ success: false, data: { type: 'room_not_found' } })
                    return
                }

                if (foundRoom.players.length == foundRoom.settings.players) {
                    resolve({ success: false, data: { type: 'room_full' } })
                    return
                }

                const socket = socketPkg.socket
                //#region PLAYER
                const player = requestPkg.player
                player.id = socket.id
                //player.ip = socket.handshake.address
                if (player.name === '') {
                    player.name = (await Random.getWords(1, requestPkg.lang))[0];
                }
                //#endregion

                var updateFilter: UpdateFilter<PrivateRoom> = {
                    $push: {
                        players: player,
                        messages: new PlayerJoinMessage(player.id, player.name),
                        round_white_list: player.id
                    }
                }

                var options: FindOneAndUpdateOptions & { includeResultMetadata: false } = {
                    returnDocument: ReturnDocument.AFTER,
                    projection: PrivateRoomProjection,
                    includeResultMetadata: false
                }

                if ((requestPkg as PrivateRoomRejoinRequest).ticket_id != null) {
                    // modify ticket by new victim_id
                    updateFilter.$set = { 'tickets.$[b].victim_id': socket.id }
                    options.arrayFilters = [{ 'b.ticket_id': (requestPkg as PrivateRoomRejoinRequest).ticket_id }]
                }

                // modify socketPkg
                socketPkg.roomId = foundRoom._id.toString()
                socketPkg.isOwner = false
                socketPkg.name = player.name
                socketPkg.isPublicRoom = false

                var room: WithId<PrivateRoom> | null = await (socketPkg.room as unknown as Collection<PrivateRoom>).findOneAndUpdate(
                    { code: foundRoom.code as string },
                    updateFilter,
                    options)

                if (room == null) {
                    console.log('join private room error');
                    console.log(room);
                    resolve({ success: false, data: { type: 'room_not_found' } })
                    return
                }

                await socketPkg.socket.join(socketPkg.roomId)

                // notify other players
                socketPkg.socket.to(socketPkg.roomId).emit('player_join', updateFilter.$push)

                console.log(room);

                // TODO: SEND settings.custom_words to new room host 
                delete room.settings.custom_words

                room.henceforth_states[room.status.current_state_id].removeSensitiveProperties()

                if (room.status.command == 'end') {
                    room.henceforth_states[room.status.next_state_id].removeSensitiveProperties()
                }

                resolve({ success: true, data: { player, room } })

            } catch (e: any) {
                console.log(`join_private_room: ${socketPkg.socket.id} ${requestPkg}`)
                console.log(e);
                resolve({
                    success: false, data: {
                        type: 'unhandled_error',
                        ...e
                    }
                })
            }
        }))
    )
}

// TODO: MESSAGES LAZY LOADING
export const PrivateRoomProjection//: Record<keyof PrivateRoom, any> & { _id: number } 
    = {
    _id: 1,
    host_player_id: 1,
    options: 1,
    players: 1,
    settings: 1,
    messages: { $slice: ["$messages", -20] },
    henceforth_states: 1,
    status: 1,
    code: 1,
    system: 1,
    current_round: 1,
    // black_list: 0,
}