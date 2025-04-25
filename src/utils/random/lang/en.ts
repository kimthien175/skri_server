import { generate } from 'random-words'
import { WordMode } from '../../../types/type';

// export async function randomWordsByEnglish(length: number, wordMode: WordMode): Promise<Array<string>> {
//     return generate({ exactly: length }) as string[]
// }

// export async function randomNounByEnglish(): Promise<string>{
//     return generate({ exactly: 1})[0]
// }

export async function randomEnglishWords(quantity: number): Promise<Array<string>> {
    return generate({ exactly: quantity }) as string[];
}

