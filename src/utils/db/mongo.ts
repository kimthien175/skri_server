import { Db,  MongoClient, ServerApiVersion } from "mongodb"
const uri = "mongodb://mongo:27017/"
const mongoClient = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
})

async function db(): Promise<Db> { return (await mongoClient.connect()).db('skribbl'); }

async function getLastestNews() {
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

async function getLastestRoomSettingsWithoutClosingDb(): Promise<DBRoomSettingsDocument> {
    try {
        var cursor = (await db()).collection('settings').find<Document>({}).sort({ _id: -1 }).limit(1)
        var doc = await cursor.next()
        if (doc) {
            return doc as DBRoomSettingsDocument
        } else {
            throw new Error('Can not find any room settings')
        }
    } finally {
        await mongoClient.close()
    }
}

export { getLastestNews, getLastestRoomSettingsWithoutClosingDb , db, mongoClient}