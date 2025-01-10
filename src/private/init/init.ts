import cryptoRandomString from 'crypto-random-string'
import { SocketPackage } from '../../types/socket_package.js';

import { Mongo, getLastestSpecs } from '../../utils/db/mongo.js';
import { Random } from '../../utils/random/random.js';
import { RoomRequestPackage, RoomResponse } from '../../types/type.js';
import {PrivateRoom } from '../../types/room.js';
import { NewHostMessage } from '../../types/message.js';
import { PrivatePreGameState } from '../state/state.js';


const codeLength = 4; // code including numeric chars or lowercase alphabet chars or both


/** insert room code without closing mongodb */
async function insertRoomCode(roomCodeLength: number, room: Omit<PrivateRoom, 'code'>&{code?:string}): Promise<string> {
    const code = cryptoRandomString({ length: roomCodeLength, type: "alphanumeric" }).toLowerCase();

    room.code = code

    return Mongo.privateRooms
        .insertOne(room as PrivateRoom)
        .then((_) => code)
        .catch(async (reason: any) => {
            if (reason.code == 11000) {
                // do it again
                console.log(`ROOM CODE COLLISION, TRY ADDING AGAIN: ${room.code}`)

                return insertRoomCode(roomCodeLength + 1, room)
            }
            console.log('insertRoomCode: INSERTING ERROR', reason)

            throw reason
        })
}

export function registerInitPrivateRoom(socketPackage: SocketPackage) {
    socketPackage.socket.on('init_private_room', async (requestPkg: RoomRequestPackage, callback) =>
        callback(await new Promise<RoomResponse<PrivateRoom>>(async function (resolve) {
            const socket = socketPackage.socket;
            await Mongo.connect();
            try {
                const player = requestPkg.player;
                //#region PLAYER
                player.id = socket.id
                player.ip = socket.handshake.address;
                if (player.name === '') {
                    player.name = (await Random.getWords(1, requestPkg.lang, 'Normal'))[0];
                }
                //#endregion

                const room: Omit<PrivateRoom, 'code'> & { code?: string } = {
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
                room.code = await insertRoomCode(codeLength, room)

                // modify socket package
                socketPackage.roomCode = room.code
                socketPackage.name = player.name
                socketPackage.isOwner = true

                // join room
                await socket.join(socketPackage.roomCode)
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
