import * as THREE from "three";
import { C, box, buildTree, cone, cyl, put, sph } from "../../core/geometry";


/* ============================================================
   ПОСТРОЙКИ: ПОСЁЛОК
   ============================================================ */

export const ASPHALT = 0x6a7078;
export const ASPHALT_LIGHT = 0x868d96;
export const CONCRETE = 0xd6dce2;
export const GLASS_BLUE = 0x6fd4f5;

/* дорога с разметкой */
export function buildRoad() {
  const g = new THREE.Group();
  const road = box(5.0, 0.22, 20, ASPHALT);
  g.add(put(road, 0, 0.16, 0));
  for (let z = -8.5; z <= 8.5; z += 2.4) {
    const dash = box(0.24, 0.06, 1.2, 0xf0e6cf);
    g.add(put(dash, 0, 0.29, z));
  }
  // бордюры
  for (const x of [-2.65, 2.65]) {
    const curb = box(0.35, 0.34, 20, CONCRETE);
    g.add(put(curb, x, 0.2, 0));
  }
  return g;
}

/* тротуар с плиткой */
export function buildSidewalk() {
  const g = new THREE.Group();
  for (const x of [-3.6, 3.6]) {
    const walk = box(1.5, 0.26, 18, 0xd9d3c6);
    g.add(put(walk, x, 0.18, 0));
    for (let z = -8; z <= 8; z += 1.5) {
      const seam = box(1.5, 0.02, 0.06, 0xbdb6a8);
      g.add(put(seam, x, 0.32, z));
    }
  }
  // скамейки
  for (const [x, z, ry] of [[4.6, 3.0, 0], [-4.6, -2.0, Math.PI]]) {
    const bench = new THREE.Group();
    bench.add(put(box(0.5, 0.12, 1.6, C.wood), 0, 0.45, 0));
    bench.add(put(box(0.12, 0.5, 1.6, C.wood), -0.22, 0.7, 0));
    for (const s of [-0.6, 0.6]) bench.add(put(box(0.4, 0.4, 0.12, 0x6b7075), 0, 0.22, s));
    bench.position.set(x, 0, z);
    bench.rotation.y = ry;
    g.add(bench);
  }
  return g;
}

/* двухэтажный коттедж */
export function cottage(color, roofColor) {
  const g = new THREE.Group();
  const body = box(3.2, 3.6, 2.8, color);
  g.add(put(body, 0, 1.8, 0));
  // второй этаж чуть уже
  const attic = box(3.0, 0.5, 2.6, color);
  g.add(put(attic, 0, 3.85, 0));
  for (const s of [-1, 1]) {
    const slope = box(2.05, 0.2, 3.2, roofColor);
    slope.position.set(s * 0.85, 4.55, 0);
    slope.rotation.z = s * -0.6;
    g.add(slope);
  }
  g.add(put(box(0.28, 0.2, 3.3, roofColor), 0, 5.05, 0));
  // окна двух этажей
  for (const y of [1.1, 2.7]) {
    for (const x of [-0.85, 0.85]) {
      g.add(put(box(0.7, 0.8, 0.1, GLASS_BLUE, { emissive: 0x2a4d5a, emissiveIntensity: 0.2 }), x, y, 1.42));
    }
  }
  g.add(put(box(0.8, 1.5, 0.12, C.woodDark), 0, 0.75, 1.44));
  // гараж
  const garage = box(2.0, 1.8, 2.2, color);
  g.add(put(garage, 2.6, 0.9, 0.3));
  for (const s of [-1, 1]) {
    const gs = box(1.3, 0.16, 2.4, roofColor);
    gs.position.set(2.6 + s * 0.52, 2.1, 0.3);
    gs.rotation.z = s * -0.5;
    g.add(gs);
  }
  g.add(put(box(0.1, 1.3, 1.7, 0xb9bcc0), 3.6, 0.68, 0.3));
  return g;
}

