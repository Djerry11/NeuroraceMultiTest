// race.js
const socket = io();
// let isCameraPlayer = false;
// Retrieve player data from sessionStorage.
const currentPlayer = JSON.parse(sessionStorage.getItem("currentPlayer"));
const opponent = JSON.parse(sessionStorage.getItem("opponent"));
// if (currentPlayer.playerNumber === 1) {
//   isCameraPlayer = true;
// }
// Immediately reconnect to the room using the persistent token.
socket.emit("reconnect-player", {
  playerToken: currentPlayer.playerId,
  roomId: currentPlayer.room,
});
socket.on("reconnect-success", () => {
  // console.log("Reconnected successfully to the game room.");s
});

// --- Cache DOM elements ---
const carCanvas = document.getElementById("carCanvas");
const cameraCanvas = document.getElementById("cameraCanvas");
const statisticsEl = document.getElementById("statistics");
const counterEl = document.getElementById("counter");

const resultEl = document.getElementById("result");

const miniMapWidth = 300;
document.body.style.flexDirection = "column";

// --- Set canvas dimensions ---
carCanvas.width = window.innerWidth;
carCanvas.height = window.innerHeight * 0; // FIX: use window.innerHeight instead of 0
cameraCanvas.width = window.innerWidth;
cameraCanvas.height = window.innerHeight;

// --- Cache canvas contexts ---
const carCtx = carCanvas.getContext("2d");
const cameraCtx = cameraCanvas.getContext("2d");

//---- miniMap canvas
const miniMapCanvas = document.getElementById("miniMapCanvas");
miniMapCanvas.width = miniMapWidth;
miniMapCanvas.height = miniMapWidth;

// --- Assume global objects: world, Viewport, Car, Camera, etc. ---
const viewport = new Viewport(carCanvas, world.zoom, world.offset);
// --- Global control state (for local control events) ---
const currentControls = {
  forward: false,
  reverse: false,
  left: false,
  right: false,
};

// --- Create cars for the players ---
const cars = generateCars(currentPlayer, opponent);
const myCar = cars[0];
const opponentCar = cars[1];
const camera = new Camera(myCar);
// const miniMap = new MiniMap(miniMapCanvas, world.graph, miniMapWidth, cars);
const miniMapGraph = new Graph([], world.graph);
const miniMap = new MiniMap(miniMapCanvas, world.graph, miniMapWidth, cars);

// --- Optionally load the best brain from sessionStorage ---
// if (sessionStorage.getItem("bestBrain")) {
//   for (let i = 0; i < cars.length; i++) {
//     cars[i].brain = JSON.parse(sessionStorage.getItem("bestBrain"));
//     if (i > 0) {
//       NeuralNetwork.mutate(cars[i].brain, 0.1);
//     }
//   }
// }

// --- Create statistics UI for each car ---
for (let i = 0; i < cars.length; i++) {
  const div = document.createElement("div");
  div.id = "stat_" + i;
  div.innerText = i;
  div.style.color = cars[i].color;
  div.classList.add("stat");
  statisticsEl.appendChild(div);
}

// --- Setup road borders and corridor ---
let roadBorders = [];
const target = world.markings.find((m) => m instanceof Target);
if (target) {
  world.generateCorridor(false);
  roadBorders = world.corridor.borders.map((s) => [s.p1, s.p2]);
} else {
  world.generateCorridor(false);
  roadBorders = world.corridor.borders.map((s) => [s.p1, s.p2]);
}

let frameCount = 0; // (still used for other animations if needed)
let started = false;
let startTime = null; // NEW: holds the timestamp (in ms) when the race starts

startCounter();
animate();

// --- Helper functions for saving/discarding the best brain ---
function save() {
  sessionStorage.setItem("bestBrain", JSON.stringify(myCar.brain));
}
function discard() {
  sessionStorage.removeItem("bestBrain");
}

// --- Function to generate car objects ---
function generateCars(currentPlayer, opponent) {
  const startPoints = world.markings.filter((m) => m instanceof Start);
  const startPoint = startPoints[0].center;
  const dir = startPoints[0].directionVector;
  const startAngle = -angle(dir) + Math.PI / 2;
  const cars = [];

  // Local player's car
  const localCar = new Car(
    startPoint.x,
    startPoint.y,
    30,
    50,
    "CAMERA",
    startAngle,
    currentPlayer.playerNumber === 1 ? "blue" : "green",
    true
  );
  localCar.name = currentPlayer.name;
  localCar.playerId = currentPlayer.playerId;
  localCar.controls = {
    forward: false,
    reverse: false,
    left: false,
    right: false,
  };
  localCar.score = 0;

  cars.push(localCar);

  // Opponent's car (controlled via Socket.IO)
  const oppCar = new Car(
    startPoint.x,
    startPoint.y,
    30,
    50,
    "CAMERA",
    startAngle,
    currentPlayer.playerNumber === 1 ? "green" : "blue"
  );
  oppCar.name = opponent.name;
  oppCar.playerId = opponent.playerId;
  oppCar.controls = {
    forward: false,
    reverse: false,
    left: false,
    right: false,
  };
  oppCar.score = 0;

  cars.push(oppCar);
  return cars;
}

