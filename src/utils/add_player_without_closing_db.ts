import { randomName } from "./random_name.js"
import { Collection, FindOptions, PushOperator, WithId } from "mongodb"
import { SocketPackage } from "../types/socket_package.js"
import { db } from "./db/mongo.js"

/**
 * Edit player id to socket id
 * 
 * Edit player name if empty
 * 
 * Add player and new message to db
 * 
 * Emit to other room members 
 * 
 * @returns lastest room data
 */
export async function addPlayerToExistingRoomWithoutClosingDb(socketPackage: SocketPackage,
    collection: Collection<Document>,
    roomCode: string,
    player: Player,): Promise<RoomAndNewPlayer> {

    var socket = socketPackage.socket
    player.id = socket.id

    if (player.name == '') {
        player.name = randomName()
    }

    var message: PlayerJoinMessage = {
        type: 'player_join',
        player_id: socket.id,
        player_name: player.name,
        timestamp: new Date()
    }

    var update: PushOperator<Player> = {
        $push: {
            players: player,
            messages: message
        },
    };

    var foundRoom: WithId<Room> | null = await collection.findOneAndUpdate(
        { code: roomCode },
        update,
        { returnDocument: 'after' }
    ) as WithId<Room> | null

    if (foundRoom == null) {
        throw new Error(`addPlayerToExistingRoomWithoutClosingDb: Can not find room with code ${roomCode}`)
    }

    var optionsDoc = await (await db()).collection('settings').find<Document>({}, { options: 1 } as FindOptions<any>).sort({ _id: -1 }).limit(1).next() as any as {options:RoomOptions} | null

    if (optionsDoc == null){
        throw new Error('addPlayerToExitingRoomWithoutClosingDb: options is empty')
    }

    (foundRoom as any as RoomWithOptions).options = optionsDoc.options

    console.log(`addPlayerToExistingRoomWithoutClosingDb: Add player ${socket.id} and message to db`);

    await socket.join(roomCode)
    socketPackage.roomCode = roomCode
    socketPackage.name = player.name

    console.log(`addPlayerToExistingRoomWithoutClosingDb: Add player ${socket.id} to room ${roomCode}`);

    socket.to(roomCode).emit("player_join", {
        player,
        message
    });

    return { player: player, room: foundRoom as any as WithId<RoomWithOptions>}
}