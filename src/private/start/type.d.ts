interface StartPrivateGameResponse{
    success: boolean
    data: StartPrivateGamePackage | any
}

interface StartPrivateGamePackage{
    word_options: any
    player_turn_id: string
}