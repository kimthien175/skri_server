import { randomName } from "./random_name.js"
import { Collection, PushOperator } from "mongodb"
import { SocketPackage } from "../types/socket_package.js"

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
    player: Player,): Promise<RoomWithNewPlayer> {

    var socket = socketPackage.socket
    player.id = socket.id

    if (player.name == '') {
        player.name = randomName()
    }

    var message: PlayerJoinMessageFromServer = {
        type: 'player_join',
        player_id: socket.id,
        timestamp: new Date()
    }

    var update: PushOperator<Player> = {
        $push: {
            players: player,
            messages: message
        },
    };

    var foundRoom = await collection.findOneAndUpdate(
        { code: roomCode },
        update,
        { returnDocument: 'after' }
    );

    if (foundRoom == null) {
        throw new Error(`addPlayerToExistingRoomWithoutClosingDb: Can not find room with code ${roomCode}`)
    }

    console.log(`addPlayerToExistingRoomWithoutClosingDb: Add player ${socket.id} and message to db`);

    await socket.join(roomCode)
    socketPackage.roomCode = roomCode

    console.log(`addPlayerToExistingRoomWithoutClosingDb: Add player ${socket.id} to room ${roomCode}`);

    socket.to(roomCode).emit("player_join", {
        player,
        message
    });

    return { player: player, room: foundRoom as unknown as Room }
}