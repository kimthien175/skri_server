const { MongoClient, ServerApiVersion } = require("mongodb")
const uri = "mongodb://mongo:27017/"
const mongoClient = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
})


export async function getNews(): Promise<JSON>{
    var result = Object({})
    try{
        await mongoClient.connect()
        var cursor =  mongoClient.db("skribbl").collection('news').find({}).sort({ _id: -1 }).limit(1)
        var doc = await cursor.next()
        if (doc){
            return doc.base64
        } else {
            throw new Error('Can not find document')
        }
    } catch (e){
        console.log('ERROR');
        console.log(e);
    }
    await mongoClient.close()
    return result
}