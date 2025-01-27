let params = {
  color: "#FFF",
  particleNum: 0,
};

const START_NUM_P = 100;
const TOTAL_NUM_OF_P = 3000;
const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 900;
let pointCloud;
let particles = [];


//----------------------------------------------------
function setupThree() {
  pointCloud = getPoints(TOTAL_NUM_OF_P);
  scene.add(pointCloud);

  for (let i = 0; i < START_NUM_P; i++) {
    p = new Particle()
      .setCen(0, 0, 0)
      .setR(200)
      .setPos()
      .setVelMag(random(3, 5));
    p.updateVel();
    particles.push(p);
  }

}

//----------------------------------------------------
function updateThree() {
  for (const p of particles) {
    p.attractedTo(0, 0, 0);
    p.updateVel();
    p.update();
  }

  // remove
  for (let i = 0; i < particles.length; i++) {
    let p = particles[i];
    if (p.isDone) {
      particles.splice(i, 1);
      i--;
    }
  }
  while (particles.length > TOTAL_NUM_OF_P) {
    particles.splice(0, 1);
  }


  // update the individual points
  let positionArray = pointCloud.geometry.attributes.position.array;
  let colorArray = pointCloud.geometry.attributes.color.array;
  for (let i = 0; i < particles.length; i++) {
    let p = particles[i];
    let ptIndex = i * 3;
    // position
    positionArray[ptIndex + 0] = p.pos.x;
    positionArray[ptIndex + 1] = p.pos.y;
    positionArray[ptIndex + 2] = p.pos.z;
    // color
    colorArray[ptIndex + 0] = p.color.r;
    colorArray[ptIndex + 1] = p.color.g;
    colorArray[ptIndex + 2] = p.color.b;
  }

  // update on GPU
  pointCloud.geometry.setDrawRange(0, particles.length);
  pointCloud.geometry.attributes.position.needsUpdate = true; // ***
  pointCloud.geometry.attributes.color.needsUpdate = true; // ***
}


//----------------------------------------------------
function getPoints(maxNum) {
  const vertices = new Float32Array(maxNum * 3); // x, y, z
  const colors = new Float32Array(maxNum * 3); // r, g, b

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    // color: 0xFFFF00,
    vertexColors: true,

    transparent: true,
    opacity: 0.9,

    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, material);
  return points;
}

//----------------------------------------------------
class Particle {
  constructor() {
    this.pos = createVector();
    this.vel = createVector();
    this.acc = createVector();
    //
    this.cen = createVector();
    this.mass = 1;
    //
    this.color = {
      r: random(0.8, 1.0),
      g: random(0.8, 1.0),
      b: random(0.8, 1.0)
    };
    //
    this.lifespan = 1.0; // 100%
    this.lifeReduction = random(0.005, 0.01);
    this.isDone = false;
  }

  setCen(x, y, z) {
    this.cen = createVector(x, y, z);
    return this;
  }

  setR(val) {
    this.startR = val;
    return this;
  }

  setVelMag(val) {
    this.vel_mag = val;
    return this;
  }

  setPos() {
    let angle = radians(random(360));
    this.pos = createVector(sin(angle) * random(this.startR, this.startR + 300), cos(angle) * random(this.startR, this.startR + 300), 0);
    // this.pos = createVector(random(- WORLD_WIDTH / 2, WORLD_WIDTH / 2), random(-WORLD_HEIGHT / 2, WORLD_HEIGHT / 2), 0);
    return this;
  }

  updateVel() {
    this.vel = p5.Vector.sub(this.cen, this.pos);
    this.vel.rotate(HALF_PI);
    this.vel.normalize();
    this.vel.mult(this.vel_mag);
    // console.log(this.vel)
  }

  attractedTo() {
    let dist = this.pos.dist(this.cen);
    let acc_mag = (this.vel.mag() * this.vel.mag()) / dist;
    let force = p5.Vector.sub(this.pos, this.cen);
    force.normalize;
    force.mult(acc_mag);
    force.mult(2);
    this.applyForce(force);
  }

  updateLifespan() {
    if (this.lifespan > 0) {
      this.lifespan -= this.lifeReduction;
    } else {
      this.lifespan = 0;
      this.isDone = true;
    }
  }

  applyForce(f) {
    let force = f.copy();
    force.div(this.mass);
    // console.log(this.acc);
    // console.log(force);
    this.acc.add(force);
    // console.log(this.acc);
  }

  circlularMovement(x, y, z, R, r) {
    let center = createVector(x, y, z);
    let force = p5.Vector.sub(this.pos, center);
    force.normalize();
    let mag_attraction = (this.pos.dist(center) - r) / (R - r);
    let mag_repulsion = (R - this.pos.dist(center)) / (R - r);
    let magnitude = mag_repulsion - mag_attraction;
    force.mult(magnitude);
    force.mult(0.05);
    this.applyForce(force);
  }

  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }
}