function buildCottages() {
  const g = new THREE.Group();
  const a = cottage(0xf3e3cd, 0xa8563f);
  a.position.set(0, 0, 0);
  const b = cottage(0xdfe8e0, 0x5d7f8e);
  b.position.set(-5.2, 0, 1.6);
  b.rotation.y = 0.35;
  g.add(a, b);
  return g;
}

/* магазин с вывеской и витриной */
export function buildShop() {
  const g = new THREE.Group();
  const body = box(4.6, 3.0, 3.2, 0xe9d9be);
  g.add(put(body, 0, 1.5, 0));
  const flatRoof = box(4.9, 0.3, 3.5, 0xa8927a);
  g.add(put(flatRoof, 0, 3.15, 0));
  // витрина
  g.add(put(box(3.6, 1.5, 0.12, GLASS_BLUE, { transparent: true, opacity: 0.6 }), 0, 1.3, 1.63));
  // навес полосатый
  for (let i = -2; i <= 2; i++) {
    const stripe = box(0.42, 0.1, 1.0, i % 2 ? 0xd94f4f : 0xf6ead6);
    stripe.rotation.x = -0.35;
    g.add(put(stripe, i * 0.44, 2.5, 2.05));
  }
  // вывеска
  const sign = box(3.0, 0.7, 0.16, 0x3f6244);
  g.add(put(sign, 0, 3.6, 1.4));
  for (let i = 0; i < 4; i++) {
    g.add(put(sph(0.11, 0xf2d06a, { emissive: 0xf2b544, emissiveIntensity: 0.8 }), -1.05 + i * 0.7, 3.6, 1.52));
  }
  // ящики у входа
  for (const [x, z] of [[2.0, 1.9], [2.6, 2.2]]) {
    g.add(put(box(0.6, 0.6, 0.6, C.wood), x, 0.3, z));
  }
  return g;
}

/* детская площадка */
export function buildPlayground() {
  const g = new THREE.Group();
  const ground = cyl(3.4, 3.4, 0.2, 16, 0xd9b98a);
  g.add(put(ground, 0, 0.12, 0));

  // горка
  const slide = new THREE.Group();
  for (const x of [-0.5, 0.5]) slide.add(put(box(0.12, 1.8, 0.12, 0x4f7f9e), x, 0.9, -0.9));
  slide.add(put(box(1.2, 0.14, 1.2, 0xe8b04a), 0, 1.8, -0.9));
  const ramp = box(1.0, 0.12, 2.6, 0xd94f4f);
  ramp.rotation.x = 0.62;
  slide.add(put(ramp, 0, 1.15, 0.4));
  slide.position.set(-1.4, 0, 0);
  g.add(slide);

  // качели
  const sw = new THREE.Group();
  for (const s of [-1, 1]) {
    const leg1 = box(0.12, 2.0, 0.12, 0x4f7f9e);
    leg1.rotation.z = s * 0.25;
    sw.add(put(leg1, s * 0.85, 1.0, 0));
  }
  sw.add(put(box(2.0, 0.12, 0.12, 0x4f7f9e), 0, 1.95, 0));
  for (const x of [-0.4, 0.4]) {
    sw.add(put(box(0.05, 1.1, 0.05, 0x8d949a), x, 1.4, 0));
    sw.add(put(box(0.45, 0.08, 0.3, 0xe8b04a), x, 0.85, 0));
  }
  sw.position.set(1.6, 0, 0.6);
  sw.rotation.y = 0.4;
  g.add(sw);

  // песочница
  const sand = box(1.6, 0.22, 1.6, 0xe8d5a8);
  g.add(put(sand, 1.0, 0.22, -1.9));
  for (const [x, z] of [[0.3, -1.9], [1.7, -1.9], [1.0, -2.6], [1.0, -1.2]]) {
    g.add(put(box(0.16, 0.3, 0.16, C.wood), x, 0.3, z));
  }
  return g;
}

