import { SocketPackage } from '../../types/socket_package.js';

import { Mongo, getLastestSpecs } from '../../utils/db/mongo.js';
import { Random } from '../../utils/random/random.js';
import { RoomRequestPackage, RoomResponse } from '../../types/type.js';
import {PrivateRoom } from '../../types/room.js';
import { NewHostMessage } from '../../types/message.js';
import { PrivatePreGameState } from '../state/state.js';
import { getNewRoomCode } from '../../utils/get_room_code.js';


export function registerInitPrivateRoom(socketPackage: SocketPackage) {
    socketPackage.socket.on('init_private_room', async (requestPkg: RoomRequestPackage, callback) =>
        callback(await new Promise<RoomResponse<PrivateRoom>>(async function (resolve) {
            const socket = socketPackage.socket;
            await Mongo.connect();
            try {
                const player = requestPkg.player;
                //#region PLAYER
                player.id = socket.id
                //player.ip = socket.handshake.address;
                if (player.name === '') {
                    player.name = (await Random.getWords(1, requestPkg.lang, 'Normal'))[0];
                }
                //#endregion

                const room: PrivateRoom= {
                    code: await getNewRoomCode(Mongo.privateRooms),
                    host_player_id: player.id,
                    players: [player],
                    messages: [new NewHostMessage(player.id, player.name)],
                    future_states: [],
                    ...(await getLastestSpecs()),
                    states: [new PrivatePreGameState()],
                    round_white_list: [player.id],
                    current_round: 1
                };

                // insert code to room
                var instertResult = await Mongo.privateRooms.insertOne(room)

                // modify socket package
                socketPackage.roomId = instertResult.insertedId.toString()
                socketPackage.name = player.name
                socketPackage.isOwner = true
                socketPackage.isPublicRoom = false

                console.log(instertResult.insertedId.toString());

                // join room
                await socket.join(instertResult.insertedId.toString())
                console.log(player);
                resolve({
                    success: true,
                    data: {
                        player,
                        room: room as PrivateRoom
                    }

                })

            } catch (e: any) {
                console.log('INIT ROOM ERROR')
                console.log(e);
                resolve({
                    success: false,
                    data: e
                })
            }
        })))
}
