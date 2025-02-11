import { getLastestSpecs, Mongo } from "../../utils/db/mongo.js";
import { SocketPackage } from "../../types/socket_package.js";
import { PrivateRoomJoinRequest, PrivateRoomRejoinRequest, RoomResponse } from "../../types/type.js";
import { PrivateRoom, PublicRoom, ServerRoom } from "../../types/room.js";
import { Random } from "../../utils/random/random.js";
import { Collection, Filter, ModifyResult,ObjectId,PushOperator, ReturnDocument, WithId } from "mongodb";
import { PlayerJoinMessage } from "../../types/message.js";
import { BlackItem } from "../../types/black_list.js";


export function registerJoinPrivateRoom(socketPkg: SocketPackage) {
    socketPkg.socket.on('join_private_room', async (requestPkg: PrivateRoomJoinRequest | PrivateRoomRejoinRequest, callback) =>
        callback(await new Promise<RoomResponse<PrivateRoom>>(async function (resolve) {
            await Mongo.connect()
            try {

                var filter: Filter<PrivateRoom>
                if ((requestPkg as PrivateRoomRejoinRequest).ticket != null ){
                    var kick_interval = (await getLastestSpecs()).system.kick_interval
                    console.log(requestPkg);

                    // check valid date
                    var validDate = new Date()
                    validDate.setSeconds(validDate.getSeconds() - kick_interval)

                    filter = {
                        _id: new ObjectId((requestPkg as PrivateRoomRejoinRequest).ticket),
                        black_list: {
                            $elemMatch: {
                                type: 'kick',
                                date: { $lt: validDate },
                                id: (requestPkg as PrivateRoomRejoinRequest).victim_id
                            }
                        }
                    }
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
                    player.name = (await Random.getWords(1, requestPkg.lang, 'Normal'))[0];
                }
                //#endregion
                var $push: PushOperator<PrivateRoom> = {
                    players: player,
                    messages: new PlayerJoinMessage(player.id, player.name),
                    round_white_list: player.id
                }

                // modify socketPkg
                socketPkg.roomId = foundRoom._id.toString()
                socketPkg.isOwner = false
                socketPkg.name = player.name
                socketPkg.isPublicRoom = false

                var room: WithId<PrivateRoom> | null = await (socketPkg.room as unknown as Collection<PrivateRoom>).findOneAndUpdate(
                    { code: foundRoom.code as string },
                    { $push },
                    {
                        returnDocument: ReturnDocument.AFTER,
                        projection: PrivateRoomProjection,
                        includeResultMetadata: false
                    })

                if (room == null) {
                    console.log('join private room error');
                    console.log(room);
                    resolve({ success: false, data: { type: 'room_not_found' } })
                    return
                }

                await socketPkg.socket.join(socketPkg.roomId)

                // notify other players
                socketPkg.socket.to(socketPkg.roomId).emit('player_join', $push)

                resolve({ success: true, data: { player, room: room } })

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

export const PrivateRoomProjection//: Record<keyof PrivateRoom, any> & { _id: number } 
    = {
    _id: 1,
    host_player_id: 1,
    options: 1,
    players: 1,
    settings: 1,
    messages: { $slice: ["$messages", -20] },
    future_states: [],
    states: { $slice: ["$states", -1] },
    code: 1,
    system: 1,
    round_white_list: 1,
    current_round: 1,
    // black_list: 0,
}