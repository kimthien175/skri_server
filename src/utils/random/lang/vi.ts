import { Mongo } from "../../db/mongo.js"


export async function randomVietnameseWords(quantity: number, wordMode: WordMode): Promise<Array<string>> {
    return Mongo.db.collection('vi_VN').aggregate([
        { $sample: { size: quantity } }
    ]).toArray().then((result) => result.map((e) => e.word as string))
}
