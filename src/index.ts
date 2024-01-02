console.log('hello world')

import express from "express"
//import {Server} from "socket.io"

const app = express();
app.listen(4000, () => {
  console.log(`server runningggh on port 4000`);
  console.log('how are you today');
});

app.get("/", (req, res) => {
  res.send("Hello World!n hehehe");
});