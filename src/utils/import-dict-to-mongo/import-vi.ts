import { readFileSync } from "fs";
import { NormalEnglishWordMeaning, NormalVietWordDoc, NormalVietWordMeaning, VietWordType } from "../random/type";
import { Mongo } from "../db/mongo";


// source from https://github.com/vntk/dictionary
async function add() {

    const raw = readFileSync('./vi.json', 'utf8')

    const parsed = JSON.parse(raw)
    let docs: NormalVietWordDoc[] = []

    for (let word in parsed) {
        let array = parsed[word] as { example: string, sub_pos: string, definition: string, pos: string }[]
        var meanings: NormalVietWordMeaning[] = []
        var types: VietWordType[] = []

        array.forEach((value) => {
            var type: VietWordType = value.pos as VietWordType

            let example = value.example.trim()

            meanings.push({
                type,
                meaning: value.definition,
                examples: (example.length == 0) ? [] : [example]
            })

            if (!types.includes(type))
                types.push(type)
        })

        docs.push({
            word,
            isDisabled: false,
            types,
            meanings
        })


    }
    //await Mongo.connect()
    await Mongo.normalVietWords.insertMany(docs)
    console.log('done');
}

add()