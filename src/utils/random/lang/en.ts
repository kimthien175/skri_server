import { Mongo } from '../../db/mongo.js';
import { createRequire } from 'module';
import { NormalEnglishWordDoc } from '../type.js';
const require = createRequire(import.meta.url)

// export async function randomWordsByEnglish(length: number, wordMode: WordMode): Promise<Array<string>> {
//     return generate({ exactly: length }) as string[]
// }

// export async function randomNounByEnglish(): Promise<string>{
//     return generate({ exactly: 1})[0]
// }

export async function randomEnglishWords(quantity: number): Promise<string[]> {
    return Mongo.normalEnglishWords.aggregate([
        {
            $match: {
                types: { $nin: ['compound'], $ne: [] },
                synonyms: { $ne: [] },
                isDisabled: false
            }
        },
        {
            $sample: { size: quantity }
        }
    ])
        .map((doc) => doc.word)
        .toArray()
}

export async function randomPopularEnglishWords(quantity: number): Promise<string[]> {
    return Mongo.popularEnglishWords.aggregate([
        {
            $match: {
                isDisabled: false
            }
        },
        {
            $sample: { size: quantity }
        }
    ])
        .map((doc) => doc.word).toArray()
}

// async function generateCombinationWord(structure: _WordVariation[]): Promise<string> {
//     var combinationResult: string = ''
//     for (const variation of structure) {
//         // get random word

//         var word = (await Mongo.normalEnglishWords.aggregate<NormalEnglishWordDoc>([
//             {
//                 $match: {
//                     types: variation.type,
//                     isDisabled: false
//                 }
//             },
//             {
//                 $sample: { size: 1 }
//             }
//         ]).toArray())[0].word

//         var fix = variation.fix;
//         if (fix != undefined) {
//             combinationResult += fix(word) + ' '
//         } else {
//             combinationResult += word + ' '
//         }
//     }

//     return combinationResult.trimEnd()
// }

export async function randomCombinedEnglishWords(quantity: number): Promise<string[]> {
    return Mongo.normalEnglishWords.aggregate([
        {
            $match: {
                types: 'compound',
                isDisabled: false
            }
        },
        {
            $sample: { size: quantity }
        }
    ])
        .map((doc) => doc.word).toArray()
}
