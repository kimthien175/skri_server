import express from 'express'
import { getLastestNews, Mongo } from "./db/mongo.js"
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('Hello world')
})

app.get('/news', async (req, res) => {
    try {
        res.send(await getLastestNews())
    } catch (e) {
        console.log(`[getLastestNews]: ${e}`);
        res.status(500).send(e)
    }
})

app.post('/report_player', async (req, res) => {
    try {
        await Mongo.reportedPlayers.insertOne(req.body)
        res.send()
    } catch (e) {
        console.log(`[REPORT PLAYER] ${e}`);
        res.status(500).send(e)
    }
})

export { app }