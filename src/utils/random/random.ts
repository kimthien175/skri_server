
import { Mongo } from "../db/mongo.js";
import { randomWordsByEnglish, randomNounByEnglish } from "./lang/en.js";
import { randomNounByVietnamese, randomWordsByVietnamese } from "./lang/vi.js";

const famousGlobalNameChance = 1
const famousNameByLangChance = 0.3

export class Random {
    // getWords but length is 1, lang: global
    static async getName(langCode: string): Promise<string> {
        console.log('getName');
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

    static async getWords(length: number, langCode: string, wordMode: WordMode): Promise<Array<string>> {
        var randomResult = Math.random()
        // chance for global famous name
        if (randomResult < famousGlobalNameChance) {
            var result = [await this.getGlobalFamousName(langCode)]
            return result.concat(await this.randomWordsByLang[langCode].word(length - 1, wordMode))
        } else if (randomResult < famousGlobalNameChance + famousNameByLangChance) {
            var result= [await this.getFamousNameByLang(langCode)]     
            return result.concat(await this.randomWordsByLang[langCode].word(length - 1, wordMode))
        }

        return this.randomWordsByLang[langCode].word(length, wordMode)
    }

    static async getGlobalFamousName(langCode: string): Promise<string> {
        console.log('getGlobalFamousName');
        return Mongo.famousNames().aggregate([
            { $match: { isGlobal: true } },
            { $sample: { size: 1 } }
        ])
            .toArray()
            .then(async (result) => {
                if (result.length > 0)
                    return result[0].name
                else return await this.randomWordsByLang[langCode].noun()
            })
    }

    static async getFamousNameByLang(langCode: string): Promise<string> {
        console.log('getFamousNameByLang');
        return Mongo.famousNames().aggregate([
            { $match: { lang: { $in: [langCode] } } },
            { $sample: { size: 1 } }
        ])
            .toArray()
            .then(async (result) => {
                if (result.length > 0)
                    return result[0].name
                else return await this.randomWordsByLang[langCode].noun()
            })
    }

    // have to be the same between server and client
    static randomWordsByLang: RandomWordsByLang = {
        'en_US': {
            noun: randomNounByEnglish,
            word: randomWordsByEnglish
        },
        'vi_VN': {
            noun: randomNounByVietnamese,
            word: randomWordsByVietnamese
        }
    }
}