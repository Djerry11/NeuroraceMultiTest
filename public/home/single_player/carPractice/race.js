const rightPanelWidth = 300;

document.body.style.flexDirection = "column";
const user = JSON.parse(localStorage.getItem("user"));
const userId = user.uid;

const carCanvas = document.getElementById("carCanvas");
carCanvas.width = window.innerWidth;
carCanvas.height = 0; //window.innerHeight / 2;

const cameraCanvas = document.getElementById("cameraCanvas");
cameraCanvas.width = window.innerWidth;
cameraCanvas.height = window.innerHeight;

const miniMapCanvas = document.getElementById("miniMapCanvas");
miniMapCanvas.width = rightPanelWidth;
miniMapCanvas.height = rightPanelWidth;

let startTime = new Date().getTime();
const carCtx = carCanvas.getContext("2d");
const cameraCtx = cameraCanvas.getContext("2d");

const viewport = new Viewport(carCanvas, world.zoom, world.offset);

const N = 0;
const cars = generateCars(1, "CAMERA");
// console.log(cars.length);
const myCar = cars[0];
myCar.isMyCar = true;
const camera = new Camera(myCar);

for (let i = 0; i < cars.length; i++) {
  const div = document.createElement("div");
  div.id = "stat_" + i;
  div.innerText = i;
  div.style.color = cars[i].color;
  div.classList.add("stat");
  statistics.appendChild(div);
}

let roadBorders = [];
const target = world.markings.find((m) => m instanceof Target);
if (target) {
  world.generateCorridor(myCar, target.center, true);
  roadBorders = world.corridor.borders.map((s) => [s.p1, s.p2]);
} else {
  roadBorders = world.roadBorders.map((s) => [s.p1, s.p2]);
}

const miniMapGraph = new Graph([], world.corridor.skeleton);
const miniMap = new MiniMap(miniMapCanvas, miniMapGraph, rightPanelWidth, cars);

let frameCount = 0;
let started = false;

startCounter();
animate();

function generateCars(N, type) {
  const startPoints = world.markings.filter((m) => m instanceof Start);
  const startPoint =
    startPoints.length > 0 ? startPoints[0].center : new Point(100, 100);
  const dir =
    startPoints.length > 0 ? startPoints[0].directionVector : new Point(0, -1);
  const startAngle = -angle(dir) + Math.PI / 2;

  const cars = [];
  for (let i = 1; i <= N; i++) {
    const color = type == "AI" ? getRandomColor() : "blue";
    const car = new Car(
      startPoint.x,
      startPoint.y,
      30,
      50,
      "CAMERA",
      startAngle,
      3,
      color
    );
    car.name = type == "AI" ? "AI" + i : "Me";

    cars.push(car);
  }
  return cars;
}

async function updateCarProgress(car) {
  // console.log("x: ", car.x, "y: ", car.y);
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
    if (car.progress >= 1) {
      car.progress = 1;

      car.finishTime = (new Date().getTime() - startTime) / 1000;
      const data = {
        time: car.finishTime,
        collisions: car.collisionNumber,
      };
      // await uploadSinglePlayerRaceData(data);
      if (car == myCar) {
        const firebaseModule = await import("../../../firebaseFunctions.js");
        await firebaseModule.uploadSinglePlayerRaceData(data);
        taDaa();
      }
    }
  }
}

function startCounter() {
  counter.innerText = "3";
  beep(400);
  setTimeout(() => {
    counter.innerText = "2";
    beep(400);
    setTimeout(() => {
      counter.innerText = "1";
      beep(400);
      setTimeout(() => {
        counter.innerText = "GO!";
        beep(700);
        setTimeout(() => {
          counter.innerText = "";
          started = true;
          frameCount = 0;
          startTime = new Date().getTime();
          myCar.engine = new Engine();
        }, 1000);
      }, 1000);
    }, 1000);
  }, 1000);
}

function handleCollisionWithRoadBorder(car) {
  const seg = getNearestSegment(car, world.corridor.skeleton);

  const correctors = car.polygon.map((p) => {
    const proj = seg.projectPoint(p);
    const projPoint =
      proj.offset < 0 ? seg.p1 : proj.offset > 1 ? seg.p2 : proj.point;
    return subtract(projPoint, p);
  });

  const maxMagnitude = Math.max(...correctors.map((p) => magnitude(p)));
  const corrector = correctors.find((p) => magnitude(p) == maxMagnitude);
  const normCorrector = normalize(corrector);

  if (corrector == correctors[0] || corrector == correctors[2]) {
    car.angle += 0.2;
  } else {
    car.angle -= 0.2;
  }

  car.x += normCorrector.x;
  car.y += normCorrector.y;
  car.damaged = false;
}

function animate() {
  if (started) {
    for (let i = 0; i < cars.length; i++) {
      cars[i].update(roadBorders, []);
    }
  }

  for (const car of cars) {
    if (car.damaged) {
      handleCollisionWithRoadBorder(car);
    }
  }

  //   world.cars = cars;
  world.bestCar = myCar;

  viewport.offset.x = -myCar.x;
  viewport.offset.y = -myCar.y;

  viewport.reset();
  const viewPoint = scale(viewport.getOffset(), -1);
  // world.draw(carCtx, viewPoint, false);
  miniMap.update(viewPoint);
  miniMapCanvas.style.transform = "rotate(" + myCar.angle + "rad)";

  for (let i = 0; i < cars.length; i++) {
    updateCarProgress(cars[i]);
  }

  cars.sort((a, b) => b.progress - a.progress);

  for (let i = 0; i < cars.length; i++) {
    const stat = document.getElementById("stat_" + i);
    stat.style.color = cars[i].type == "AI" ? "white" : cars[i].color;
    stat.innerText = i + 1 + ": " + cars[i].name;
    stat.style.backgroundColor = cars[i].type == "AI" ? "black" : "white";
    if (cars[i].finishTime) {
      cars[i].speed = 0;
      stat.innerHTML +=
        "<span style='float:right;'>" +
        cars[i].finishTime.toFixed(2) +
        "s" +
        " \nCollisions: " +
        cars[i].collisionNumber +
        "</span>";
    }
  }

  camera.move(myCar);
  // camera.draw(carCtx);
  camera.render(cameraCtx, world);

  frameCount++;
  requestAnimationFrame(animate);
}
