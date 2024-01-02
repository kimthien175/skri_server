const { MongoClient, ServerApiVersion } = require("mongodb")
const uri = "mongodb://:27479ce28bd3:27017/"
const mongoClient = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
})


export async function getNews(): Promise<string>{
    try{
        await mongoClient.connect()
        return await mongoClient.db("skribbl").collection('news').find().sort({_id:-1}).limit(1)
    } finally{
        await mongoClient.close()
    }
}