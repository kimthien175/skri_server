type RandomWordsByLang = {
    [key: string]: { noun: RandomNoun, word: RandomWords }
}

type RandomNoun = ()=>Promise<string>
type RandomWords = (length: number, mode: WordMode)=>Promise<Array<string>>
type WordMode = 'Normal' | 'Combination'