import express = require('express')
import { getNews } from "./mongo"
var cors = require('cors')

const app = express()
app.use(cors())

app.get('/', (req, res) => {
    res.send('Hello Worldd! he')
})
app.get('/news', async function (req, res) {
    var lastestNews = await getNews()
    res.send(lastestNews)
})

export { app }