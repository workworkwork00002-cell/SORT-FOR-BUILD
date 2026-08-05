import * as THREE from "three";
import { box, cone, cyl, put, sph } from "../core/geometry";
import { volcano } from "./builders/antique";


/* ============================================================
   ЖИВОЙ МИР: пешеходы, транспорт, птицы, дым
   ============================================================ */

const SHIRTS = [0xd94f4f, 0x4f7f9e, 0xf2c144, 0x6aa85a, 0xa96bd4, 0xe8746a, 0x5fb4d8];
const PANTS = [0x3f4a5c, 0x5c4a3f, 0x44484c, 0x6b5b4a];
const SKINS = [0xf0c9a0, 0xd9a878, 0xa87850, 0x7a5638];

/* человечек с шарнирными ногами и руками */
export function makePerson() {
  const g = new THREE.Group();
  const shirt = SHIRTS[(Math.random() * SHIRTS.length) | 0];
  const pants = PANTS[(Math.random() * PANTS.length) | 0];
  const skin = SKINS[(Math.random() * SKINS.length) | 0];

  // ноги на шарнирах (вращаем группу — нога качается от бедра)
  const hips = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(s * 0.075, 0.46, 0);
    const leg = box(0.12, 0.46, 0.13, pants);
    hip.add(put(leg, 0, -0.23, 0));
    const shoe = box(0.13, 0.08, 0.2, 0x3a3226);
    hip.add(put(shoe, 0, -0.48, 0.03));
    g.add(hip);
    hips.push(hip);
  }

  const body = box(0.3, 0.42, 0.19, shirt);
  g.add(put(body, 0, 0.67, 0));

  // руки на шарнирах
  const arms = [];
  for (const s of [-1, 1]) {
    const sh = new THREE.Group();
    sh.position.set(s * 0.19, 0.85, 0);
    const arm = box(0.09, 0.38, 0.1, shirt);
    sh.add(put(arm, 0, -0.19, 0));
    const hand = sph(0.055, skin);
    sh.add(put(hand, 0, -0.4, 0));
    g.add(sh);
    arms.push(sh);
  }

  const neck = box(0.1, 0.06, 0.1, skin);
  g.add(put(neck, 0, 0.91, 0));
  const head = sph(0.14, skin);
  g.add(put(head, 0, 1.04, 0));
  // волосы / шапка
  const hair = box(0.26, 0.11, 0.24, PANTS[(Math.random() * PANTS.length) | 0]);
  g.add(put(hair, 0, 1.12, -0.01));

  g.userData = { hips, arms, phase: Math.random() * 6.28 };
  return g;
}

/* машинка */
export function makeCar() {
  const g = new THREE.Group();
  const col = [0xd94f4f, 0x4f7f9e, 0xf2c144, 0x6aa85a, 0xf0f0f0, 0x44484c][(Math.random() * 6) | 0];

  const body = box(0.92, 0.42, 1.95, col);
  g.add(put(body, 0, 0.42, 0));
  const cabin = box(0.8, 0.38, 1.0, col);
  g.add(put(cabin, 0, 0.8, -0.12));
  // стёкла
  g.add(put(box(0.72, 0.28, 0.06, 0xcfe4ec, { transparent: true, opacity: 0.75 }), 0, 0.82, 0.36));
  g.add(put(box(0.72, 0.28, 0.06, 0xcfe4ec, { transparent: true, opacity: 0.75 }), 0, 0.82, -0.62));
  for (const s of [-1, 1]) {
    g.add(put(box(0.06, 0.26, 0.85, 0xcfe4ec, { transparent: true, opacity: 0.7 }), s * 0.4, 0.82, -0.12));
  }
  // фары
  for (const s of [-1, 1]) {
    const hl = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.12, 0.06),
      new THREE.MeshStandardMaterial({ color: 0xfff3d0, emissive: 0xffd98a, emissiveIntensity: 0.9, flatShading: true })
    );
    hl.position.set(s * 0.28, 0.45, 0.99);
    g.add(hl);
    g.add(put(box(0.18, 0.1, 0.05, 0xd94a3a), s * 0.28, 0.45, -0.99));
  }

  // колёса: группа задаёт ось, меш крутится вокруг своей оси
  const wheels = [];
  for (const [wx, wz] of [[-0.47, 0.62], [0.47, 0.62], [-0.47, -0.62], [0.47, -0.62]]) {
    const pivot = new THREE.Group();
    pivot.position.set(wx, 0.23, wz);
    pivot.rotation.z = Math.PI / 2;
    const w = cyl(0.23, 0.23, 0.15, 8, 0x2e3236);
    pivot.add(w);
    g.add(pivot);
    wheels.push(w);
  }
  g.userData = { wheels };
  return g;
}

/* птица с машущими крыльями */
export function makeBird(color) {
  const g = new THREE.Group();
  const body = sph(0.13, color);
  body.scale.set(1, 0.8, 1.5);
  g.add(put(body, 0, 0, 0));
  const head = sph(0.085, color);
  g.add(put(head, 0, 0.06, 0.17));
  const beak = cone(0.04, 0.11, 5, 0xe0a83c);
  beak.rotation.x = Math.PI / 2;
  g.add(put(beak, 0, 0.05, 0.28));
  const tail = cone(0.1, 0.22, 4, color);
  tail.rotation.x = -Math.PI / 2;
  g.add(put(tail, 0, 0.02, -0.24));

  const wings = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.08, 0.05, 0);
    const w = box(0.46, 0.035, 0.24, color);
    pivot.add(put(w, s * 0.25, 0, 0));
    g.add(pivot);
    wings.push({ pivot, side: s });
  }
  g.userData = { wings, phase: Math.random() * 6.28 };
  return g;
}

