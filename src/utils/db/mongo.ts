import { Collection, Db, FindOptions, MongoClient, ServerApiVersion, WithTransactionCallback } from "mongodb"
import { Specs } from "../../types/type";
import { NormalEnglishWordDoc, NormalVietWordDoc, WordDoc, } from "../random/type";
import { ReportItem } from "../../types/report_item";
import { PrivateRoom, PublicRoom, ServerRoom } from "../../types/room";

const uri = process.env.MONGO_URI as string
const _mongoClient = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
})
await _mongoClient.connect()
console.log('MONGODB CONNECTED');


async function getLastestNews() {
    //await Mongo.connect();
    var cursor = Mongo.news().find({}).sort({ _id: -1 }).limit(1)

    var doc = await cursor.next()
    if (doc == null) throw Error('Can not find any news')

    return doc
}

async function getLastestSpecs(isPublic?: true): Promise<Specs> {
    const projection: FindOptions<Specs>['projection'] = { _id: 0 }
    if (isPublic != undefined) projection.options = 0

    var cursor = Mongo.specs.find<Document>({}, { projection }).sort({ _id: -1 }).limit(1)
    var doc = await cursor.next()
    if (doc) {
        return doc as unknown as Specs
    } else {
        throw new Error('Can not find any room settings')
    }
}

class Mongo {
    static _db: Db = _mongoClient.db('skribbl')

    //static get db() { return Mongo._db }

    // static async connect() {
    //     return new Mongo((await mongoClient.connect()).db('skribbl'));
    // }

    static news(): Collection<Document> {
        return Mongo._db.collection('news');
    }

    static get specs(): Collection<Specs> {
        return Mongo._db.collection('specs');
    }

    static get publicRooms(): Collection<PublicRoom>{
        return Mongo._db.collection('publicRooms')
    }

    static get endedPublicRooms(): Collection<PublicRoom>{
        return Mongo._db.collection('endedPublicRooms')
    }

    static get privateRooms(): Collection<PrivateRoom>{
        return Mongo._db.collection('privateRooms')
    }

    static get endedPrivateRooms() {
        return Mongo._db.collection('endedPrivateRooms')
    }

    // static get publicRooms(): Collection<PublicRoom> {
    //     return Mongo._db.collection('publicRooms')
    // }

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
        _mongoClient.close();
    }

    static async doSession<T = any>(callback: WithTransactionCallback<T>): Promise<T> {
        const session = _mongoClient.startSession()
        try {
            return await session.withTransaction(callback)
        } finally {
            await session.endSession();
        }
    }
}

await Mongo.publicRooms.createIndex({ code: 1 }, { unique: true, name: 'code_unique' })
await Mongo.publicRooms.createIndex({ is_available: 1 }, { name: 'is_available_index' })

// delete all publicRooms to ended
await Mongo.publicRooms.deleteMany({})

await Mongo.privateRooms.createIndex({ code: 1 }, { unique: true, name: 'code_unique' })
// delete all privateRooms
await Mongo.privateRooms.deleteMany({})

await Mongo.popularEnglishWords.createIndex({ word: 1 }, { unique: true, name: "word_unique" })

await Mongo.normalEnglishWords.createIndex({ word: 1 }, { unique: true, name: "word_unique" })
await Mongo.normalEnglishWords.createIndex({ types: 1 }, { name: "types_index" })

await Mongo.popularVietWords.createIndex({ word: 1 }, { unique: true, name: "word_unique" })

await Mongo.normalVietWords.createIndex({ word: 1 }, { unique: true, name: "word_unique" })
await Mongo.normalVietWords.createIndex({ types: 1 }, { name: "types_index" })

export { getLastestNews, getLastestSpecs, Mongo }