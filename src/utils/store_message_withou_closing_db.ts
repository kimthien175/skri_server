import { Collection } from "mongodb";

export async function storeMessageWithoutClosingDb(collection: Collection<Document>,roomCode: string, message: Message) {
    return collection.updateOne({ code: roomCode }, { $push: { messages: message } })
}