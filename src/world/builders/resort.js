import * as THREE from "three";
import { C, box, cone, cyl, mat, put, sph } from "../../core/geometry";


/* ============================================================
   ПОСТРОЙКИ: КУРОРТ
   ============================================================ */

const SAND = 0xffe0a0;
const SEA = 0x00d4f5;

/* пляж: песчаная полоса и кромка воды */
export function buildBeach(store) {
  const g = new THREE.Group();
  const strip = new THREE.Mesh(new THREE.CylinderGeometry(9.6, 9.6, 0.3, 24, 1, false, 0, Math.PI), mat(SAND));
  strip.receiveShadow = true;
  g.add(put(strip, 0, 0.16, 0));
  // кромка воды
  const surf = new THREE.Mesh(
    new THREE.CylinderGeometry(9.9, 9.9, 0.24, 24, 1, false, 0, Math.PI),
    mat(0xa8e0e8, { transparent: true, opacity: 0.75, roughness: 0.15, flatShading: false })
  );
  g.add(put(surf, 0, 0.14, 0.5));
  store.surf = surf;
  // камни и ракушки
  for (let i = 0; i < 10; i++) {
    const a = Math.random() * Math.PI;
    const r = 5 + Math.random() * 4;
    g.add(put(sph(0.14 + Math.random() * 0.12, i % 2 ? 0xd8c9a8 : 0xc9b894), Math.cos(a) * r, 0.3, Math.sin(a) * r));
  }
  return g;
}

/* пальмовая роща */
export function palm(scale = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const seg = cyl(0.16 - i * 0.012, 0.2 - i * 0.012, 0.62, 7, 0xb58a55);
    seg.position.set(Math.sin(i * 0.35) * 0.22, 0.3 + i * 0.6, 0);
    seg.rotation.z = -Math.cos(i * 0.35) * 0.1;
    trunk.add(seg);
  }
  g.add(trunk);
  const top = 0.3 + 6 * 0.6;
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const frond = box(2.0, 0.1, 0.55, i % 2 ? C.leaf : C.leafLight);
    frond.position.set(Math.sin(5 * 0.35) * 0.22 + Math.cos(a) * 0.95, top + 0.1, Math.sin(a) * 0.95);
    frond.rotation.y = -a;
    frond.rotation.z = 0.25;
    g.add(frond);
  }
  for (let i = 0; i < 3; i++) {
    g.add(put(sph(0.15, 0x8a6a3c), Math.sin(5 * 0.35) * 0.22 + Math.cos(i * 2) * 0.3, top - 0.15, Math.sin(i * 2) * 0.3));
  }
  g.scale.setScalar(scale);
  return g;
}

export function buildPalms() {
  const g = new THREE.Group();
  [[0, 0, 1.0], [2.4, 1.6, 0.8], [-2.0, 1.2, 0.9], [0.8, -2.2, 0.75]].forEach(([x, z, s]) => {
    const p = palm(s);
    p.position.set(x, 0, z);
    p.rotation.y = Math.random() * Math.PI;
    g.add(p);
  });
  return g;
}

/* пирс на сваях */
export function buildPier() {
  const g = new THREE.Group();
  const len = 9;
  for (let i = 0; i < len; i++) {
    const plank = box(2.4, 0.16, 0.9, i % 2 ? C.wood : 0xa5713f);
    g.add(put(plank, 0, 0.7, i * 1.0));
    if (i % 2 === 0) {
      for (const x of [-1.0, 1.0]) {
        g.add(put(cyl(0.13, 0.15, 1.6, 7, C.woodDark), x, 0.0, i * 1.0));
      }
    }
  }
  // перила
  for (const x of [-1.15, 1.15]) {
    for (let i = 0; i < len; i += 2) {
      g.add(put(box(0.1, 0.8, 0.1, C.woodDark), x, 1.15, i * 1.0));
    }
    g.add(put(box(0.08, 0.1, len * 1.0, C.woodDark), x, 1.5, (len - 1) * 0.5));
  }
  // фонарь на конце
  g.add(put(cyl(0.08, 0.1, 1.8, 6, C.woodDark), 0.9, 1.6, (len - 1) * 1.0));
  const lamp = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.2, 0),
    new THREE.MeshStandardMaterial({ color: 0xffe9b8, emissive: 0xffc46b, emissiveIntensity: 1.1, flatShading: true })
  );
  lamp.position.set(0.9, 2.55, (len - 1) * 1.0);
  g.add(lamp);
  return g;
}

