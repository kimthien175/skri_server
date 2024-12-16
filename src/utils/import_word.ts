// import { Mongo } from "./db/mongo";
// import * as fs from 'fs'
// import * as rd from 'readline'

// async function importWords() {
//     var reader = rd.createInterface(fs.createReadStream("/home/tom/Downloads/vn_words/Viet39K.txt"))

//     var data: Array<{ word: String }> = []
//     var logResult: string=''


//     reader.on("line",  (line: String) => {
//        data.push({ word: line.trim() })
//     })



//     reader.on('close', async () => {
//         console.log('done txt')

//         console.log(`${data.length} words`);

//         await Mongo.connect()
//         await Mongo.vietnameseWords().insertMany(data)

//         console.log('done mongo');
//     })
// }

// importWords();

