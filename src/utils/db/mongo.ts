import { Collection, Db, MongoClient, OptionalId, ServerApiVersion, WithId } from "mongodb"
import { Specs } from "../../types/type";
import { PrivateRoom, PublicRoom } from "../../types/room";
import { NormalEnglishWordDoc,  NormalVietWordDoc,  WordDoc, } from "../random/type";
import { ReportItem } from "../../types/report_item";
const uri = process.env.MONGO_URI as string
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
    } catch (e) {
        console.log(`getLastestNews: ${e}`);
    }
}

async function getLastestSpecs(): Promise<Specs> {
    var cursor = Mongo.specs.find<Document>({}, { projection: { _id: 0 } }).sort({ _id: -1 }).limit(1)
    var doc = await cursor.next()
    if (doc) {
        return doc as unknown as Specs
    } else {
        throw new Error('Can not find any room settings')
    }
}

class Mongo {
    private constructor(db: Db) {
        Mongo._db = db;
    }
    static _db: Db;

    static get db() { return Mongo._db }

    static async connect() {
        return new Mongo((await mongoClient.connect()).db('skribbl'));
    }

    static news(): Collection<Document> {
        return Mongo._db.collection('news');
    }

    static get specs(): Collection<Specs> {
        return Mongo._db.collection('specs');
    }

    static get privateRooms(): Collection<PrivateRoom> {
        return Mongo._db.collection('privateRooms')
    }

    static get endedPrivateRooms() {
        return Mongo._db.collection('endedPrivateRooms')
    }

    static get publicRooms(): Collection<PublicRoom> {
        return Mongo._db.collection('publicRooms')
    }

    static famousNames() {
        return Mongo._db.collection('famousNames')
    }

    static get reportedPlayers(): Collection<ReportItem> {
        return Mongo._db.collection('reportedPlayers')
    }

    static get popularEnglishWords(): Collection<WordDoc> { return Mongo._db.collection('popularEnglishWords') }
    static get normalEnglishWords(): Collection<NormalEnglishWordDoc> { return Mongo._db.collection('normalEnglishWords') }

    static get popularVietWords(): Collection<WordDoc> { return Mongo._db.collection('popularVietnameseWords') }
    static get normalVietWords(): Collection<NormalVietWordDoc> { return Mongo._db.collection('normalVietWords') }

    static close() {
        mongoClient.close();
    }
}



export { getLastestNews, getLastestSpecs, Mongo }