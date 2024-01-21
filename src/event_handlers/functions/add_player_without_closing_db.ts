import { Socket } from "socket.io"
import { DefaultEventsMap } from "socket.io/dist/typed-events"
import { randomName } from "../../utils/random_name.js"
import { Collection, PushOperator } from "mongodb"

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
export async function addPlayerToExistingRoomWithoutClosingDb(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
    collection: Collection<Document>,
    roomCode: string,
    player: Player,): Promise<RoomWithNewPlayer> {

    player.id = socket.id

    if (player.name == '') {
        player.name = randomName()
    }

    var message = {
        type: 'player_joined',
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
    console.log(`Add player ${socket.id} and message to db`);

    if (foundRoom == null) {
        throw new Error(`Can not find room with code ${roomCode}`)
    }

    await socket.join(roomCode)
    console.log(`Add player ${socket.id} to room ${roomCode}`);

    socket.to(roomCode).emit("player_joined", {
        player,
        message
    });

    return { player: player, room: foundRoom as unknown as Room }
}