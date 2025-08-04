import * as cheerio from 'cheerio'
import { readFile, readFileSync } from 'fs'
import { Mongo } from '../db/mongo.js'
import { NormalEnglishWordDoc } from '../random/type.js'
import { AnyBulkWriteOperation } from 'mongodb'


async function add() {
    const html = readFileSync('./compound.html', 'utf8')
    const $ = cheerio.load(html)

    await Mongo.connect()

    //var words: NormalEnglishWordDoc[] = []
    const bulkOps: AnyBulkWriteOperation<NormalEnglishWordDoc>[] = []

    $('.wordlist-section').each((_, section) => {
        const category = $(section).find(".wordlist-section__title").first().text().trim()
        console.log(category + '\n');
        $(section).find(".wordlist-item").each((_, item) => {
            const word = $(item).text().trim()
            var doc: NormalEnglishWordDoc = {
                word,
                types: ['compound'],
                themes: [category],
                isDisabled: false,
                meanings: [],
                antonyms: [],
                synonyms: []
            }

            bulkOps.push({
                updateOne: {
                    filter: { word },
                    update: {
                        $addToSet: {
                            types: 'compound',
                            themes: category
                        },
                        $setOnInsert: {
                            isDisabled: false,
                            meanings: [],
                            antonyms:[],
                            synonyms:[]
                        }
                    },
                    upsert: true
                }
            })

        })


    })

    console.log(await Mongo.normalEnglishWords.bulkWrite(bulkOps))
    // await Mongo.normalEnglishWords.insertMany(words)
}

add()