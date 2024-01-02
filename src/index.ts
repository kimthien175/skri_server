console.log('hello world')

import { Server } from "socket.io"
import express = require('express')
import { createServer } from 'http'
import { getNews } from "./mongo"


const app = express()
app.get('/', (req, res) => {
  res.send('Hello Worldd!')
})
// app.get('/news', async function (req, res) {
//   var lastestNews = await getNews()
//   console.log(lastestNews)
//   res.send('News')
// })


const httpServer = createServer(app)
const io = new Server(httpServer)

io.on('connection', (socket) => {
  //..
})

httpServer.listen(4000)
