export class BlackItem {
    constructor(type: string, ip: string) {
        this.type = type
        this.ip = ip
    }
    type: string
    ip: string
}

export class Banned extends BlackItem {
    constructor(ip: string) {
        super('ban', ip)
    }
}


