import { ObjectId } from "mongodb"
import { getLastestSpecs } from "../utils/db/mongo.js"


export class ServerTicket {
    //id: string
    valid_date: Date
    victim_id: string
    constructor(valid_date: Date, victim_id: string) {
        //this.id = new ObjectId().toString()
        this.valid_date = valid_date
        this.victim_id = victim_id
    }

    static async getValidDate(): Promise<Date>{
        var kickInterval = (await getLastestSpecs()).system.kick_interval
        var valid_date = new Date()
        valid_date.setSeconds(valid_date.getSeconds() + kickInterval)
        return valid_date
    }
}

type ClassProperties<T> = {
    [K in keyof T as T[K] extends Function ? never : K]: T[K]
}

export type ClientTicket = Omit<ClassProperties<ServerTicket>, 'valid_date'> & { room_id: String }