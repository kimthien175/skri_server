interface InitPlayer{
    id: string 
    name: string
}

interface Player extends InitPlayer{
    avatar: {
        color: number;
        eyes: number;
        mouth: number;
    },
    point?: number
}
