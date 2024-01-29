import { famousNamesCollection } from "../db/collection.js";
import { mongoClient } from "../db/mongo.js";
import { randomWordsByEnglish , randomNounByEnglish} from "./lang/en.js";
import { randomNounByVietnamese, randomWordsByVietnamese } from "./lang/vi.js";

const famousGlobalNameChance = 0.5
const famousNameByLangChance = 0.3

export class Random {
    // getWords but length is 1, lang: global
    static async getName(langCode: string): Promise<string> {
        console.log(langCode);
        var randomResult = Math.random()
        // chance for global famous name
        if (randomResult < famousGlobalNameChance) {

            return await this.getGlobalFamousName(langCode)

        } else if (randomResult < famousGlobalNameChance + famousNameByLangChance) {

            return await this.getFamousNameByLang(langCode)

        }

        return await this.randomWordsByLang[langCode].noun()
    }

    static async getWords(length: number, langCode: string): Promise<Array<string>> {
        var randomResult = Math.random()
        // chance for global famous name
        if (randomResult < famousGlobalNameChance) {
            var result: Array<string> = []
            result.push(await this.getGlobalFamousName(langCode))
            result.concat(await this.randomWordsByLang[langCode].word(length - 1))
            return result
        } else if (randomResult < famousGlobalNameChance + famousNameByLangChance) {
            var result: Array<string> = []
            result.push(await this.getFamousNameByLang(langCode))
            result.concat(await this.randomWordsByLang[langCode].word(length - 1))
            return result
        }

        return this.randomWordsByLang[langCode].word(length)
    }

    static async getGlobalFamousName(langCode: string): Promise<string> {
        return (await famousNamesCollection()).aggregate([
            { $match: { isGlobal: true } },
            { $sample: { size: 1 } }
        ]).toArray().then(async (result) => {
            if (result.length > 0)
                return result[0].name
            else return await this.randomWordsByLang[langCode].noun()
        }
        ).finally(() => mongoClient.close())
    }

    static async getFamousNameByLang(langCode: string): Promise<string> {
        return (await famousNamesCollection()).aggregate([
            { $match: { lang: { $in: [langCode] } } },
            { $sample: { size: 1 } }
        ])
            .toArray().then(async (result) => {
                if (result.length > 0)
                    return result[0].name
                else return await this.randomWordsByLang[langCode].noun()
            }).finally(() => mongoClient.close())
    }

    // have to be the same between server and client
    static randomWordsByLang: RandomWordsByLang = {
        'en': {
            noun: randomNounByEnglish,
            word: randomWordsByEnglish
         },
         'vi':{
            noun: randomNounByVietnamese,
            word: randomWordsByVietnamese
         }
    }
}