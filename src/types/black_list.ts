export class BlackItem<TYPE extends string> {
    constructor(type: TYPE) {
        this.type = type

    }
    type: TYPE 
}

export class Banned extends BlackItem<'ban'> {
    constructor() {
        super('ban')
    }
}

export class Kicked extends BlackItem<'kick'> {
    constructor(id: String) {
        super('kick')
        this.date = new Date()
        // this.old_code = old_code
        this.id = id
    }
    date: Date
    //old_code: String
    id: String
}
