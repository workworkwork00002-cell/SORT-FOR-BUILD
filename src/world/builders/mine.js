import * as THREE from "three";
import { C, box, cone, cyl, mat, put, sph } from "../../core/geometry";


/* ============================================================
   ПОСТРОЙКИ: ШАХТЁРСКИЙ ПОСЁЛОК
   ============================================================ */

const ORE_ROCK = 0x6e6a66;
const ORE_DARK = 0x4a4744;

/* вход в шахту с крепью */
export function mineEntrance(store) {
  const g = new THREE.Group();
  // склон породы
  const hill = cone(4.2, 3.4, 10, ORE_ROCK);
  hill.scale.set(1, 0.75, 0.8);
  g.add(put(hill, 0, 1.2, -1.4));
  // портал
  g.add(put(box(2.6, 0.35, 0.4, C.wood), 0, 2.2, 0.7));
  for (const s of [-1, 1]) {
    g.add(put(box(0.32, 2.2, 0.36, C.wood), s * 1.15, 1.1, 0.7));
    g.add(put(box(0.5, 0.2, 0.3, C.woodDark), s * 1.05, 2.0, 0.72));
  }
  // тьма в проёме
  const dark = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 2.0),
    new THREE.MeshBasicMaterial({ color: 0x14100e })
  );
  g.add(put(dark, 0, 1.0, 0.55));
  // фонарь над входом
  const lamp = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.2, 0),
    new THREE.MeshStandardMaterial({
      color: 0xffd98a, emissive: 0xffb545, emissiveIntensity: 1.2, flatShading: true,
    })
  );
  lamp.position.set(0, 2.6, 0.75);
  g.add(lamp);
  const pl = new THREE.PointLight(0xffb545, 0.7, 7);
  pl.position.set(0, 2.4, 1.2);
  g.add(pl);
  // рельсы наружу
  for (let z = 1.2; z < 4.2; z += 0.55) {
    g.add(put(box(1.5, 0.08, 0.18, C.woodDark), 0, 0.05, z));
  }
  for (const x of [-0.5, 0.5]) g.add(put(box(0.1, 0.12, 3.2, 0x9aa2a8), x, 0.12, 2.7));
  store.mineLamps = [...(store.mineLamps || []), lamp];
  return g;
}

/* вагонетка с рудой */
export function oreCart() {
  const g = new THREE.Group();
  g.add(put(box(1.2, 0.7, 0.9, 0x7a5a3c), 0, 0.62, 0));
  g.add(put(box(1.24, 0.1, 0.94, 0x5f4530), 0, 0.98, 0));
  // руда горкой
  for (const [x, y, z, r] of [[0, 1.05, 0, 0.24], [0.3, 1.02, 0.18, 0.18], [-0.28, 1.0, -0.15, 0.2]]) {
    const ore = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), mat(ORE_ROCK));
    g.add(put(ore, x, y, z));
    g.add(put(sph(r * 0.4, 0xd8b45a), x + r * 0.5, y + r * 0.4, z));
  }
  // колёса и рама
  g.add(put(box(1.1, 0.16, 0.16, 0x55595e), 0, 0.24, 0));
  for (const [wx, wz] of [[-0.42, 0.42], [0.42, 0.42], [-0.42, -0.42], [0.42, -0.42]]) {
    const w = cyl(0.2, 0.2, 0.1, 12, 0x33373a);
    w.rotation.z = Math.PI / 2;
    g.add(put(w, wx, 0.2, wz));
  }
  return g;
}

/* подъёмная вышка */
export function mineTower(store) {
  const g = new THREE.Group();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const leg = box(0.18, 5.4, 0.18, C.woodDark);
    leg.rotation.z = sx * 0.07;
    leg.rotation.x = sz * 0.07;
    g.add(put(leg, sx * 1.0, 2.7, sz * 1.0));
  }
  for (let y = 1.2; y < 5.2; y += 1.3) {
    for (const s of [-1, 1]) {
      g.add(put(box(2.0, 0.12, 0.12, C.wood), 0, y, s * 0.95));
      g.add(put(box(0.12, 0.12, 2.0, C.wood), s * 0.95, y, 0));
    }
  }
  // колесо подъёмника
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.13, 8, 20), mat(0x8d949a));
  g.add(put(wheel, 0, 5.7, 0));
  for (let i = 0; i < 6; i++) {
    const sp = box(1.8, 0.07, 0.07, 0x6e757c);
    sp.rotation.z = (i / 6) * Math.PI;
    g.add(put(sp, 0, 5.7, 0));
  }
  store.mineWheel = wheel;
  // трос
  g.add(put(cyl(0.03, 0.03, 4.6, 5, 0x55595e), 0.9, 3.4, 0));
  g.add(put(box(0.5, 0.5, 0.5, 0x6e6a66), 0.9, 1.1, 0));
  return g;
}

