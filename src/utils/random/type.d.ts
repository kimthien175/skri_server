import { WordMode } from "../../types/type"

type RandomWordsCallbackSwitch = {
    [key: string]: RandomWordsCallback
}

type RandomNoun = ()=>Promise<string>
type RandomWordsCallback = (quantity: number)=>Promise<Array<string>>