type RandomWordsByLang = {
    [key: string]: { noun: RandomNoun, word: RandomWords }
}

type RandomNoun = ()=>Promise<string>
type RandomWords = (length: number)=>Promise<Array<string>>