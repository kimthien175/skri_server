import { Mongo } from "../../utils/db/mongo.js";
import { SocketPackage } from "../../types/socket_package.js";
import { PrivateRoomJoinRequest, RoomResponse } from "../../types/type.js";
import { PrivateRoom, PublicRoom, ServerRoom } from "../../types/room.js";
import { Random } from "../../utils/random/random.js";
import { Collection, ModifyResult, PushOperator, ReturnDocument, WithId } from "mongodb";
import { PlayerJoinMessage } from "../../types/message.js";
import { BlackItem } from "../../types/black_list.js";


export function registerJoinPrivateRoom(socketPkg: SocketPackage) {
    socketPkg.socket.on('join_private_room', async (requestPkg: PrivateRoomJoinRequest, callback) =>
        callback(await new Promise<RoomResponse<PrivateRoom>>(async function (resolve) {
            const socket = socketPkg.socket
            //#region PLAYER
            const player = requestPkg.player
            player.id = socket.id
            //player.ip = socket.handshake.address
            if (player.name === '') {
                player.name = (await Random.getWords(1, requestPkg.lang, 'Normal'))[0];
            }
            //#endregion


            // modify socketPkg
            socketPkg.roomCode = requestPkg.code
            socketPkg.isOwner = false
            socketPkg.name = player.name


            await Mongo.connect()

            try {
                // check player in black list or not


                var $push: PushOperator<PrivateRoom> = {
                    players: player,
                    messages: new PlayerJoinMessage(player.id, player.name),
                    round_white_list: player.id
                }

                var foundRoom = await (socketPkg.room as Collection<PrivateRoom>).findOne({
                    code: requestPkg.code,
                    obsolete_codes: { $nin: [requestPkg.code] }
                }, { projection: PrivateRoomProjection })

                if (foundRoom == null) {
                    resolve({ success: false, data: { type: 'room_not_found' } })
                    return
                }

                if (foundRoom.players.length == foundRoom.settings.players) {
                    resolve({ success: false, data: { type: 'room_full' } })
                    return
                }

                // check player in blacklist
                // if (foundRoom.black_list != undefined) {
                //     for (var blackItem of foundRoom.black_list) {
                //         if (blackItem.ip == player.ip) {
                //             resolve({ success: false, data: blackItem })
                //             return
                //         }
                //     }
                // }

                var room: WithId<PrivateRoom> | null = await (socketPkg.room as Collection<PrivateRoom>).findOneAndUpdate(
                    { code: requestPkg.code },
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

                await socketPkg.socket.join(socketPkg.roomCode as string)

                // notify other players
                socketPkg.socket.to(socketPkg.roomCode as string).emit('player_join', $push)

                resolve({ success: true, data: { player, room: room } })

            } catch (e: any) {
                console.log(`join_private_room: ${socketPkg.socket.id} ${requestPkg.code}`)
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
    _id: 0,
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
    //obsolete_codes:0,
}