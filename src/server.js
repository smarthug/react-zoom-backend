import {WebSocketServer} from "ws";

const port = 8000;

const handleListen = () => console.log(`Listening on http://localhost:${port}`);

const wss = new WebSocketServer({port}, handleListen);

const sockets = [];

wss.on("connection", (socket) => {
  sockets.push(socket);
  socket["nickname"] = "Anon"
  console.log("Connected to Browser ✅");
  socket.on("close", () => console.log("Disconnected from the Browser ❌"));
  socket.on("message", (msg) => {
    const message = JSON.parse(msg);
    switch (message.type) {
      case "new_message":
        sockets.forEach((aSocket) => aSocket.send(`${socket.nickname}: ${message.payload}`));
        break
      case "nickname":
        socket["nickname"] = message.payload;
        break
    }
  });
});