/* кафе с террасой */
export function buildCafe() {
  const g = new THREE.Group();
  const body = box(3.4, 2.8, 3.0, 0xf0e0d0);
  g.add(put(body, 0, 1.4, 0));
  const roof = box(3.7, 0.28, 3.3, 0x8a6a4a);
  g.add(put(roof, 0, 2.95, 0));
  g.add(put(box(2.4, 1.4, 0.1, GLASS_BLUE, { transparent: true, opacity: 0.6 }), 0, 1.5, 1.53));
  g.add(put(box(0.8, 0.6, 0.12, 0x6b4226), 0, 2.55, 1.5));

  // столики с зонтами
  for (const [x, z] of [[2.6, 1.6], [2.4, -1.2]]) {
    const set = new THREE.Group();
    set.add(put(cyl(0.55, 0.5, 0.1, 10, 0xf6ead6), 0, 0.75, 0));
    set.add(put(cyl(0.09, 0.09, 0.75, 6, 0x8d949a), 0, 0.38, 0));
    set.add(put(cyl(0.05, 0.05, 2.2, 6, 0x8a6a4a), 0, 1.1, 0));
    const umbrella = cone(1.15, 0.6, 10, 0xd94f4f);
    set.add(put(umbrella, 0, 2.3, 0));
    for (const [cx, cz] of [[0.85, 0], [-0.85, 0]]) {
      set.add(put(box(0.4, 0.08, 0.4, 0xe0d5c0), cx, 0.5, cz));
      set.add(put(box(0.4, 0.5, 0.08, 0xe0d5c0), cx + (cx > 0 ? 0.16 : -0.16), 0.75, cz));
    }
    set.position.set(x, 0, z);
    g.add(set);
  }
  return g;
}

/* автобусная остановка */
export function buildBusStop() {
  const g = new THREE.Group();
  for (const x of [-1.3, 1.3]) g.add(put(box(0.14, 2.3, 0.14, 0x6b7075), x, 1.15, -0.7));
  g.add(put(box(0.14, 2.3, 0.14, 0x6b7075), -1.3, 1.15, 0.7));
  g.add(put(box(0.14, 2.3, 0.14, 0x6b7075), 1.3, 1.15, 0.7));
  const roof = box(3.0, 0.14, 1.8, 0x4f7f9e);
  g.add(put(roof, 0, 2.35, 0));
  const back = box(2.9, 1.9, 0.1, GLASS_BLUE, { transparent: true, opacity: 0.45 });
  g.add(put(back, 0, 1.2, -0.72));
  const bench = box(2.4, 0.12, 0.5, C.wood);
  g.add(put(bench, 0, 0.6, -0.4));
  for (const x of [-0.9, 0.9]) g.add(put(box(0.12, 0.6, 0.4, 0x6b7075), x, 0.3, -0.4));
  // столб с табличкой
  g.add(put(cyl(0.08, 0.08, 2.6, 6, 0x6b7075), 2.1, 1.3, 1.2));
  const sign = box(0.7, 0.5, 0.08, 0xf6ead6);
  g.add(put(sign, 2.1, 2.5, 1.2));
  g.add(put(box(0.45, 0.25, 0.05, 0x3f6244), 2.1, 2.5, 1.27));
  return g;
}