/* кузня рудокопов */
export function oreForge(store) {
  const g = new THREE.Group();
  g.add(put(box(3.0, 1.9, 2.4, ORE_ROCK), 0, 0.95, 0));
  for (const s of [-1, 1]) {
    const slope = box(2.0, 0.18, 2.8, 0x5a4a3a);
    slope.position.set(s * 0.85, 2.25, 0);
    slope.rotation.z = s * -0.5;
    g.add(slope);
  }
  g.add(put(box(0.6, 1.4, 0.6, ORE_DARK), 1.0, 2.7, -0.6));
  const fire = new THREE.Mesh(
    new THREE.ConeGeometry(0.28, 0.62, 6),
    new THREE.MeshStandardMaterial({
      color: 0xff9a3c, emissive: 0xff5a10, emissiveIntensity: 1.4, flatShading: true,
    })
  );
  fire.position.set(1.0, 3.6, -0.6);
  g.add(fire);
  store.forgeFire = [...(store.forgeFire || []), fire];
  const glow = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 0.8, 0.08),
    new THREE.MeshStandardMaterial({
      color: 0xffb04a, emissive: 0xff7a20, emissiveIntensity: 1.1, flatShading: true,
    })
  );
  glow.position.set(-0.4, 0.85, 1.22);
  g.add(glow);
  const l = new THREE.PointLight(0xff7a2f, 0.7, 7);
  l.position.set(0, 1.6, 1.4);
  g.add(l);
  return g;
}

/* груда руды */
export function orePile() {
  const g = new THREE.Group();
  const base = cone(1.5, 1.1, 10, ORE_DARK);
  g.add(put(base, 0, 0.5, 0));
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const r = 0.4 + Math.random() * 0.7;
    const ore = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2 + Math.random() * 0.12, 0), mat(ORE_ROCK));
    g.add(put(ore, Math.cos(a) * r, 0.75 + Math.random() * 0.35, Math.sin(a) * r));
  }
  // жилы самоцветов
  for (const [x, y, z, c] of [[0.3, 1.0, 0.2, 0xd8b45a], [-0.35, 0.85, -0.25, 0x6fd4c4], [0.1, 1.2, -0.3, 0xd48fd4]]) {
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.16, 0),
      mat(c, { emissive: c, emissiveIntensity: 0.4 })
    );
    g.add(put(gem, x, y, z));
  }
  return g;
}

/* ============================================================
   ПОСТРОЙКИ: ДЖУНГЛИ
   ============================================================ */

const JUNGLE_LEAF = 0x3f9e3a;
const JUNGLE_DARK = 0x2a6f28;

/* хижина на сваях */
export function stiltHut() {
  const g = new THREE.Group();
  for (const [x, z] of [[-1.1, -0.9], [1.1, -0.9], [-1.1, 0.9], [1.1, 0.9]]) {
    g.add(put(cyl(0.13, 0.16, 1.6, 8, C.woodDark), x, 0.8, z));
  }
  g.add(put(box(2.9, 0.2, 2.5, C.wood), 0, 1.7, 0));
  g.add(put(box(2.4, 1.5, 2.0, 0xd8b98a), 0, 2.55, 0));
  // бамбуковые стены
  for (let i = -3; i <= 3; i++) {
    g.add(put(cyl(0.07, 0.07, 1.5, 8, 0xc4a85a), i * 0.33, 2.55, 1.02));
  }
  // соломенная крыша
  const roof = cone(2.3, 1.4, 8, 0xb59a55);
  g.add(put(roof, 0, 4.0, 0));
  const roof2 = cone(1.7, 0.9, 8, 0x9c8244);
  g.add(put(roof2, 0, 4.5, 0));
  // лесенка
  for (let i = 0; i < 4; i++) {
    g.add(put(box(0.8, 0.08, 0.22, C.wood), 0, 0.3 + i * 0.4, 1.5 + i * 0.16));
  }
  // проём
  g.add(put(box(0.7, 1.1, 0.1, 0x3a2a20), 0, 2.35, 1.04));
  return g;
}

