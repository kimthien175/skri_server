import { Collection } from "mongodb";
import { mongoClient } from "./mongo.js";

export async function privateRoomCollection(){
    return (await mongoClient.connect()).db('skribbl').collection('privateRooms')
}

export async function endedPrivateRoomCollection(): Promise<Collection<Document>>{
    return (await mongoClient.connect()).db('skribbl').collection('endedPrivateRooms')
}