/* отель */
export function buildHotel(store) {
  const g = new THREE.Group();
  const body = box(5.6, 4.2, 3.4, 0xf6ecd8);
  g.add(put(body, 0, 2.1, 0));
  // балконы по этажам
  for (let f = 0; f < 3; f++) {
    const y = 1.0 + f * 1.25;
    g.add(put(box(5.9, 0.14, 0.6, 0xe0d2b8), 0, y, 1.85));
    for (let i = -2; i <= 2; i++) {
      g.add(put(box(0.9, 0.9, 0.1, 0x8fd0e6, { transparent: true, opacity: 0.65 }), i * 1.1, y + 0.55, 1.72));
      g.add(put(box(1.0, 0.4, 0.06, 0xd8c9a8), i * 1.1, y + 0.25, 2.12));
    }
  }
  // крыша с террасой
  g.add(put(box(5.9, 0.22, 3.7, 0xd8c9a8), 0, 4.3, 0));
  for (const x of [-2.6, 2.6]) g.add(put(box(0.2, 0.5, 3.5, 0xe6dcc4), x, 4.6, 0));
  // зонтики на крыше
  for (const x of [-1.4, 1.4]) {
    g.add(put(cyl(0.05, 0.05, 1.0, 6, 0x8a6a4a), x, 4.9, 0.6));
    g.add(put(cone(0.75, 0.45, 8, x > 0 ? 0xe8746a : 0x5fb4d8), x, 5.55, 0.6));
  }
  // вход
  g.add(put(box(2.0, 1.6, 0.14, 0x9fd7e6, { transparent: true, opacity: 0.7 }), 0, 0.8, 1.74));
  const canopy = box(2.8, 0.16, 1.2, 0xe8746a);
  g.add(put(canopy, 0, 1.9, 2.2));
  for (const x of [-1.2, 1.2]) g.add(put(cyl(0.08, 0.08, 1.9, 6, 0xd8c9a8), x, 0.95, 2.7));
  return g;
}

/* бассейн */
export function buildPool(store) {
  const g = new THREE.Group();
  const deck = box(6.0, 0.24, 4.4, 0xf0e6d2);
  g.add(put(deck, 0, 0.16, 0));
  const hole = box(4.2, 0.5, 2.8, 0x9fd7e6);
  g.add(put(hole, 0, 0.06, 0));
  const water = new THREE.Mesh(
    new THREE.BoxGeometry(4.0, 0.3, 2.6),
    mat(0x4fc3d9, { roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.88, flatShading: false })
  );
  g.add(put(water, 0, 0.22, 0));
  store.poolWater = water;
  // бортик
  for (const [w, d, x, z] of [[4.6, 0.3, 0, 1.55], [4.6, 0.3, 0, -1.55], [0.3, 3.4, 2.35, 0], [0.3, 3.4, -2.35, 0]]) {
    g.add(put(box(w, 0.16, d, 0xfaf3e4), x, 0.32, z));
  }
  // лежаки
  [[-2.0, 2.6], [-0.4, 2.6], [1.2, 2.6]].forEach(([x, z], i) => {
    const l = new THREE.Group();
    l.add(put(box(0.7, 0.12, 1.6, 0xfaf3e4), 0, 0.4, 0));
    const back = box(0.7, 0.12, 0.7, 0xfaf3e4);
    back.rotation.x = -0.6;
    l.add(put(back, 0, 0.62, -0.75));
    for (const [lx, lz] of [[-0.28, 0.6], [0.28, 0.6], [-0.28, -0.6], [0.28, -0.6]]) {
      l.add(put(box(0.08, 0.32, 0.08, 0xd8c9a8), lx, 0.2, lz));
    }
    l.add(put(box(0.5, 0.06, 0.9, i % 2 ? 0x5fb4d8 : 0xe8746a), 0, 0.47, 0.1));
    l.position.set(x, 0.16, z);
    g.add(l);
  });
  // лесенка
  for (const x of [-0.5, 0.5]) {
    g.add(put(cyl(0.05, 0.05, 0.8, 6, 0xc9d6dc), x, 0.55, -1.5));
  }
  return g;
}