/* лианы и пальмы */
export function jungleGrove(store) {
  const g = new THREE.Group();
  const vines = [];
  [[0, 0, 1.0], [2.2, 1.3, 0.8], [-2.0, 1.0, 0.85], [0.8, -2.0, 0.75]].forEach(([x, z, sc]) => {
    const t = new THREE.Group();
    // изогнутый ствол
    for (let i = 0; i < 5; i++) {
      const seg = cyl(0.16 - i * 0.02, 0.18 - i * 0.02, 0.8, 8, 0x6b5230);
      seg.rotation.z = Math.sin(i) * 0.1;
      t.add(put(seg, Math.sin(i * 0.7) * 0.15, 0.4 + i * 0.75, 0));
    }
    // листья веером
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const leaf = box(1.7, 0.09, 0.55, i % 2 ? JUNGLE_LEAF : JUNGLE_DARK);
      leaf.rotation.y = a;
      leaf.rotation.z = -0.42;
      t.add(put(leaf, Math.cos(a) * 0.85, 4.1, Math.sin(a) * 0.85));
    }
    // лиана
    const vine = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      vine.add(put(cyl(0.04, 0.04, 0.42, 5, JUNGLE_DARK), 0, -i * 0.4, 0));
      if (i % 2 === 0) vine.add(put(sph(0.12, JUNGLE_LEAF), 0.1, -i * 0.4, 0));
    }
    vine.position.set(0.7, 3.8, 0.3);
    t.add(vine);
    vines.push(vine);
    t.position.set(x, 0, z);
    t.scale.setScalar(sc);
    g.add(t);
  });
  store.vines = [...(store.vines || []), ...vines];
  return g;
}

/* водопад */
export function waterfall(store) {
  const g = new THREE.Group();
  // уступ
  const rock = cone(2.6, 3.2, 8, 0x7a7268);
  rock.scale.set(1, 1, 0.7);
  g.add(put(rock, 0, 1.4, -1.2));
  g.add(put(box(3.2, 0.5, 1.4, 0x8a8278), 0, 2.7, -0.6));
  // струя
  const fall = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 2.8, 0.22),
    mat(0x7fd8f0, { transparent: true, opacity: 0.72, roughness: 0.05, metalness: 0.25, flatShading: false })
  );
  g.add(put(fall, 0, 1.5, 0.05));
  store.waterFall = fall;
  // чаша внизу
  g.add(put(cyl(2.0, 2.1, 0.3, 16, 0x6a6258), 0, 0.14, 1.1));
  const pool = new THREE.Mesh(
    new THREE.CylinderGeometry(1.8, 1.8, 0.26, 18),
    mat(0x3fb4c8, { roughness: 0.06, metalness: 0.3, transparent: true, opacity: 0.9, flatShading: false })
  );
  g.add(put(pool, 0, 0.26, 1.1));
  store.pondWater = pool;
  // брызги
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.add(put(sph(0.1, 0xdff5ff, { transparent: true, opacity: 0.7 }),
      Math.cos(a) * 1.5, 0.42, 1.1 + Math.sin(a) * 1.5));
  }
  return g;
}

/* каменный идол */
export function jungleIdol() {
  const g = new THREE.Group();
  g.add(put(box(1.6, 0.5, 1.6, 0x7a7268), 0, 0.25, 0));
  g.add(put(box(1.2, 2.2, 1.2, 0x8a8278), 0, 1.6, 0));
  // лицо
  g.add(put(box(1.35, 1.1, 1.35, 0x968d80), 0, 2.9, 0));
  for (const s of [-1, 1]) {
    g.add(put(box(0.26, 0.2, 0.1, 0x3a352e), s * 0.28, 3.05, 0.7));
  }
  g.add(put(box(0.6, 0.16, 0.1, 0x3a352e), 0, 2.68, 0.7));
  // корона
  for (let i = 0; i < 5; i++) {
    g.add(put(cone(0.16, 0.4, 5, 0xd8b45a), -0.5 + i * 0.25, 3.65, 0));
  }
  // мох
  for (const [x, y, z] of [[0.5, 1.2, 0.62], [-0.45, 2.0, 0.6], [0.3, 0.6, -0.6]]) {
    const moss = sph(0.2, JUNGLE_LEAF);
    moss.scale.set(1.4, 0.5, 0.9);
    g.add(put(moss, x, y, z));
  }
  return g;
}

