type DrawData = {
    tail_id: number
    past_steps: {
        [key: number]: DrawStep
    };
    current_step: DrawStep |null
}

interface DrawStep {
    id: number
    type: string
    prev_id?: number 
    next_id?: number
    secondary_id: string
}

interface ClearStep extends DrawStep {
    type: 'clear'
}

interface BrushStep extends DrawStep {
    type: 'brush'
    stroke_width: number
    color: Color
    points: DrawPoint[]
}

interface FullFillStep extends DrawStep {
    type: 'full_fill'
    color: Color
}

interface FloodFillStep extends DrawStep {
    type: 'flood_fill'
    color: Color
    point: DrawPoint
}

interface Color {
    r: number
    g: number
    b: number
    a: number
}

interface DrawPoint {
    x: number
    y: number
}