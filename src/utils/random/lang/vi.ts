import { Mongo } from "../../db/mongo.js"


export async function randomVietnameseWords(quantity: number): Promise<string[]> {
    return Mongo.normalVietWords.aggregate([
        {
            $match: {
                word: { $regex: "^(?!.*[A-Z]{2})[^\\s-]{3,}$"}, // do not have 2 upper case letters standing next to each other, do not have spaces or any '-', word length must be at least 3
                isDisabled: false
            }
        },
        { $sample: { size: quantity } }
    ]).map((doc) => doc.word).toArray()
}

export async function randomPopularVietnameseWords(quantity: number): Promise<string[]> {
    return Mongo.popularVietWords.aggregate([
        {$match: {isDisabled: false}},
        { $sample: { size: quantity } }
    ]).map((doc) => doc.word).toArray()
}

export async function randomCompoundVietnameseWords(quantity: number): Promise<string[]> {
    return Mongo.normalVietWords.aggregate([
        {
            $match: {
                word: {
                    // contains from 1 to 2 spaces, at least 3 letters total, no uppercase letters stand next to each other, no '-' in it
                    $regex: "^(?=(?:[^ ]* ){1,2}[^ ]*$)(?!.*[A-Z]{2})(?!.*-).{3,}$" 
                    //"^(?!.*[A-Z]{2})[^-]{3,}$"
                },
                isDisabled: false
            }
        },
        {
            $sample: {size: quantity}
        }
    ]).map((doc)=>doc.word).toArray()
}