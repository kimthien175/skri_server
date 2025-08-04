import { Document } from "mongodb"
import { WordMode } from "../../types/type"

type RandomWordsCallbackSwitch = {
    [key: string]: {
        normal: RandomWordsCallback,
        combination: RandomWordsCallback
        popular: RandomWordsCallback
    }
}

type RandomNoun = () => Promise<string>
type RandomWordsCallback = (quantity: number) => Promise<Array<string>>

type WordDoc = {
    word: string
    isDisabled: boolean
}

type NormalEnglishWordMeaning = {
    type: EnglishWordType,
    meaning: string,
    synonyms: string[],
    examples: string[]
}

type WordTheme = "animal" | "food" | "color" | "shape" | "object" | "action" | "place" | "cloth" | "tool" | "nature" | "fantasy" | "emotion" | string

type EnglishWordType = 'noun' | 'adjective' | 'adverb' | 'verb' | 'compound' | 'pronoun' | 'preposition'

interface NormalEnglishWordDoc extends WordDoc {
    types: EnglishWordType[]
    meanings: NormalEnglishWordMeaning[]
    antonyms: string[]
    synonyms: string[]
    themes: WordTheme[]
}

type NormalVietWordMeaning = Pick<NormalEnglishWordMeaning, | 'meaning' | 'examples'> & { type: VietWordType }

interface NormalVietWordDoc extends WordDoc {
    types: VietWordType[]
    meanings: NormalVietWordMeaning[]
}

type VietWordType = 'D' | 'E' | 'N' | 'M' | 'P' | 'Z' | 'C' | 'I' | 'V' | 'R' | 'X' | 'A' | 'S' | 'O'