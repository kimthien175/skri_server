import { NonEmptyArray, RoomSettings, WordMode } from "../../types/type.js";
import { randomCombinedEnglishWords, randomEnglishWords, randomPopularEnglishWords } from "./lang/en.js";
import { randomCompoundVietnameseWords, randomPopularVietnameseWords, randomVietnameseWords } from "./lang/vi.js";
import { RandomWordsCallbackSwitch } from "./type.js";

// const famousGlobalNameChance = 1
const popularWordChance = 0.15
const customWordChance = 0.5

export class Random {
    // // getWords but length is 1, lang: global
    // static async getName(langCode: string): Promise<string> {
    //     console.log('getName');
    //     console.log(langCode);
    //     var randomResult = Math.random()
    //     // chance for global famous name
    //     // if (randomResult < famousGlobalNameChance) {

    //     //     return await this.getGlobalFamousName(langCode)

    //     // } else if (randomResult < famousGlobalNameChance + famousNameByLangChance) {

    //     //     return await this.getFamousNameByLang(langCode)

    //     // }

    //     return await this.randomWordsByLang[langCode].noun()
    // }

    static async getWords(arg: Pick<RoomSettings, 'use_custom_words_only' | 'custom_words' | 'word_count' | 'language'> & { word_mode?: WordMode }): Promise<string[]> {
        if (arg.use_custom_words_only && arg.custom_words != null) {
            // pick random `word_count` from `custom_words`
            return Random._pickRandomFromArray(arg.word_count, arg.custom_words)
        }

        var result: string[] = []

        var wordGetter = Random._wordsGetterSwitch[arg.language]

        //#region ADD POPULAR WORDS WITH CHANCES
        var popularWordCount = 0

        for (var i = 0; i < arg.word_count; i++) {
            if (Math.random() < popularWordChance) {
                popularWordCount++
            }
        }

        if (popularWordCount > 0) {
            result = result.concat(await wordGetter.popular(popularWordCount))
        }
        //#endregion


        //#region ADD CUSTOM WORDS WITH CHANCES IF ARG.CUSTOM_WORDS != NULL
        if (arg.custom_words != null) {
            var customWordCount = 0
            for (var i = arg.word_count - popularWordCount; i > 0; i--) {
                if (Math.random() < customWordChance) {
                    customWordCount++
                }
            }

            // pick customWordCount from arg.custom_words
            if (customWordCount > 0) {
                result = result.concat(Random._pickRandomFromArray(customWordCount, arg.custom_words))
            }
        }
        //#endregion

        //#region ADD NORMAL WORDS IF RESULT NOT FULL
        if (result.length < arg.word_count) {
            var callback = arg.word_mode == 'Combination' ? wordGetter.combination : wordGetter.normal
            result = result.concat(await callback(arg.word_count - result.length))
        }
        //#endregion

        return result
    }

    static _pickRandomFromArray<T>(quantity: number, array: NonEmptyArray<T>): T[] {
        var item = array[Math.floor(Math.random() * array.length)]
        var result = [item]

        for (var i = 1; i < quantity; i++) {
            do {
                item = array[Math.floor(Math.random() * array.length)]
            } while (result.includes(item))

            result.push(item)
        }

        return result
    }

    // static async getGlobalFamousName(langCode: string): Promise<string> {
    //     console.log('getGlobalFamousName');
    //     return Mongo.famousNames().aggregate([
    //         { $match: { isGlobal: true } },
    //         { $sample: { size: 1 } }
    //     ])
    //         .toArray()
    //         .then(async (result) => {
    //             if (result.length > 0)
    //                 return result[0].name
    //             else return await this.randomWordsByLang[langCode].noun()
    //         })
    // }

    // static async getFamousNameByLang(langCode: string): Promise<string> {
    //     console.log('getFamousNameByLang');
    //     return Mongo.famousNames().aggregate([
    //         { $match: { lang: { $in: [langCode] } } },
    //         { $sample: { size: 1 } }
    //     ])
    //         .toArray()
    //         .then(async (result) => {
    //             if (result.length > 0)
    //                 return result[0].name
    //             else return await this.randomWordsByLang[langCode].noun()
    //         })
    // }

    static _wordsGetterSwitch: RandomWordsCallbackSwitch = {
        'en_US': {
            normal: randomEnglishWords,
            combination: randomCombinedEnglishWords,
            popular: randomPopularEnglishWords
        },
        'vi_VN': {
            normal: randomVietnameseWords,
            combination: randomCompoundVietnameseWords,
            popular: randomPopularVietnameseWords
        }
    }
}