// --- Send final score and race time to server ---
function emitScore(score, finishTime) {
  // console.log("Emitting score:", score, finishTime);
  const pId = currentPlayer.playerId;
  socket.emit("raceCompleted", {
    score,
    finishTime,
    pId,
  });
}

socket.on("opponent-score", (data) => {
  const { score, finishTime, playerId } = data;
  if (opponent.playerId === playerId) {
    opponent.score = score;
    // opponent.finishTime = finishTime;
    // Update the opponent car's finish time so we can compare:
    // opponentCar.finishTime = finishTime;
    checkOutcome();
  }
});

// --- Emit control state to server ---
// Now we include playerToken and roomId along with the controls.
function emitControls() {
  // console.log("Emitting controls:", currentControls);
  socket.emit("controlCar", {
    posX: myCar.x,
    posY: myCar.y,
    angle: myCar.angle,
    controls: { ...currentControls },
    playerId: currentPlayer.playerId,
    roomId: currentPlayer.room,
  });
}

// --- Receive opponent control updates ---
socket.on("opponent-carData", (data) => {
  // data includes { posX, posY, angle, playerId, roomId, controls }
  // console.log("Received opponent car data:", data);
  if (data.playerId === opponent.playerId) {
    opponentCar.controls = data.controls;
    if (
      opponentCar.x !== data.posX ||
      opponentCar.y !== data.posY ||
      opponentCar.angle !== data.angle
    ) {
      opponentCar.x = data.posX;
      opponentCar.y = data.posY;
      opponentCar.angle = data.angle;
    }
  }
});

// --- Update car progress along the corridor ---
// Now using current time (relative to startTime) instead of frameCount.
function updateCarProgress(car) {
  if (!car.finishTime) {
    car.progress = 0;
    const carSeg = getNearestSegment(car, world.corridor.skeleton);
    for (let i = 0; i < world.corridor.skeleton.length; i++) {
      const s = world.corridor.skeleton[i];
      if (s.equals(carSeg)) {
        const proj = s.projectPoint(car);
        const firstPartOfSegment = new Segment(s.p1, proj.point);
        car.progress += firstPartOfSegment.length();
        break;
      } else {
        car.progress += s.length();
      }
    }
    const totalDistance = world.corridor.skeleton.reduce(
      (acc, s) => acc + s.length(),
      0
    );
    car.progress /= totalDistance;
    if (car.progress >= 0.98) {
      car.progress = 1;
      if (!car.finishTime) {
        // Calculate finish time using current time relative to startTime:
        car.finishTime = (Date.now() - startTime) / 1000;
        if (car === myCar) {
          myCar.score = 1;
          // emitScore(1, car.finishTime);
          taDaa();
          checkOutcome();
        }
      }
    }
  }
}

// --- Handle collisions with road borders ---
function handleCollisionWithRoadBorder(car) {
  const seg = getNearestSegment(car, world.corridor.skeleton);
  const correctors = car.polygon.map((p) => {
    const proj = seg.projectPoint(p);
    const projPoint =
      proj.offset < 0 ? seg.p1 : proj.offset > 1 ? seg.p2 : proj.point;
    return subtract(projPoint, p);
  });
  const maxMagnitude = Math.max(...correctors.map((p) => magnitude(p)));
  const corrector = correctors.find((p) => magnitude(p) === maxMagnitude);
  const normCorrector = normalize(corrector);
  if (corrector === correctors[0] || corrector === correctors[2]) {
    car.angle += 0.1;
  } else {
    car.angle -= 0.1;
  }
  car.x += normCorrector.x;
  car.y += normCorrector.y;
  car.damaged = false;
}

// --- Countdown before starting the race ---
function startCounter() {
  counterEl.innerText = "3";
  beep(400);
  setTimeout(() => {
    counterEl.innerText = "2";
    beep(400);
    setTimeout(() => {
      counterEl.innerText = "1";
      beep(400);
      setTimeout(() => {
        counterEl.innerText = "Go!";
        beep(800);
        setTimeout(() => {
          counterEl.innerText = "";
          started = true;
          frameCount = 0;
          // NEW: record the actual start time
          startTime = Date.now();
          myCar.engine = new Engine();
        }, 1000);
      }, 1000);
    }, 1000);
  }, 1000);
}

