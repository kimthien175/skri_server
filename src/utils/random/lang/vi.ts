import { Mongo } from "../../db/mongo.js"


export async function randomWordsByVietnamese(length: number, wordMode: WordMode): Promise<Array<string>> {
    return Mongo.vietnameseWords().aggregate([
        { $sample: { size: length } }
    ]).toArray().then((result) => result.map((e) => e.word as string))
}

export async function randomNounByVietnamese(): Promise<string> {
    return Mongo.vietnameseWords().aggregate([
        { $match: { meta: { $elemMatch: { pos: 'N' } } } },
        { $sample: { size: 1 } }
    ]).toArray().then((result) => result[0].word)
}