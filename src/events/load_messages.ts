import { ObjectId } from "mongodb";
import { SocketPackage } from "../types/socket_package";
import { ServerRoom } from "../types/room";

export const messagesPageQuantity = 30;

export async function registerLoadingMessages(socketPkg: SocketPackage) {
    socketPkg.socket.on('load_messages', async function (id: string, callback) {
        try {
            const msgId = new ObjectId(id)

            const pipeline = [
                {
                    $match: {
                        _id: new ObjectId(socketPkg.roomId),
                        [`players.${socketPkg.playerId}`]: { $exists: true },
                        "messages.id": msgId
                    }
                },
                {
                    $project: {
                        idx: { $indexOfArray: ["$messages.id", msgId] },
                        messages: 1
                    }
                },
                {
                    $project: {
                        messages: {
                            $slice: [
                                "$messages",
                                { $cond: [{ $lte: ["$idx", messagesPageQuantity] }, 0, { $subtract: ["$idx", messagesPageQuantity] }] },
                                messagesPageQuantity
                            ]
                        }
                    }
                }
            ];

            var docs: ServerRoom[] = await socketPkg.room.aggregate(pipeline).toArray() as ServerRoom[]
            if (docs.length == 0) throw Error('room not found')

            callback(docs[0].messages)
        } catch (e) {
            console.log(`[LOAD MESSAGES]: ${e}`);

            callback([])
        }
    })
}