/* клубы дыма над трубой */
export function makeSmoke(x, y, z) {
  const g = new THREE.Group();
  const puffs = [];
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.22, 0),
      new THREE.MeshStandardMaterial({ color: 0xf2f2f2, transparent: true, opacity: 0.5, flatShading: true })
    );
    m.position.set(0, 0, 0);
    g.add(m);
    puffs.push({ mesh: m, life: i / 6 });
  }
  g.position.set(x, y, z);
  g.userData = { puffs };
  return g;
}

/* сколько и какой живности в каждом мире */
export const LIFE_CFG = {
  village: {
    walkR: 7.4, people: 6, birds: 5, birdColor: 0x5a4a3a,
    lanes: [], smoke: [[1.5, 4.0, -4.2]],
  },
  town: {
    walkR: 8.0, people: 8, birds: 4, birdColor: 0x4a4a52,
    lanes: [[-1.25, 1], [1.25, -1]], smoke: [],
  },
  city: {
    walkR: 8.6, people: 10, birds: 3, birdColor: 0x55585e,
    lanes: [[-2.9, 1], [-1.15, 1], [1.15, -1], [2.9, -1]], smoke: [],
  },
  resort: {
    walkR: 7.2, people: 6, birds: 6, birdColor: 0xf5f5f5,
    lanes: [], smoke: [],
  },
  winter: {
    walkR: 7.6, people: 6, birds: 3, birdColor: 0x6a5a4a,
    lanes: [], smoke: [[1.5, 4.2, -4.2]],
  },
  night: {
    walkR: 9.0, people: 9, birds: 2, birdColor: 0x3a4050,
    lanes: [[-2.9, 1], [-1.15, 1], [1.15, -1], [2.9, -1]], smoke: [],
  },
  airport: {
    walkR: 9.4, people: 9, birds: 4, birdColor: 0xf0f0f0,
    lanes: [[-4.6, 1], [4.6, -1]], smoke: [],
  },
  desert: {
    walkR: 7.8, people: 5, birds: 3, birdColor: 0x8a6a4a,
    lanes: [], smoke: [],
  },
  park: {
    walkR: 8.6, people: 11, birds: 5, birdColor: 0x5a5a4a,
    lanes: [], smoke: [],
  },
  castle: {
    walkR: 8.2, people: 8, birds: 4, birdColor: 0x3a3a44,
    lanes: [], smoke: [],
  },
  sakura: {
    walkR: 7.8, people: 7, birds: 5, birdColor: 0xe8a0c0,
    lanes: [], smoke: [],
  },
  sea: {
    walkR: 8.4, people: 6, birds: 8, birdColor: 0x7fd8e8,
    lanes: [], smoke: [],
  },
  music: {
    walkR: 8.4, people: 11, birds: 4, birdColor: 0xc47fb4,
    lanes: [], smoke: [],
  },
  pottery: {
    walkR: 8.0, people: 8, birds: 4, birdColor: 0xa8764a,
    lanes: [], smoke: [],
  },
  bee: {
    walkR: 8.0, people: 7, birds: 7, birdColor: 0xe8c04a,
    lanes: [], smoke: [],
  },
  star: {
    walkR: 8.6, people: 6, birds: 2, birdColor: 0x6a7a9e,
    lanes: [], smoke: [],
  },
  art: {
    walkR: 8.4, people: 11, birds: 4, birdColor: 0xd4749a,
    lanes: [], smoke: [],
  },
  ski: {
    walkR: 8.2, people: 8, birds: 3, birdColor: 0xdfe8ee,
    lanes: [], smoke: [],
  },
  tea: {
    walkR: 8.0, people: 7, birds: 5, birdColor: 0x8faa5a,
    lanes: [], smoke: [],
  },
  clock: {
    walkR: 8.4, people: 10, birds: 4, birdColor: 0x8a8278,
    lanes: [], smoke: [],
  },
  circus: {
    walkR: 8.6, people: 11, birds: 4, birdColor: 0x5a5a4a,
    lanes: [], smoke: [],
  },
  shroom: {
    walkR: 7.8, people: 6, birds: 4, birdColor: 0x8f7fd4,
    lanes: [], smoke: [],
  },
  pirate: {
    walkR: 8.4, people: 8, birds: 6, birdColor: 0xf0f0f0,
    lanes: [], smoke: [],
  },
  mine: {
    walkR: 8.2, people: 7, birds: 3, birdColor: 0x5a5450,
    lanes: [], smoke: [],
  },
  jungle: {
    walkR: 8.0, people: 7, birds: 6, birdColor: 0x3fbf5a,
    lanes: [], smoke: [],
  },
  space: {
    walkR: 9.0, people: 8, birds: 2, birdColor: 0xd8d8d8,
    lanes: [], smoke: [],
  },
  harbor: {
    walkR: 8.8, people: 9, birds: 6, birdColor: 0xf0f0f0,
    lanes: [], smoke: [],
  },
  antique: {
    walkR: 8.4, people: 9, birds: 4, birdColor: 0xd8d0c0,
    lanes: [], smoke: [],
  },
  volcano: {
    walkR: 8.0, people: 5, birds: 3, birdColor: 0x4a4050,
    lanes: [], smoke: [],
  },
  railway: {
    walkR: 8.6, people: 9, birds: 4, birdColor: 0x5a5a4a,
    lanes: [], smoke: [],
  },
};

/* у каких построек есть вход, куда заходят человечки */
export const DOOR_KEYS = new Set([
  "house", "greenhouse", "coop", "cottages", "shop", "cafe",
  "offices", "skyscraper", "mall", "metro", "hotel", "bar",
]);
