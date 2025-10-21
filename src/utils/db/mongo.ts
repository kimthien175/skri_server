import { Collection, Db, FindOptions, MongoClient, ServerApiVersion, WithTransactionCallback } from "mongodb"
import { Specs } from "../../types/type";
import { PublicRoom } from "../../types/room";
import { NormalEnglishWordDoc, NormalVietWordDoc, WordDoc, } from "../random/type";
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
    await Mongo.connect();
    var cursor = Mongo.news().find({}).sort({ _id: -1 }).limit(1)

    var doc = await cursor.next()
    if (doc == null) throw Error('Can not find any news')

    return doc
}

async function getLastestSpecs(isPublic?: true): Promise<Specs> {
    const projection:FindOptions<Specs>['projection'] = { _id: 0 }
    if (isPublic != undefined) projection.options = 0

    var cursor = Mongo.specs.find<Document>({}, { projection  }).sort({ _id: -1 }).limit(1)
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

    // static get privateRooms(): Collection<PrivateRoom> {
    //     return Mongo._db.collection('privateRooms')
    // }

    // static get endedPrivateRooms() {
    //     return Mongo._db.collection('endedPrivateRooms')
    // }

    // static get publicRooms(): Collection<PublicRoom> {
    //     return Mongo._db.collection('publicRooms')
    // }

    static get publicLobby(): Collection<PublicRoom> {
        return Mongo._db.collection('publicLobby');
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

    static async doSession<T=any>(callback: WithTransactionCallback<T>): Promise<T>{
        const session = mongoClient.startSession()
        try {
            return await session.withTransaction(callback)
        } finally {
            await session.endSession();
        }
    }
}



export { getLastestNews, getLastestSpecs, Mongo }