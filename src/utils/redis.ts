import { createClient } from 'redis'

console.log(process.env.REDIS_URI as string);
const redisClient = await createClient({ url: process.env.REDIS_URI })
        .on("error", (err: any) => console.log(`[REDIS ERROR] ${err}`))
        .connect()

export { redisClient }