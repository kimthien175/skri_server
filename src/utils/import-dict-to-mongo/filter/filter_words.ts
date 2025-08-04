import { Mongo } from "../../db/mongo.js"


const notSuitableWords: string[] = [
    "co-star",
    "all-important",
    "bloody-minded",
    "hushed-up",
    "ill-natured",
    "sex-starved",
    "fail-safe",
    "flim-flam",
    "closed-door",
    "self-absorbed",
    "boat-race",
    "d-day",
    "forty-two",
    "half-pay",
    "self-conscious",
    "clickety-clack",
    "father-in-law",
    "dead-end",
    "battle-ax",
    "ill-timed",
    "non-resistant",
    "four-dimensional",
    "high-rise",
    "cash-and-carry",
    "twenty-nine",
    "two-dimensionality",
    "beggar-my-neighbor",
    "u-turn",
    "self-organization",
    "cut-and-dried",
    "close-minded",
    "teeter-totter",
    "penny-pinch",
    "noli-me-tangere",
    "namby-pamby",
    "tip-off",
    "radial-ply",
    "no-nonsense",
    "double-spacing",
    "light-sensitive",
    "face-saving",
    "check-in",
    "take-up",
    "north-northwest",
    "self-absorption",
    "man-of-war",
    "all-around",
    "lead-in",
    "mid-november"
]
  
  
  

async function filter(){
    await Mongo.connect()

    
   console.log( await Mongo.normalEnglishWords.updateMany({word: {$in: notSuitableWords}}, {$set:{isDisabled: true}}))
}

filter()