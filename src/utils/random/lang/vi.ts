import { db, mongoClient } from "../../db/mongo.js"

export async function randomWordsByVietnamese(length: number): Promise<Array<string>> {
    return (await db()).collection('vietnameseWords').aggregate([
        { $sample: { size: length } }
    ]).toArray().then((result) => result.map((e) => e.word as string)).finally(() => mongoClient.close())
}

export async function randomNounByVietnamese(): Promise<string> {
    return (await db()).collection('vietnameseWords').aggregate([
        { $match: { meta: { $elemMatch: { pos: 'N' } } } },
        { $sample: { size: 1 } }
    ]).toArray().then((result) => {
        console.log(result);
        return result[0].word
    }).finally(() => mongoClient.close())
}