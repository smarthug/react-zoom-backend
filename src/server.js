import {createServer} from "http";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import express from "express";
import cors from 'cors'

const app = express();
app.use(cors())
const port = 8000;

const handleListen = () => console.log(`Listening on http://localhost:${port}`);

const httpServer = createServer(app);

const wsServer = new Server(
  httpServer,
  {
    cors: {
      origin: ["https://admin.socket.io", "http://localhost:3000"],
      credentials: true,
    },
  },
  handleListen
);

instrument(wsServer, {
  auth: false,
});

function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;

  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}

function countRoom(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) => {
  socket["nickname"] = "Anon";
  socket.onAny((event) => {
    // console.log(wsServer.sockets.adapter);
    console.log(`Socket Event:${event}`);
  });
  socket.on("enter_room", (roomName, done) => {
    socket.join(roomName);
    done();
    socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
    wsServer.sockets.emit("room_change", publicRooms());
  });
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1)
    );
  });
  socket.on("new_message", (msg, room, done) => {
    socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
    done();
  });
  socket.on("nickname", (nickname) => (socket["nickname"] = nickname));
});

httpServer.listen(port, handleListen);
