import { Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { getLastestRoomSettingsWithoutClosingDb, mongoClient } from '../../../utils/db/mongo.js'
import cryptoRandomString from 'crypto-random-string'
import { InsertOneResult, OptionalId } from 'mongodb'
import { randomName } from '../../../utils/random_name.js';
import { privateRoomCollection } from '../../../utils/db/collection.js';

const codeLength = 4; // code including numberic chars or lowercase alphabet chars or both


/** insert room code without closing mongodb */
async function insertRoomCode(roomCodeLength: number, owner: Player, defaultSettings: DBRoomSettingsDocument["default"], message: MessageFromServer): Promise<string> {
    console.log(owner.name);
    var roomCode = cryptoRandomString({ length: codeLength, type: "alphanumeric" }).toLowerCase()
    return await new Promise<string>(async (resolve, reject) =>
        (await privateRoomCollection())
            .insertOne(
                {
                    players: [owner],
                    code: roomCode,
                    status: 'waiting',
                    settings: defaultSettings,
                    messages: [message]
                } as unknown as OptionalId<Document>
            ).then((value: InsertOneResult<Document>) => {
                console.log(`ROOM OWNER: ${owner.name}`);
                console.log(`DONE INSERTING ROOM CODE: ${roomCode}`)
                resolve(roomCode)
            })
            .catch(async (reason: any) => {
                if (reason.code == 11000) {
                    // do it again
                    console.log(`ROOM CODE COLLISION, TRY ADDING AGAIN: ${roomCode}`)
                    var newRoomCode = await insertRoomCode(roomCodeLength + 1, owner, defaultSettings, message)
                    resolve(newRoomCode)
                    return
                }
                console.log('insertRoomCode: INSERTING ERRROR')
                console.log(reason)
                reject(reason)
            })
    )
}

/** init room: modify owner.isOwner = true, init room then output room code*/
async function initRoomWithoutClosingDb(owner: Player, defaultSettings: DBRoomSettingsDocument["default"], message: MessageFromServer) {
    try {
        owner.isOwner = true
        var roomCode = await insertRoomCode(codeLength, owner, defaultSettings, message)
        return roomCode
    } catch (e) {
        console.log('initRoom: MONGODB ERROR')
        console.log(e)
        throw e
    }
}

export function registerInitPrivateRoom(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
    socket.on('init_private_room', async function (player: Player, callback) {
        var result: ResponseCreatedRoom = Object({})
        try {
            var success: CreatedRoom = Object({})

            success.settings = await getLastestRoomSettingsWithoutClosingDb();

            // modify playername here
            if (player.name == '') {
                player.name = randomName()
                success.ownerName = player.name
            }
            // modify player id
            player.id = socket.id
            success.player_id = player.id

            var message: HostingMessageFromServer = { type: 'hosting', player_id: player.id, timestamp: new Date() }
            success.message = message

            success.code = await initRoomWithoutClosingDb(player, success.settings.default, message)

            result.success = true
            result.data = success

            // join room
            socket.join(success.code)
        } catch (e: any) {
            console.log('INIT ROOM ERROR')
            result.success = false
            result.data = e
        } finally {
            mongoClient.close()
        }

        callback(result)
    })
}