/* лодки у берега */
export function buildBoats(store) {
  const g = new THREE.Group();
  const boats = [];
  [[0, 0, 0x5fb4d8, 0.0], [2.6, 1.4, 0xe8746a, 0.6], [-2.2, 1.8, 0xf2c144, -0.4]].forEach(([x, z, col, rot]) => {
    const b = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(col));
    hull.scale.set(1, 0.5, 2.0);
    hull.castShadow = true;
    b.add(put(hull, 0, 0.4, 0));
    b.add(put(box(1.5, 0.1, 0.5, 0xf0e6d2), 0, 0.42, 0));
    b.add(put(cyl(0.06, 0.06, 2.4, 6, 0xd8c9a8), 0, 1.5, 0));
    // парус
    const sail = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.8, 3), mat(0xfaf3e4));
    sail.rotation.y = Math.PI / 4;
    sail.scale.set(1, 1, 0.25);
    b.add(put(sail, 0.25, 1.7, 0));
    b.position.set(x, 0.1, z);
    b.rotation.y = rot;
    b.userData.phase = Math.random() * 6;
    g.add(b);
    boats.push(b);
  });
  store.boats = boats;
  return g;
}

/* зонтики и шезлонги на песке */
export function buildUmbrellas() {
  const g = new THREE.Group();
  [[0, 0, 0xe8746a], [2.8, 1.2, 0x5fb4d8], [-2.6, 0.9, 0xf2c144]].forEach(([x, z, col]) => {
    const u = new THREE.Group();
    u.add(put(cyl(0.06, 0.06, 2.4, 6, 0xd8c9a8), 0, 1.2, 0));
    const top = cone(1.3, 0.7, 8, col);
    u.add(put(top, 0, 2.5, 0));
    u.add(put(sph(0.1, 0xd8c9a8), 0, 2.9, 0));
    // полотенце
    u.add(put(box(1.0, 0.06, 1.8, 0xfaf3e4), 0.9, 0.06, 0.4));
    u.position.set(x, 0, z);
    u.rotation.y = Math.random();
    g.add(u);
  });
  return g;
}

/* пляжный бар */
export function buildBeachBar() {
  const g = new THREE.Group();
  const counter = box(3.4, 1.1, 1.2, 0xb58a55);
  g.add(put(counter, 0, 0.55, 0));
  g.add(put(box(3.7, 0.14, 1.5, 0xd8c9a8), 0, 1.18, 0));
  // соломенная крыша
  for (const x of [-1.5, 1.5]) {
    g.add(put(cyl(0.11, 0.13, 2.6, 6, 0x8a6a4a), x, 1.3, -0.6));
    g.add(put(cyl(0.11, 0.13, 2.6, 6, 0x8a6a4a), x, 1.3, 1.0));
  }
  const thatch = cone(2.9, 1.3, 4, 0xd0a94a);
  thatch.rotation.y = Math.PI / 4;
  g.add(put(thatch, 0, 3.2, 0.2));
  const thatch2 = cone(2.4, 0.9, 4, 0xc39a3e);
  thatch2.rotation.y = Math.PI / 4;
  g.add(put(thatch2, 0, 3.75, 0.2));
  // табуреты
  for (const x of [-1.0, 0, 1.0]) {
    g.add(put(cyl(0.28, 0.24, 0.7, 8, 0xd8c9a8), x, 0.35, 1.5));
  }
  // бутылки на стойке
  const cols = [0x6aa85a, 0xd94f4f, 0xf2c144, 0x5fb4d8];
  for (let i = 0; i < 4; i++) {
    g.add(put(cyl(0.07, 0.09, 0.35, 6, cols[i]), -1.2 + i * 0.5, 1.4, -0.3));
  }
  return g;
}

/* маяк */
export function buildLighthouse(store) {
  const g = new THREE.Group();
  const base = cyl(1.3, 1.6, 0.9, 12, 0xc9c2b4);
  g.add(put(base, 0, 0.45, 0));
  const tower = cyl(0.75, 1.15, 5.4, 12, 0xfaf3e4);
  g.add(put(tower, 0, 3.6, 0));
  // красные полосы
  for (const y of [1.6, 3.4, 5.2]) {
    const r = 1.15 - ((y - 0.9) / 5.4) * 0.4;
    g.add(put(cyl(r + 0.02, r + 0.06, 0.55, 12, 0xd94f4f), 0, y, 0));
  }
  g.add(put(cyl(1.15, 1.15, 0.16, 12, 0x6b7075), 0, 6.4, 0));
  // фонарная комната
  const lantern = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 0.65, 1.0, 10),
    mat(0xfff0c4, { emissive: 0xffc46b, emissiveIntensity: 0.9, transparent: true, opacity: 0.85, flatShading: false })
  );
  g.add(put(lantern, 0, 7.0, 0));
  store.beaconLight = lantern;
  g.add(put(cone(0.9, 0.7, 10, 0x44484c), 0, 7.85, 0));
  g.add(put(sph(0.12, 0x8d949a), 0, 8.3, 0));
  const pl = new THREE.PointLight(0xffc46b, 0.8, 12);
  pl.position.set(0, 7.0, 0);
  g.add(pl);
  store.beaconPointLight = pl;
  return g;
}

