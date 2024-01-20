import express from 'express'
import { getLastestNews } from "./db/mongo.js"
import cors from 'cors'

const app = express()
app.use(cors())

app.get('/', (req, res) => {
    res.send('Hel')
})
app.get('/news', async function (req, res) {
    res.send(await getLastestNews())
})

export { app }