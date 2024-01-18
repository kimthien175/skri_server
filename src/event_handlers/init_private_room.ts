import { Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { db, getLastestRoomSettings, mongoClient } from '../mongo.js'
import cryptoRandomString from 'crypto-random-string'
import { InsertOneResult } from 'mongodb'

const codeLength = 4; // code including numberic chars or lowercase alphabet chars or both

// TODO: RANDOM NAME
function randomName(): string {
    return 'random name';
}

/** init room: modify owner.isOwner = true, init room then output room code*/
async function initRoom(owner: Player, defaultSettings: DBRoomSettingsDocument["default"]) {
    try {
        owner.isOwner = true
        var roomCode = await insertRoomCode(codeLength, owner, defaultSettings)
        return roomCode
    } catch (e) {
        console.log('initRoom: MONGODB ERROR')
        console.log(e)
        throw e
    }
    finally {
        await mongoClient.close()
    }
}

/** insert room code without closing mongodb */
async function insertRoomCode(roomCodeLength: number, owner: Player, defaultSettings: DBRoomSettingsDocument["default"]): Promise<string> {
    console.log(owner.name);
    var roomCode = cryptoRandomString({ length: codeLength, type: "alphanumeric" }).toLowerCase()
    return await new Promise<string>(async (resolve, reject) =>
        (await db()).collection('privateRooms')
            .insertOne({
                players: [owner],
                code: roomCode,
                status: 'waiting',
                settings: defaultSettings
            }).then((value: InsertOneResult<Document>) => {
                console.log(`ROOM OWNER: ${owner.name}`);
                console.log(`DONE INSERTING ROOM CODE: ${roomCode}`)
                resolve(roomCode)
            })
            .catch(async (reason: any) => {
                if (reason.code == 11000) {
                    // redo
                    console.log(`ROOM CODE COLLISION, TRY ADDING AGAIN: ${roomCode}`)
                    var newRoomCode = await insertRoomCode(roomCodeLength + 1, owner, defaultSettings)
                    resolve(newRoomCode)
                    return
                }
                console.log('insertRoomCode: INSERTING ERRROR')
                console.log(reason)
                reject(reason)
            })
    )
}

export function registerInitPrivateRoom(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
    socket.on('init_private_room', async function (player: Player, callback) {
        var result: ResponseCreatedRoomData = Object({})
        try {
            var success: SucceededCreatedRoomData = Object({})

            success.settings = await getLastestRoomSettings();

            // init ownerName if empty
            if (player.name == '') {
                player.name = randomName()
                success.ownerName = player.name

                // ownerName stays in result
                // init room in db
                success.code = await initRoom(player, success.settings.default)
            } else {
                // ownerName in roomOwnerName parameter
                // init room in db
                success.code = await initRoom(player, success.settings.default)
            }

            result.success = true
            result.data = success

            // join room
            socket.join(success.code)
        } catch (e: any) {
            console.log('INIT ROOM ERROR')
            result.success = false
            result.data = e
        }

        callback(result)
    })
}