/* ============================================================
   МАТЕРИАЛЫ (общий словарь для всех миров)
   ============================================================ */
export const M = {
  stone: { e: "🪨", c: "#9a8f80" },
  brick: { e: "🧱", c: "#c06a4a" },
  sand: { e: "🪣", c: "#d9b56a" },
  hammer: { e: "🔨", c: "#8a6a4a" },
  ruler: { e: "📏", c: "#6a94c0" },
  gloves: { e: "🧤", c: "#c9a05a" },
  plank: { e: "🪵", c: "#a5713f" },
  bolt: { e: "🔩", c: "#5f7391" },
  saw: { e: "🪚", c: "#8fc4d4" },
  paint: { e: "🎨", c: "#c05a7a" },
  seed: { e: "🌱", c: "#67b25a" },
  nut: { e: "🌰", c: "#a06a3c" },
  sprout: { e: "🪴", c: "#7a9c55" },
  water: { e: "💧", c: "#5aa8d4" },
  basket: { e: "🧺", c: "#c4a165" },
  worm: { e: "🪱", c: "#c07a86" },
  glass: { e: "🪟", c: "#7fc4d8" },
  plan: { e: "📐", c: "#6a8ec0" },
  screw: { e: "🪛", c: "#9a8a5a" },
  toolbox: { e: "🧰", c: "#c0693f" },
  rope: { e: "🧵", c: "#c4a165" },
  chain: { e: "⛓️", c: "#45494f" },
  door: { e: "🚪", c: "#8a5a37" },
  ladder: { e: "🪜", c: "#b58a4a" },
  tree: { e: "🌳", c: "#5f9e4f" },
  shears: { e: "✂️", c: "#cdd8e2" },
  apple: { e: "🍎", c: "#e03c3c" },
  egg: { e: "🥚", c: "#d8c9a8" },
  straw: { e: "🌾", c: "#d0a94a" },
  fish: { e: "🐟", c: "#2f6fb0" },
  lotus: { e: "🪷", c: "#e89fc4" },
  algae: { e: "🌿", c: "#6aa85a" },
  gear: { e: "⚙️", c: "#d4a838" },
  bulb: { e: "💡", c: "#e0b545" },
  wire: { e: "🔌", c: "#a04e28" },
  candle: { e: "🕯️", c: "#f2e4b0" },
  torch: { e: "🔦", c: "#6a94c0" },
  gem: { e: "💎", c: "#6fd4c4" },
  bamboo: { e: "🎋", c: "#8fc44a" },
  log: { e: "🪓", c: "#8a5f3a" },
  paper: { e: "📄", c: "#f0e8d4" },
  spark: { e: "✨", c: "#d4a85a" },
  gold: { e: "🏺", c: "#c9a05a" },
  // город и посёлок
  cone: { e: "🚧", c: "#d98a3c" },
  crane: { e: "🏗️", c: "#e0a83c" },
  sign: { e: "🚦", c: "#5aa85a" },
  cement: { e: "🛢️", c: "#2f9ff0" },
  pipe: { e: "🚰", c: "#6a94c0" },
  key: { e: "🔑", c: "#d0a83c" },
  cart: { e: "🛒", c: "#3f8f7a" },
  cup: { e: "☕", c: "#8a5a37" },
  bench: { e: "🪑", c: "#a5713f" },
  ball: { e: "⚽", c: "#eeeeea" },
  bus: { e: "🚌", c: "#d98a3c" },
  car: { e: "🚗", c: "#c05050" },
  tram: { e: "🚋", c: "#5aa8d4" },
  lift: { e: "🛗", c: "#8fa2b4" },
  bag: { e: "🛍️", c: "#d4789e" },
  clock: { e: "🕐", c: "#e8dcc0" },
  // курорт
  shell: { e: "🐚", c: "#e0b8a8" },
  palm: { e: "🌴", c: "#5f9e4f" },
  boat: { e: "⛵", c: "#5fb4d8" },
  umbrella: { e: "⛱️", c: "#e8746a" },
  buoy: { e: "🛟", c: "#e05050" },
  anchor: { e: "⚓", c: "#3f5570" },
  drink: { e: "🍹", c: "#c44f8f" },
  towel: { e: "🧻", c: "#d8c9a8" },
  wave: { e: "🌊", c: "#3fb0c8" },
  sun: { e: "🌞", c: "#e0b545" },
};

export const it = (...keys) => keys.map((k) => M[k]);

