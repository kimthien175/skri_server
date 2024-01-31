import { generate } from 'random-words'

export async function randomWordsByEnglish(length: number, wordMode: WordMode): Promise<Array<string>> {
    return generate({ exactly: length }) as string[]
}

export async function randomNounByEnglish(): Promise<string>{
    return generate({ exactly: 1})[0]
}