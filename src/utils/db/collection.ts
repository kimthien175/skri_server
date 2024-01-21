import { Collection } from "mongodb";
import { mongoClient } from "./mongo.js";

export async function privateRoomCollection(): Promise<Collection<Document>>{
    return (await mongoClient.connect()).db('skribbl').collection('privateRooms')
}

export async function publicRoomCollection(): Promise<Collection<Document>> {
    return (await mongoClient.connect()).db('skribbl').collection('publicRooms')
}

export async function endedPrivateRoomCollection(): Promise<Collection<Document>>{
    return (await mongoClient.connect()).db('skribbl').collection('endedPrivateRooms')
}