/* ============================================================
   ПОСТРОЙКИ: КОСМОДРОМ
   ============================================================ */

const HULL_W = 0xe8e4dc;
const HULL_D = 0x9aa2ac;

/* стартовый стол с ракетой */
export function launchPad(store) {
  const g = new THREE.Group();
  // площадка
  g.add(put(cyl(3.2, 3.4, 0.4, 16, 0x6e757c), 0, 0.2, 0));
  g.add(put(cyl(2.6, 2.6, 0.1, 16, 0x55595e), 0, 0.44, 0));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.add(put(box(0.3, 0.08, 1.2, 0xe8c43c), Math.cos(a) * 2.9, 0.46, Math.sin(a) * 2.9))
      .rotation.y = -a;
  }
  // ракета
  const rocket = new THREE.Group();
  rocket.add(put(cyl(0.62, 0.62, 4.2, 16, HULL_W), 0, 2.6, 0));
  rocket.add(put(cone(0.62, 1.4, 16, 0xd94f4f), 0, 5.4, 0));
  // полосы
  for (const y of [1.4, 3.6]) {
    rocket.add(put(cyl(0.64, 0.64, 0.24, 16, 0x3f6a9e), 0, y, 0));
  }
  // иллюминатор
  rocket.add(put(cyl(0.22, 0.22, 0.1, 12, 0x8fd0e6, { emissive: 0x2a5a70, emissiveIntensity: 0.5 }), 0, 4.3, 0.6))
    .rotation.x = Math.PI / 2;
  // стабилизаторы
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const fin = box(0.12, 1.3, 0.9, 0xd94f4f);
    fin.rotation.y = a;
    rocket.add(put(fin, Math.cos(a) * 0.62, 1.0, Math.sin(a) * 0.62));
  }
  // сопло
  rocket.add(put(cone(0.5, 0.7, 12, 0x55595e), 0, 0.35, 0));
  rocket.position.y = 0.5;
  g.add(rocket);
  store.rocket = rocket;

  // ферма обслуживания
  for (const sx of [-1, 1]) {
    for (let y = 0; y < 5; y++) {
      g.add(put(box(0.14, 1.1, 0.14, 0xe8a83c), sx * 1.7, 0.9 + y * 1.1, -1.7));
    }
  }
  for (let y = 1; y <= 4; y++) {
    g.add(put(box(3.4, 0.1, 0.1, 0xd09a34), 0, y * 1.1, -1.7));
  }
  return g;
}

/* центр управления */
export function controlCenter() {
  const g = new THREE.Group();
  g.add(put(box(5.6, 2.4, 3.4, HULL_W), 0, 1.2, 0));
  // купол
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    mat(0xc4ccd4, { flatShading: false })
  );
  dome.castShadow = true;
  g.add(put(dome, 1.5, 2.4, 0));
  // остекление
  for (let i = -3; i <= 3; i++) {
    g.add(put(box(0.6, 1.0, 0.1, 0x6fc4e0, {
      transparent: true, opacity: 0.65, emissive: 0x2a5a70, emissiveIntensity: 0.35,
    }), i * 0.75 - 0.4, 1.5, 1.76));
  }
  g.add(put(box(1.4, 1.8, 0.14, 0x4f7f9e), -1.9, 0.9, 1.78));
  // антенны
  for (const x of [-2.2, 2.2]) {
    g.add(put(cyl(0.07, 0.07, 1.6, 8, HULL_D), x, 3.2, -1.0));
    const dish = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.5),
      mat(0xdfe3e6, { side: THREE.DoubleSide, flatShading: false })
    );
    dish.rotation.x = -1.0;
    g.add(put(dish, x, 4.1, -1.0));
  }
  // маячок
  const beacon = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.18, 0),
    new THREE.MeshStandardMaterial({
      color: 0xff6b5a, emissive: 0xff3b2f, emissiveIntensity: 1.4, flatShading: true,
    })
  );
  beacon.position.set(1.5, 4.1, 0);
  g.add(beacon);
  return g;
}

