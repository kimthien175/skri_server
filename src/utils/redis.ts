import { createClient } from 'redis'

const _redisClient = await createClient({ url: process.env.REDIS_URI })
        .on("error", (err: any) => console.log(`[REDIS ERROR] ${err}`))
        .connect()

class Redis{
        static async setRoomId(socketId: string, roomId: string){
            return _redisClient.hSet(socketId, 'room_id', roomId)
        }

        static async getRoomId(socketId: string){
                const roomId = await _redisClient.hGet(socketId, 'room_id')
                if (roomId == null) throw Error('NULL ROOM ID')
                return roomId
        }

        static async clear(socketId: string){
                return _redisClient.hDel(socketId, 'room_id')
        }
}

export {Redis}