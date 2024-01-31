import { Collection } from "mongodb";

export async function storeMessage(collection: Collection<Document>,roomCode: string, message: Message) {
    return collection.updateOne({ code: roomCode }, { $push: { messages: message } })
}