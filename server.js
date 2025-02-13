const express = require("express");
const socketio = require("socket.io");
const http = require("http");

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

const rooms = {}; // Store rooms
const players = {}; // Store players

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  socket.on("create-room", ({ playerName, isPublic, playerToken }) => {
    // Remove old room if player already created one
    const existingRoom = Object.entries(rooms).find(
      ([, room]) => room.creator === playerToken
    );
    if (existingRoom) {
      delete rooms[existingRoom[0]];
    }

    const roomId = generateRoomId();
    rooms[roomId] = {
      roomId,
      creator: playerToken,
      isPublic: !!isPublic,
      players: [playerToken],
      status: "waiting",
    };

    players[playerToken] = {
      token: playerToken,
      name: playerName,
      room: roomId,
      playerNumber: 1,
      socketId: socket.id,
      playerId: playerToken,
    };

    socket.join(roomId);
    io.emit("update-rooms", getPublicRooms()); // Send only public rooms
    socket.emit("room-created", { roomId, playerNumber: 1 });
  });

  socket.on("join-room", ({ roomId, playerName, playerToken }) => {
    if (!rooms[roomId]) return socket.emit("error", "Room not found");
    if (rooms[roomId].status === "playing")
      return socket.emit("error", "Game already in progress");
    if (rooms[roomId].players.length >= 2)
      return socket.emit("error", "Room is full");

    rooms[roomId].players.push(playerToken);
    players[playerToken] = {
      token: playerToken,
      name: playerName,
      room: roomId,
      playerNumber: 2,
      socketId: socket.id,
      playerId: playerToken,
    };

    socket.join(roomId);
    socket.emit("join-success", { playerNumber: 2 });
    io.to(roomId).emit("player-joined", {
      players: rooms[roomId].players.map((token) => players[token].name),
    });
    io.emit("update-rooms", getPublicRooms()); // Send only public rooms
  });

  socket.on("get-rooms", () => {
    socket.emit("update-rooms", getPublicRooms()); // Send only public rooms
  });
  // Host starts the game.
  socket.on("host-start-game", () => {
    // Identify the player by matching the current socket id.
    const playerToken = Object.keys(players).find(
      (token) => players[token].socketId === socket.id
    );
    if (!playerToken) return;
    const roomId = players[playerToken].room;
    if (!rooms[roomId] || rooms[roomId].players.length < 2) {
      return socket.emit("error", "Need two players to start game");
    }
    rooms[roomId].status = "playing";
    const [player1Token, player2Token] = rooms[roomId].players;
    io.to(roomId).emit("start-game", {
      player1: players[player1Token],
      player2: players[player2Token],
    });
  });

  // --- Updated Control Relay Handler ---
  socket.on("controlCar", (data) => {
    console.log("Received control data:", data);
    const { posX, posY, angle, controls, playerId, roomId } = data;
    io.emit("opponent-carData", {
      posX,
      posY,
      angle,
      controls,
      playerId,
      roomId,
    });
  });
  // --- Updated Control Relay Handler ---
  socket.on("raceCompleted", (data) => {
    console.log("Received control data:", data);
    const { score, finishTime, playerId } = data;
    io.emit("opponent-score", {
      score,
      finishTime,
      playerId,
    });
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
    const playerToken = Object.keys(players).find(
      (token) => players[token].socketId === socket.id
    );

    if (playerToken) {
      const roomId = players[playerToken].room;
      if (rooms[roomId]) {
        rooms[roomId].players = rooms[roomId].players.filter(
          (token) => token !== playerToken
        );
        if (rooms[roomId].players.length === 0) {
          delete rooms[roomId];
        } else {
          io.to(roomId).emit("player-left", players[playerToken].name);
        }
      }
      delete players[playerToken];
    }
    io.emit("update-rooms", getPublicRooms());
  });
});

// Utility: Get only public rooms
function getPublicRooms() {
  return Object.values(rooms)
    .filter((room) => room.isPublic) // Show only public rooms
    .map((room) => ({
      roomId: room.roomId,
      players: room.players.map((token) => players[token]?.name || ""),
      creator: room.creator,
      status: room.status,
    }));
}

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

function generateRoomId() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}
