import express from 'express'
import { getLastestNews, Mongo } from "./db/mongo.js"
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('Hello world')
})
app.get('/news', async (req, res) =>
    res.send(await getLastestNews())
)

app.post('/report_player', (req, res) =>
    Mongo.reportedPlayers.insertOne(req.body).then((_) => res.send()).catch((e) => res.status(500).send(e))
)

export { app }