/* ангар сборки */
export function assemblyHangar() {
  const g = new THREE.Group();
  g.add(put(box(4.6, 5.2, 3.6, 0xd4dae0), 0, 2.6, 0));
  // рёбра
  for (let y = 1; y < 5; y++) {
    g.add(put(box(4.7, 0.12, 3.7, 0xb0b8c0), 0, y * 1.05, 0));
  }
  // ворота во всю высоту
  g.add(put(box(2.4, 4.2, 0.14, 0x5f6a75), 0, 2.1, 1.83));
  for (let i = 0; i < 7; i++) {
    g.add(put(box(2.3, 0.08, 0.06, 0x4a545e), 0, 0.4 + i * 0.6, 1.9));
  }
  // крыша
  g.add(put(box(4.8, 0.3, 3.8, 0x9aa2ac), 0, 5.35, 0));
  g.add(put(box(1.2, 0.4, 1.2, 0xe8a83c), 1.4, 5.6, 0));
  // подъёмный кран сверху
  g.add(put(box(0.14, 0.14, 3.0, 0xe8a83c), 0, 5.7, 0));
  return g;
}

/* луноход */
export function roverVehicle() {
  const g = new THREE.Group();
  g.add(put(box(1.6, 0.4, 1.0, HULL_W), 0, 0.6, 0));
  g.add(put(box(0.9, 0.4, 0.8, 0xc4ccd4), -0.1, 0.98, 0));
  // солнечная панель
  const panel = box(1.4, 0.06, 1.0, 0x3f5a9e);
  panel.rotation.z = -0.18;
  g.add(put(panel, 0.2, 1.35, 0));
  for (let i = -2; i <= 2; i++) {
    g.add(put(box(0.04, 0.08, 0.95, 0x2a3f70), 0.2 + i * 0.26, 1.38, 0));
  }
  // мачта с камерой
  g.add(put(cyl(0.05, 0.05, 0.6, 8, HULL_D), -0.45, 1.28, 0));
  g.add(put(box(0.28, 0.2, 0.2, 0x55595e), -0.45, 1.65, 0));
  g.add(put(cyl(0.08, 0.08, 0.08, 10, 0x8fd0e6), -0.45, 1.65, 0.12)).rotation.x = Math.PI / 2;
  // колёса
  for (const [wx, wz] of [[-0.55, 0.55], [0.55, 0.55], [-0.55, -0.55], [0.55, -0.55]]) {
    const w = cyl(0.32, 0.32, 0.2, 12, 0x44484c);
    w.rotation.z = Math.PI / 2;
    g.add(put(w, wx, 0.35, wz));
    for (let i = 0; i < 6; i++) {
      const tread = box(0.06, 0.66, 0.22, 0x2e3236);
      tread.rotation.x = (i / 6) * Math.PI;
      g.add(put(tread, wx, 0.35, wz));
    }
  }
  return g;
}

/* топливные баки */
export function fuelTanks() {
  const g = new THREE.Group();
  [[-1.1, 0], [1.1, 0], [0, -1.5]].forEach(([x, z], i) => {
    g.add(put(cyl(0.62, 0.62, 2.2, 14, i % 2 ? 0xdfe3e6 : 0xc4ccd4), x, 1.3, z));
    g.add(put(sph(0.62, 0xdfe3e6), x, 2.4, z));
    g.add(put(cyl(0.68, 0.68, 0.16, 14, 0x9aa2ac), x, 0.3, z));
    g.add(put(box(1.3, 0.12, 0.12, 0x8d949a), x, 1.9, z + 0.6));
  });
  // трубопровод
  for (const [a, b] of [[[-1.1, 0], [1.1, 0]], [[0, -1.5], [-1.1, 0]]]) {
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    const pipe = cyl(0.1, 0.1, len, 10, 0x8d949a);
    pipe.rotation.z = Math.PI / 2;
    pipe.rotation.y = -Math.atan2(dz, dx);
    g.add(put(pipe, (a[0] + b[0]) / 2, 0.5, (a[1] + b[1]) / 2));
  }
  return g;
}
