// Connect to Socket.IO
const socket = io();

// --- Cache DOM Elements ---
const formsContainer = document.querySelector(".forms-container");
const lobbySection = document.querySelector(".lobby-section");
const roomIdDisplay = document.getElementById("room-id-display");
const startGameBtn = document.getElementById("start-game-btn");
const playersListEl = document.getElementById("players-list");
const publicRoomsListEl = document.getElementById("public-rooms-list");
const createFormEl = document.getElementById("create-form");
const joinFormEl = document.getElementById("join-form");

// --- Set a Unique Token per Browser Tab using sessionStorage ---
if (!sessionStorage.getItem("playerToken")) {
  sessionStorage.setItem("playerToken", generateToken());
}
const playerToken = sessionStorage.getItem("playerToken");

let currentRoom = null;
let playerNumber = null;

// --- Utility: Generate a Short Random Token ---
function generateToken() {
  return "_" + Math.random().toString(36).substr(2, 9);
}

// --- Utility: Get the Player's Name from Their Profile ---
function getPlayerName() {
  const user = JSON.parse(localStorage.getItem("user"));
  const userName = user.displayName.split(" ")[0];
  return user ? userName : "";
}

// --- UI Functions ---
function showCreateForm() {
  createFormEl.classList.remove("hidden");
  joinFormEl.classList.add("hidden");
}

function showJoinForm() {
  joinFormEl.classList.remove("hidden");
  createFormEl.classList.add("hidden");
}

// --- Create Room ---
// When a room is created, if the same player already had one, it is removed on the server.
function createRoom() {
  const playerName = getPlayerName();
  if (!playerName) {
    return alert("Player profile not found. Please log in.");
  }
  const isPublic = document.getElementById("is-public").checked;
  socket.emit("create-room", { playerName, isPublic, playerToken });
}

// --- Join Room ---
function joinRoom() {
  const roomId = document.getElementById("room-id").value.trim();
  const playerName = getPlayerName();
  if (!roomId) {
    return alert("Please enter a room code.");
  }
  if (!playerName) {
    return alert("Player profile not found. Please log in.");
  }
  socket.emit("join-room", { roomId, playerName, playerToken });
}

// --- Join Public Room ---
function joinPublicRoom(roomId) {
  const playerName = getPlayerName();
  if (!playerName) {
    return alert("Player profile not found. Please log in.");
  }
  socket.emit("join-room", { roomId, playerName, playerToken });
}

// --- Update Players List in Lobby ---
function updatePlayersList(players) {
  playersListEl.innerHTML = players
    .map((player, index) => {
      const icon =
        index === 0
          ? '<i class="fas fa-flag-checkered"></i>'
          : '<i class="fas fa-car"></i>';
      return `<li class="player-item">${icon} ${player}</li>`;
    })
    .join("");
}

// --- Update Public Rooms List (Vertical Cards) ---
function updatePublicRoomsList(rooms) {
  publicRoomsListEl.innerHTML = rooms
    .map((room) => {
      let joinButton = "";
      // Show join button if current user is not the creator and room is waiting with a free slot.
      if (
        room.creator !== playerToken &&
        room.status === "waiting" &&
        room.players.length < 2
      ) {
        joinButton = `<div class="room-action">
                        <button onclick="joinPublicRoom('${room.roomId}')">
                          <i class="fas fa-sign-in-alt"></i> Join
                        </button>
                      </div>`;
      }
      return `<div class="room-card">
                <div class="room-info">
                  <span class="room-id">Room: ${room.roomId}</span>
                  <span class="room-players">Players: ${room.players.join(
                    ", "
                  )}</span>
                  <span class="room-status">Status: ${room.status}</span>
                </div>
                ${joinButton}
              </div>`;
    })
    .join("");
}

// --- Socket Event Listeners ---
socket.on("room-created", ({ roomId, playerNumber: pNum }) => {
  currentRoom = roomId;
  playerNumber = pNum;
  formsContainer.classList.add("hidden");
  lobbySection.classList.remove("hidden");
  roomIdDisplay.textContent = roomId;
  const playerName = getPlayerName();
  updatePlayersList([playerName]);
  startGameBtn.classList.add("hidden");
});

socket.on("join-success", ({ playerNumber: pNum }) => {
  playerNumber = pNum;
  formsContainer.classList.add("hidden");
  lobbySection.classList.remove("hidden");
  if (playerNumber !== 1) {
    startGameBtn.classList.add("hidden");
  }
});

socket.on("player-joined", (data) => {
  updatePlayersList(data.players);
  if (playerNumber === 1 && data.players.length === 2) {
    startGameBtn.classList.remove("hidden");
  }
});

socket.on("start-game", ({ player1, player2 }) => {
  // Determine the current player based on persistent token.
  const isPlayer1 = playerToken === player1.playerId;
  const currentPlayer = isPlayer1 ? player1 : player2;
  const opponent = isPlayer1 ? player2 : player1;
  // Save game data in sessionStorage for the race page.
  sessionStorage.setItem("currentPlayer", JSON.stringify(currentPlayer));
  sessionStorage.setItem("opponent", JSON.stringify(opponent));
  window.location.href = "../multiplayer/race.html";
});

socket.on("update-rooms", (rooms) => {
  updatePublicRoomsList(rooms);
});

socket.on("error", (message) => {
  alert(message);
});

// Request public rooms on load.
socket.emit("get-rooms");

// --- Host Start Game Handler ---
function startGame() {
  if (playerNumber === 1) {
    socket.emit("host-start-game");
  }
}

function goHome() {
  window.location.href = "../home/home.html"; // Change to your actual home menu file
}

// Expose functions for inline handlers.
window.startGame = startGame;
window.showCreateForm = showCreateForm;
window.showJoinForm = showJoinForm;
window.createRoom = createRoom;
window.joinRoom = joinRoom;
window.joinPublicRoom = joinPublicRoom;
