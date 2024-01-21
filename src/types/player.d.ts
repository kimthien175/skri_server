interface Player {
    id: string;
    name: string;
    avatar: {
        color: number;
        eyes: number;
        mouth: number;
    },
    isOwner?: boolean;
    point?: number
}
