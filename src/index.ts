import { Server } from "socket.io"
import express = require('express')
import { createServer } from 'http'
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


const httpServer = createServer(app)
const io = new Server(httpServer)

io.on('connection', (socket) => {
  //..
})

httpServer.listen(4000)
