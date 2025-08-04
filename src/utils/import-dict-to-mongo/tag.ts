import { MongoClient } from "mongodb";
import { Mongo } from "../db/mongo.js";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);


async function tag() {
    // seperated Mongo client
    // const mongoClient = new MongoClient("mongodb://localhost:27018/")

    // var collection = (await mongoClient.connect()).db('skribbl').collection('normalEnglishWords')

    // console.log(await collection.aggregate([{$match: {isDisabled: false}}, {$sample: {size: 10}}]).toArray());

    // Imports the Google Cloud client library

    // Instantiates a client

    var WordPOS = require('wordpos')
    const wordpos = new WordPOS()

    wordpos.lookup('dog',console.log)
}

tag().then((_) => process.exit(0))