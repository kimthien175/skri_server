console.log('hello world')

import { Server } from "socket.io"
import express = require('express')
import {createServer} from 'http'

const app = express()
app.get('/', (req, res) => {
  res.send('Hello World!')
})
app.get('/news', (req, res)=>{
  res.send('News')
})


const httpServer = createServer(app)
const io = new Server(httpServer)

io.on('connection', (socket) => {
  //..
})

httpServer.listen(4000)
