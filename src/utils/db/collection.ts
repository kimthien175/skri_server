import { mongoClient } from "./mongo.js";

export async function privateRoomCollection(){
    return (await mongoClient.connect()).db('skribbl').collection('privateRooms')
}