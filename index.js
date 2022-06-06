const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let connectionPeers = [];

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

io.on("connection", (socket) => {
  console.log(`user with ${socket.id} id connect.`);

  socket.on("disconnect", () => {
    const newConnectionPeer = connectionPeers.filter((peerSocketId) => {
      peerSocketId !== socket.id;
    });
    connectionPeers = newConnectionPeer;
  });
});

server.listen(PORT, () => {
  console.log(`Listen on PORT ${PORT}`);
});
