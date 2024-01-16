import cryptoRandomString from 'crypto-random-string'
import { MongoClient, ServerApiVersion } from "mongodb"
const uri = "mongodb://mongo:27017/"
const mongoClient = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
})

async function db() {
    return (await mongoClient.connect()).db('skribbl');
}

export async function getLastestNews() {
    try {
        var cursor = (await db()).collection('news').find({}).sort({ _id: -1 }).limit(1)
        var doc = await cursor.next()
        if (doc) {
            return doc
        } else {
            throw new Error('Can not find any news')
        }
    } finally {
        await mongoClient.close()
    }
}

export async function getLastestRoomSettings() {
    try {
        var cursor = (await db()).collection('settings').find({}).sort({ _id: -1 }).limit(1)
        var doc = await cursor.next()
        if (doc) {
            return doc
        } else {
            throw new Error('Can not find any room settings')
        }
    } finally {
        await mongoClient.close()
    }
}

const codeLength = 4; // code including numberic chars or lowercase alphabet chars or both

export async function initRoom(ownerName: String) {
    try {
        var result = (await db()).collection('privateRooms')
            .insertOne({
                ownerName,
                code: cryptoRandomString({ length: codeLength, type: 'alphanumeric' }).toLowerCase()
            })

    } finally {
        await mongoClient.close()
    }
}