/* сквер с фонтанчиком и деревьями */
export function buildParkSquare() {
  const g = new THREE.Group();
  const plaza = cyl(3.6, 3.6, 0.18, 20, 0xd9d3c6);
  g.add(put(plaza, 0, 0.14, 0));
  const ring = cyl(3.75, 3.75, 0.1, 20, 0xbdb6a8);
  g.add(put(ring, 0, 0.1, 0));

  // клумба в центре
  const bed = cyl(1.1, 1.2, 0.5, 12, 0xa8756a);
  g.add(put(bed, 0, 0.3, 0));
  g.add(put(cyl(0.95, 0.95, 0.15, 12, C.soil), 0, 0.55, 0));
  const flowers = [0xe4573f, 0xf2b544, 0xd4789e, 0xa96bd4];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.add(put(cone(0.14, 0.3, 5, C.leaf), Math.cos(a) * 0.55, 0.75, Math.sin(a) * 0.55));
    g.add(put(sph(0.11, flowers[i % 4]), Math.cos(a) * 0.55, 0.95, Math.sin(a) * 0.55));
  }

  // деревья по краю
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const t = buildTree(0.7);
    t.position.set(Math.cos(a) * 2.9, 0.1, Math.sin(a) * 2.9);
    g.add(t);
  }
  // скамейки
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 1.2;
    const bench = new THREE.Group();
    bench.add(put(box(1.4, 0.12, 0.45, C.wood), 0, 0.42, 0));
    bench.add(put(box(1.4, 0.45, 0.1, C.wood), 0, 0.62, -0.2));
    bench.position.set(Math.cos(a) * 2.2, 0.1, Math.sin(a) * 2.2);
    bench.rotation.y = -a;
    g.add(bench);
  }
  return g;
}

/* водонапорная башня */
export function buildWaterTower() {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.78;
    const leg = box(0.2, 4.4, 0.2, 0x8d949a);
    leg.position.set(Math.cos(a) * 1.1, 2.2, Math.sin(a) * 1.1);
    leg.rotation.x = Math.sin(a) * 0.12;
    leg.rotation.z = -Math.cos(a) * 0.12;
    g.add(leg);
  }
  // раскосы
  for (const y of [1.4, 3.0]) {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.78;
      const b = ((i + 1) / 4) * Math.PI * 2 + 0.78;
      const x1 = Math.cos(a) * 1.2, z1 = Math.sin(a) * 1.2;
      const x2 = Math.cos(b) * 1.2, z2 = Math.sin(b) * 1.2;
      const len = Math.hypot(x2 - x1, z2 - z1);
      const bar = box(len, 0.09, 0.09, 0x8d949a);
      bar.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
      bar.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
      g.add(bar);
    }
  }
  const tank = cyl(1.5, 1.5, 2.0, 14, 0xc9d6dc);
  g.add(put(tank, 0, 5.4, 0));
  g.add(put(cone(1.65, 0.9, 14, 0x4f7f9e), 0, 6.8, 0));
  g.add(put(cyl(1.62, 1.62, 0.18, 14, 0x4f7f9e), 0, 4.45, 0));
  // полоса на баке
  g.add(put(cyl(1.53, 1.53, 0.4, 14, 0xd94f4f), 0, 5.6, 0));
  return g;
}

/* уличные фонари вдоль дороги */
export function buildStreetLamps(store) {
  const g = new THREE.Group();
  const bulbs = [];
  for (const [x, z] of [[-3.4, -6], [3.4, -2], [-3.4, 2], [3.4, 6], [-3.4, 8.5]]) {
    const post = cyl(0.1, 0.14, 3.4, 8, 0x6b7075);
    g.add(put(post, x, 1.7, z));
    const arm = box(0.9, 0.1, 0.1, 0x6b7075);
    g.add(put(arm, x + (x > 0 ? -0.45 : 0.45), 3.4, z));
    const head = box(0.7, 0.18, 0.35, 0x55595e);
    const hx = x + (x > 0 ? -0.9 : 0.9);
    g.add(put(head, hx, 3.3, z));
    const lamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.1, 0.28),
      new THREE.MeshStandardMaterial({ color: 0xffe9b8, emissive: 0xffc46b, emissiveIntensity: 1.2, flatShading: true })
    );
    lamp.position.set(hx, 3.18, z);
    g.add(lamp);
    bulbs.push(lamp);
    const l = new THREE.PointLight(0xffc46b, 0.45, 8);
    l.position.set(hx, 3.0, z);
    g.add(l);
  }
  store.lanternBulbs = bulbs;
  return g;
}
