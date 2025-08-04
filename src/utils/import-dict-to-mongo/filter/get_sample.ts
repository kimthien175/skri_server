import { Mongo } from "../../db/mongo.js"


async function getSample() {
    await Mongo.connect()
    console.log(await Mongo.normalEnglishWords.aggregate([{ $match: { word: { $regex: "-" }, types: { $ne: [] }, isDisabled: false } }, { $sample: { size: 100 } }]).map((doc) => doc.word).toArray())
}

getSample()