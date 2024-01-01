console.log('hello world')

import express from "express";

const app = express();
app.listen(4000, () => {
  console.log(`server runningggh on port 4000`);
  console.log('yolo helele')
});

app.get("/", (req, res) => {
  res.send("Hello World!n hehehe");
});