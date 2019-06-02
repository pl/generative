const FRAME_RATE = 60;
const G = 100;

let activeStreets = [];
let inactiveStreets = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(FRAME_RATE);

  activeStreets = [
    new Street({ x: 0, y: 0, vx: 50, vy: 50, spawnEnergy: 50, angleRandomness: 0 }),
    new Street({ x: windowWidth * 0.4, y: windowHeight * 0.4, vx: -10, vy: -10, spawnEnergy: 20, angleRandomness: 1 }),
    new Street({ x: windowWidth * 0.4, y: windowHeight * 0.5, vx: -10, vy: 10, spawnEnergy: 20, angleRandomness: 1 }),
    new Street({ x: windowWidth * 0.5, y: windowHeight * 0.4, vx: 10, vy: -10, spawnEnergy: 20, angleRandomness: 1 }),
    new Street({ x: windowWidth * 0.5, y: windowHeight * 0.5, vx: 10, vy: 10, spawnEnergy: 20, angleRandomness: 1 }),
    new Street({ x: windowWidth * 0.9, y: windowHeight * 0.9, vx: -50, vy: 0, angleRandomness: 2 }),
  ];
}

class Street {
  constructor({ parent, x, y, vx, vy, spawnEnergy = 10, angleRandomness = 0 }) {
    this.parent = parent;

    this.xStart = x;
    this.yStart = y;
    this.xEnd = x;
    this.yEnd = y;

    this.vx = vx;
    this.vy = vy;

    this.energy = 0;
    this.spawnEnergy = spawnEnergy;
    this.angleRandomness = angleRandomness;
  }

  step(dt) {
    const xStart = this.xEnd;
    const yStart = this.yEnd;
    const xEnd = (this.xEnd += this.vx * dt);
    const yEnd = (this.yEnd += this.vy * dt);
    return { xStart, yStart, xEnd, yEnd };
  }

  crosses(other) {
    var aSide = (other.xStart - other.xEnd) * (this.yEnd - other.yEnd) - (other.yStart - other.yEnd) * (this.xEnd - other.xEnd) > 0;
    var bSide = (other.xStart - other.xEnd) * (this.yStart - other.yEnd) - (other.yStart - other.yEnd) * (this.xStart - other.xEnd) > 0;
    var cSide = (this.xStart - this.xEnd) * (other.yEnd - this.yEnd) - (this.yStart - this.yEnd) * (other.xEnd - this.xEnd) > 0;
    var dSide = (this.xStart - this.xEnd) * (other.yStart - this.yEnd) - (this.yStart - this.yEnd) * (other.xStart - this.xEnd) > 0;
    return aSide !== bSide && cSide !== dSide;
  }

  outOfBounds(x, y) {
    return this.xEnd < 0 || this.xEnd > x || this.yEnd < 0 || this.yEnd > y;
  }

  feed(dE) {
    this.energy += dE;

    let actions = [];

    if (this.energy > this.spawnEnergy) {
      this.energy -= this.spawnEnergy;

      const angle = HALF_PI + (Math.random() < 0.5 ? PI : 0) + (Math.random() * 0.1 - 0.05) * PI * this.angleRandomness;
      const vx = this.vx * Math.cos(angle) - this.vy * Math.sin(angle);
      const vy = this.vx * Math.sin(angle) - this.vy * Math.cos(angle);

      actions.push({
        action: "spawn",
        street: new Street({
          x: this.xEnd,
          y: this.yEnd,
          vx,
          vy,
          parent: this,
          spawnEnergy: this.spawnEnergy,
          angleRandomness: this.angleRandomness,
        }),
      });
    }

    return actions;
  }
}

function draw() {
  let stillActive = [];
  let deactivated = [];
  let spawned = [];

  if (activeStreets.length === 0) {
    noLoop();
  }

  for (const i in activeStreets) {
    const s = activeStreets[i];

    const ds = s.step(1 / FRAME_RATE);
    line(ds.xStart, ds.yStart, ds.xEnd, ds.yEnd);

    actions = s.feed(Math.random());
    for (a of actions) {
      switch(a.action) {
        case "spawn":
          spawned.push(a.street);
          break;
      }
    }

    let deactivate = false;
    // Out of bounds check
    if (s.outOfBounds(windowWidth, windowHeight)) {
      deactivate = true;
    }
    // Collisions
    for (s2 of activeStreets) {
      // Don't collide with itself
      if (s === s2) {
        continue;
      }
      // Only one line should stop in collision
      if (s2.collidedWith === s) {
        continue;
      }
      // Don't collide with the parent or child
      if (s.parent === s2 || s2.parent === s) {
        continue;
      }
      // Check the collision
      if (s.crosses(s2)) {
        s.collidedWith = s2;
        deactivate = true;
      }
    }
    for (s2 of inactiveStreets) {
      // Don't collide with itself
      if (s === s2) {
        continue;
      }
      // Only one line should stop in collision
      if (s2.collidedWith === s) {
        continue;
      }
      // Don't collide with the parent or child
      if (s.parent === s2 || s2.parent === s) {
        continue;
      }
      // Check the collision
      if (s.crosses(s2)) {
        s.collidedWith = s2;
        deactivate = true;
      }
    }

    if (deactivate) {
      deactivated.push(s);
    } else {
      stillActive.push(s);
    }
  }

  activeStreets = stillActive.concat(spawned);
  inactiveStreets = inactiveStreets.concat(deactivated);
}
