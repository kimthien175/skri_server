import { Mongo } from "./utils/db/mongo.js";
import { randomCombinedEnglishWords, randomEnglishWords, randomPopularEnglishWords } from "./utils/random/lang/en.js";
import { randomCompoundVietnameseWords, randomPopularVietnameseWords, randomVietnameseWords } from "./utils/random/lang/vi.js";
import { Random } from "./utils/random/random.js";

async function test(){
    await Mongo.connect()
    console.log(await Random.getWords({
        use_custom_words_only: false,
        word_count: 4,
        language: 'vi_VN',
        word_mode: 'Combination'
    }));

}

test()