// --- Compare finish times and display result ---
async function checkOutcome() {
  const firebaseModule = await import("../../../firebaseFunctions.js");
  if (myCar.finishTime != null) {
    if (
      myCar.finishTime < opponentCar.finishTime ||
      opponentCar.finishTime == null
    ) {
      displayResult("You win!");
      const data = {
        opponent: opponent.name,
        time: myCar.finishTime,
        result: "win",
      };
      await firebaseModule.uploadMultiplayerRaceData(data);
      returnToLobby();
    } else if (myCar.finishTime > opponentCar.finishTime) {
      displayResult("You lose!");
      const data = {
        opponent: opponent.name,
        time: myCar.finishTime,
        result: "lose",
      };
      await firebaseModule.uploadMultiplayerRaceData(data);
      returnToLobby();
    } else {
      displayResult("It's a tie!");
      const data = {
        opponent: opponent.name,
        time: myCar.finishTime,
        result: "tie",
      };
      await firebaseModule.uploadMultiplayerRaceData(data);
      returnToLobby();
    }
  }
  // console.log("My finish time:", myCar.finishTime);
}
function displayResult(message) {
  resultEl.innerText = message;
  if (message === "You win!") {
    resultEl.style.color = "green";
  } else if (message === "You lose!") {
    resultEl.style.color = "red";
  } else {
    resultEl.style.color = "black";
  }
}

// --- Main animation loop ---
function animate() {
  if (started) {
    cars.forEach((car) => {
      car.update(roadBorders, []);
    });
  }
  for (const car of cars) {
    if (car.damaged) {
      handleCollisionWithRoadBorder(car);
    }
  }
  world.cars = cars;
  world.bestCar = myCar;
  viewport.offset.x = -myCar.x;
  viewport.offset.y = -myCar.y;
  viewport.reset();
  const viewPoint = scale(viewport.getOffset(), -1);
  // world.draw(carCtx, viewPoint, false);
  miniMap.update(viewPoint);
  // miniMapCanvas.style.transform = "rotate(" + myCar.angle + "rad)";
  cars.forEach((car) => updateCarProgress(car));
  cars.sort((a, b) => b.progress - a.progress);
  for (let i = 0; i < cars.length; i++) {
    const stat = document.getElementById("stat_" + i);
    stat.style.color = cars[i].color;
    stat.innerText = `${i + 1}: ${cars[i].name}${cars[i].damaged ? " 💀" : ""}`;
    stat.style.backgroundColor = cars[i] === opponentCar ? "black" : "gray";
    if (cars[i].finishTime) {
      stat.innerHTML += `<span style='float:right;'>${cars[
        i
      ].finishTime.toFixed(1)}s</span>`;
    }
  }
  camera.move(myCar);
  // camera.draw(carCtx);
  camera.render(cameraCtx, world);
  frameCount++;
  requestAnimationFrame(animate);
}
function returnToLobby() {
  if (myCar.finishTime != null && opponentCar.finishTime != null) {
    setTimeout(() => {
      displayBackToLobbyButton();
    }, 2000);
  } else {
    setInterval(() => {
      if (myCar.finishTime != null && opponentCar.finishTime != null) {
        displayBackToLobbyButton();
      }
    }, 2000);
  }
}

// // --- Key event handlers ---
// if (!isCameraPlayer) {
//   document.addEventListener("keydown", (event) => {
//     if (
//       ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
//     ) {
//       event.preventDefault();
//     }
//     let changed = false;
//     if (event.key === "ArrowUp" && !currentControls.forward) {
//       currentControls.forward = true;
//       changed = true;
//     }
//     if (event.key === "ArrowDown" && !currentControls.reverse) {
//       currentControls.reverse = true;
//       changed = true;
//     }
//     if (event.key === "ArrowLeft" && !currentControls.left) {
//       currentControls.left = true;
//       changed = true;
//     }
//     if (event.key === "ArrowRight" && !currentControls.right) {
//       currentControls.right = true;
//       changed = true;
//     }
//     if (changed) {
//       myCar.controls.forward = currentControls.forward;
//       myCar.controls.reverse = currentControls.reverse;
//       myCar.controls.left = currentControls.left;
//       myCar.controls.right = currentControls.right;
//       emitControls();
//     }
//   });

//   document.addEventListener("keyup", (event) => {
//     if (
//       ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
//     ) {
//       event.preventDefault();
//     }
//     let changed = false;
//     if (event.key === "ArrowUp" && currentControls.forward) {
//       currentControls.forward = false;
//       changed = true;
//     }
//     if (event.key === "ArrowDown" && currentControls.reverse) {
//       currentControls.reverse = false;
//       changed = true;
//     }
//     if (event.key === "ArrowLeft" && currentControls.left) {
//       currentControls.left = false;
//       changed = true;
//     }
//     if (event.key === "ArrowRight" && currentControls.right) {
//       currentControls.right = false;
//       changed = true;
//     }
//     if (changed) {
//       myCar.controls.forward = currentControls.forward;
//       myCar.controls.reverse = currentControls.reverse;
//       myCar.controls.left = currentControls.left;
//       myCar.controls.right = currentControls.right;
//       emitControls();
//     }
//   });
// }
