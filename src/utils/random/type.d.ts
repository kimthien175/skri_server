type RandomWordsCallbackSwitch = {
    [key: string]: RandomWordsCallback
}

type RandomNoun = ()=>Promise<string>
type RandomWordsCallback = (quantity: number, mode: WordMode)=>Promise<Array<string>>
type WordMode = 'Normal' | 'Combination'