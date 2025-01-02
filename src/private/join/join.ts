import { Mongo } from "../../utils/db/mongo.js";
import { SocketPackage } from "../../types/socket_package.js";
import { PrivateRoomJoinRequest, RoomResponse } from "../../types/type.js";
import { PrivateRoom, PublicRoom, ServerRoom } from "../../types/room.js";
import { Random } from "../../utils/random/random.js";
import { Collection, ModifyResult, PushOperator, ReturnDocument, WithId } from "mongodb";
import { PlayerJoinMessage } from "../../types/message.js";


export function registerJoinPrivateRoom(socketPkg: SocketPackage) {
    socketPkg.socket.on('join_private_room', async (requestPkg: PrivateRoomJoinRequest, callback) =>
        callback(await new Promise<RoomResponse<PrivateRoom>>(async function (resolve) {
            const socket = socketPkg.socket
            //#region PLAYER
            const player = requestPkg.player
            player.id = socket.id
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
                var $push: PushOperator<PrivateRoom> = {
                    players: player,
                    messages: new PlayerJoinMessage(player.id, player.name),
                    round_white_list: player.id
                }
                var room: WithId<PrivateRoom> | null = await (socketPkg.room as unknown as Collection<PrivateRoom>).findOneAndUpdate(
                    { code: requestPkg.code },
                    { $push },
                    {
                        returnDocument: ReturnDocument.AFTER,
                        projection: PrivateRoomProjection,
                        includeResultMetadata: false
                    })

                // notify other players
                socketPkg.socket.to(socketPkg.roomCode).emit('player_join', $push)

                if (room == null) {
                    console.log('join private room error');
                    console.log(room);
                    resolve({ success: false, data: { error: 'join_private_room_error' } })
                    return
                }

                console.log(room);

                await socketPkg.socket.join(socketPkg.roomCode)
                resolve({ success: true, data: { player, room: room } })

            } catch (e: any) {
                console.log(`join_private_room: ${socketPkg.socket.id} ${requestPkg.code}`)
                console.log(e);
                resolve({ success: false, data: e })
            }
        }))
    )
}

export const PrivateRoomProjection: Record<keyof PrivateRoom, any> &{_id: number} = {
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
    current_round: 1
}