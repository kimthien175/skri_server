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
    votekick?: VoteKick
}

interface VoteKick{
    voter_id_list: string[]
    min_vote: number
}