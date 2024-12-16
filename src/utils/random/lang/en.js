"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var random_words_1 = require("random-words");
// export async function randomWordsByEnglish(length: number, wordMode: WordMode): Promise<Array<string>> {
//     return generate({ exactly: length }) as string[]
// }
// export async function randomNounByEnglish(): Promise<string>{
//     return generate({ exactly: 1})[0]
// }
function randomEnglishWords(quantity, wordMode) {
    console.log((0, random_words_1.generate)({ exactly: quantity }));
    return [''];
}
randomEnglishWords(1, 'Normal');
