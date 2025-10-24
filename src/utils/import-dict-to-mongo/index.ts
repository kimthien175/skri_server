import { promises } from "fs";
import {  EnglishWordType, NormalEnglishWordDoc, NormalEnglishWordMeaning } from "../random/type";
import { Mongo } from "../db/mongo";


// source from https://github.com/nightblade9/simple-english-dictionary
const folderPath = `./data`


async function importFile(filePath: string) {
    const data = await promises.readFile(filePath,'utf8')
    const json:{[key:string]:{
        MEANINGS:{
            [numKey:string]:[string, string, string[], string[]]
        },
        ANTONYMS: string[],
        SYNONYMS: string[]
    }} = JSON.parse(data)
    var result: NormalEnglishWordDoc[] = []

    for (const [wordContent, wordData] of Object.entries(json)){
        var types:EnglishWordType[] = []
        var meanings: NormalEnglishWordMeaning[] = []

        // loop through each meaning
        for (var meaningData of Object.values(wordData.MEANINGS)){
            var type: EnglishWordType = meaningData[0].toLowerCase() as EnglishWordType
            if (!types.includes(type)){
                types.push(type)
            }
            
            meanings.push({
                type,
                meaning: meaningData[1],
                synonyms: meaningData[2],
                examples: meaningData[3]
            })
        }

        result.push({
            word: wordContent.toLowerCase(),
            types,
            meanings,
            antonyms:wordData.ANTONYMS ,
            synonyms: wordData.SYNONYMS,
            isDisabled: false,
            themes: []
        })
    }

    await Mongo.normalEnglishWords.insertMany(result)
}

async function main() {

    //await Mongo.connect()

    var alphabet: string

    for (var i = 0; i < 26; i++) {
        alphabet = String.fromCharCode(i + 97)

        await importFile(`${folderPath}/${alphabet}.json`)
    }


    Mongo.close()
}

main()
