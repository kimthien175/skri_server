interface InitPlayer{
    id: string 
    name: string
    socket_id: string
}

export interface Player extends InitPlayer{
    avatar: {
        color: number;
        eyes: number;
        mouth: number;
    },
    score?: number
    votekick?: VoteKick
}

interface VoteKick{
    voter_id_list: string[]
    min_vote: number
}