import { ObjectId } from "mongodb"
import { getLastestSpecs } from "../utils/db/mongo.js"


export class ServerTicket {
    static async init(victim_id: String): Promise<ServerTicket> {
        var kickInterval = (await getLastestSpecs()).system.kick_interval
        var valid_date = new Date()
        valid_date.setSeconds(valid_date.getSeconds() + kickInterval)

        return new ServerTicket(valid_date, victim_id)
    }

    valid_date: Date
    ticket_id: String 
    victim_id: String 
    constructor(valid_date: Date, victim_id: String){
        this.ticket_id = (new ObjectId()).toString()
        this.valid_date = valid_date
        this.victim_id = victim_id
    }

    toClientTicket(room_id: String): ClientTicket{
        return {
            ticket_id: this.ticket_id,
            victim_id: this.victim_id,
            room_id
        }
    }
}

type ClassProperties<T> = {
    [K in keyof T as T[K] extends Function ? never: K]: T[K]
}

export type ClientTicket =Omit<ClassProperties<ServerTicket>, 'valid_date'>&{room_id: String}