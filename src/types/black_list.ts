export class BlackItem {
    constructor(type: string) {
        this.type = type

    }
    type: string

}

export class Banned extends BlackItem {
    constructor() {
        super('ban')
    }
}

export class Kicked extends BlackItem{
    constructor(old_code: String, id: String){
        super('kick')
        this.date  = new Date()
        this.old_code = old_code
        this.id = id
    }
    date: Date
    old_code: String
    id: String
}


