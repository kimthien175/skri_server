import { Collection, Db, MongoClient, ServerApiVersion } from "mongodb"
const uri = "mongodb://localhost:27018/"
const mongoClient = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
})

async function getLastestNews() {
    try {
        await Mongo.connect();
        var cursor = Mongo.news().find({}).sort({ _id: -1 }).limit(1)
        var doc = await cursor.next()
        if (doc) {
            return doc
        } else {
            throw new Error('Can not find any news')
        }
    } catch (e){
        console.log(`getLastestNews: ${e}`);
    }
}

async function getLastestRoomSettings(): Promise<DBRoomSettingsDocument> {
    var cursor = await Mongo.settings().find<Document>({}).sort({ _id: -1 }).limit(1)
    var doc = await cursor.next()
    if (doc) {
        return doc as DBRoomSettingsDocument
    } else {
        throw new Error('Can not find any room settings')
    }
}

class Mongo {
    private constructor(db: Db) {
        Mongo._db = db;
    }
    static _db: Db;

    static get db() {return Mongo._db}

    static async connect() {
        return new Mongo((await mongoClient.connect()).db('skribbl'));
    }

    static news(): Collection<Document> {
        return Mongo._db.collection('news');
    }

    static settings(): Collection<Document> {
        return Mongo._db.collection('settings');
    }

    static privateRooms():Collection<Document> {
        return Mongo._db.collection('privateRooms');
    }

    static endedPrivateRooms(){
        return Mongo._db.collection('endedPrivateRooms')
    }

    static publicRooms(): Collection<Document>{
        return Mongo._db.collection('publicRooms')
    }

    static famousNames(){
        return Mongo._db.collection('famousNames')
    }

    static close() {
        mongoClient.close();
    }
}

export { getLastestNews, getLastestRoomSettings, Mongo }