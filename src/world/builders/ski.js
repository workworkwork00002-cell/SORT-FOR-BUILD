import * as THREE from "three";
import { mixHexNum } from "../../board/models";
import { box, cone, cyl, mat, put, sph } from "../../core/geometry";


/* ============================================================
   ПОСТРОЙКИ: ЗИМНИЙ КУРОРТ
   ============================================================ */

const SNOW_W = 0xfaffff;
const PINE_D = 0x2f5a3a;

/* подъёмник с кабинками */
export function skiLift(store) {
  const g = new THREE.Group();
  // опоры
  for (const [x, z, h] of [[-3.4, 0, 4.2], [3.4, 0, 5.6]]) {
    g.add(put(cyl(0.16, 0.22, h, 8, 0x8d949a), x, h / 2, z));
    g.add(put(box(1.6, 0.16, 0.16, 0x6e757c), x, h - 0.2, z));
  }
  // трос
  const rope = box(7.2, 0.06, 0.06, 0x55595e);
  rope.rotation.z = 0.19;
  g.add(put(rope, 0, 4.6, 0.2));
  const rope2 = box(7.2, 0.05, 0.05, 0x55595e);
  rope2.rotation.z = 0.19;
  g.add(put(rope2, 0, 4.3, -0.2));
  // кабинки
  const cabs = [];
  [[-2.2, 0xd94f4f], [0, 0xf2c144], [2.2, 0x4f8fc4]].forEach(([x, col]) => {
    const cab = new THREE.Group();
    cab.add(put(cyl(0.04, 0.04, 0.5, 5, 0x8d949a), 0, 0.28, 0));
    cab.add(put(box(0.62, 0.7, 0.6, col), 0, -0.3, 0));
    cab.add(put(box(0.44, 0.34, 0.06, 0xcfe9f5), 0, -0.22, 0.32));
    cab.add(put(box(0.66, 0.08, 0.64, mixHexNum(col, 0x000000, 0.3)), 0, 0.02, 0));
    cab.position.set(x, 4.6 + x * 0.19, 0.2);
    g.add(cab);
    cabs.push(cab);
  });
  store.liftCabs = [...(store.liftCabs || []), ...cabs];
  return g;
}

/* шале с заснеженной крышей */
export function chalet() {
  const g = new THREE.Group();
  g.add(put(box(3.2, 1.0, 2.6, 0x9a7048), 0, 0.5, 0));
  g.add(put(box(3.0, 1.5, 2.4, 0xc9a878), 0, 1.75, 0));
  // балкон
  g.add(put(box(3.4, 0.12, 0.6, 0x8a5f3a), 0, 2.4, 1.4));
  for (let i = -3; i <= 3; i++) {
    g.add(put(box(0.07, 0.4, 0.07, 0x6b4a2c), i * 0.45, 2.6, 1.66));
  }
  g.add(put(box(3.4, 0.08, 0.08, 0x6b4a2c), 0, 2.8, 1.66));
  // двускатная крыша со снегом
  for (const s of [-1, 1]) {
    const slope = box(2.4, 0.22, 3.0, 0x6b4a2c);
    slope.position.set(s * 0.95, 3.35, 0);
    slope.rotation.z = s * -0.62;
    g.add(slope);
    const snow = box(2.3, 0.2, 3.0, SNOW_W);
    snow.position.set(s * 1.02, 3.52, 0);
    snow.rotation.z = s * -0.62;
    g.add(snow);
  }
  g.add(put(box(0.3, 0.22, 3.1, SNOW_W), 0, 4.1, 0));
  // тёплые окна
  for (const [x, y] of [[-0.85, 1.8], [0.85, 1.8], [0, 0.55]]) {
    g.add(put(box(0.55, 0.5, 0.08, 0xffd98a, { emissive: 0xffb545, emissiveIntensity: 0.9 }), x, y, 1.24));
  }
  // труба с дымом
  g.add(put(box(0.4, 0.9, 0.4, 0x8a7a6a), 0.9, 3.9, -0.5));
  g.add(put(box(0.46, 0.14, 0.46, SNOW_W), 0.9, 4.4, -0.5));
  return g;
}

/* каток */
export function resortRink(store) {
  const g = new THREE.Group();
  g.add(put(cyl(3.2, 3.3, 0.2, 20, 0xdfe8ee), 0, 0.1, 0));
  const ice = new THREE.Mesh(
    new THREE.CylinderGeometry(3.0, 3.0, 0.12, 22),
    mat(0xbfe8f5, { roughness: 0.03, metalness: 0.35, transparent: true, opacity: 0.92, flatShading: false })
  );
  g.add(put(ice, 0, 0.22, 0));
  store.rinkIce = ice;
  // бортик
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    const seg = box(0.55, 0.34, 0.12, i % 2 ? 0xf2ede0 : 0x9fd4e8);
    seg.rotation.y = -a;
    g.add(put(seg, Math.cos(a) * 3.2, 0.36, Math.sin(a) * 3.2));
  }
  // гирлянда на столбиках
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.add(put(cyl(0.06, 0.06, 1.4, 6, 0x6e757c), Math.cos(a) * 3.3, 0.9, Math.sin(a) * 3.3));
    g.add(put(sph(0.11, 0xfff0c0, { emissive: 0xffc46b, emissiveIntensity: 1.0 }),
      Math.cos(a) * 3.3, 1.7, Math.sin(a) * 3.3));
  }
  return g;
}

/* заснеженные ели */
export function snowPines() {
  const g = new THREE.Group();
  [[0, 0, 1.1], [2.4, 1.2, 0.85], [-2.2, 0.9, 0.95], [1.0, -2.2, 0.75]].forEach(([x, z, sc]) => {
    const t = new THREE.Group();
    t.add(put(cyl(0.18, 0.24, 0.9, 8, 0x5a4030), 0, 0.45, 0));
    for (let i = 0; i < 3; i++) {
      const r = 1.15 - i * 0.3;
      t.add(put(cone(r, 1.2, 8, PINE_D), 0, 1.2 + i * 0.85, 0));
      // снежная шапка на ярусе
      const cap = cone(r * 0.82, 0.42, 8, SNOW_W);
      t.add(put(cap, 0, 1.62 + i * 0.85, 0));
    }
    t.position.set(x, 0, z);
    t.scale.setScalar(sc);
    g.add(t);
  });
  // сугробы
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const d = sph(0.5, SNOW_W);
    d.scale.set(1.5, 0.42, 1.2);
    g.add(put(d, Math.cos(a) * 2.8, 0.12, Math.sin(a) * 2.8));
  }
  return g;
}

/* ============================================================
   ПОСТРОЙКИ: ЧАЙНАЯ ДОЛИНА
   ============================================================ */

const TEA_LEAF = 0x6faa4a;

/* чайные террасы по склону */
export function teaTerraces() {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const w = 6.4 - i * 1.1;
    const y = i * 0.5;
    g.add(put(cyl(w / 2, w / 2 + 0.15, 0.5, 16, 0x8a6a45), 0, y + 0.25, 0));
    g.add(put(cyl(w / 2 - 0.2, w / 2 - 0.2, 0.1, 16, mixHexNum(TEA_LEAF, 0x000000, 0.15)), 0, y + 0.52, 0));
    // кусты рядами
    const n = 10 + i * 2;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      const r = w / 2 - 0.55;
      const bush = sph(0.26, TEA_LEAF);
      bush.scale.set(1, 0.72, 1);
      g.add(put(bush, Math.cos(a) * r, y + 0.62, Math.sin(a) * r));
    }
  }
  return g;
}

/* чайный домик */
export function teaHouse() {
  const g = new THREE.Group();
  g.add(put(box(2.8, 0.3, 2.4, 0x8a6a45), 0, 0.15, 0));
  g.add(put(box(2.4, 1.6, 2.0, 0xf0e4cc), 0, 1.1, 0));
  // решётчатые стены
  for (let i = -2; i <= 2; i++) {
    g.add(put(box(0.07, 1.5, 0.05, 0x6b4a2c), i * 0.5, 1.1, 1.02));
  }
  for (const y of [0.6, 1.1, 1.6]) {
    g.add(put(box(2.4, 0.06, 0.05, 0x6b4a2c), 0, y, 1.02));
  }
  // изогнутая крыша
  for (const s of [-1, 1]) {
    const slope = box(2.0, 0.16, 2.6, 0x5a4a3a);
    slope.position.set(s * 0.85, 2.2, 0);
    slope.rotation.z = s * -0.42;
    g.add(slope);
    // приподнятый край
    const tip = box(0.5, 0.14, 2.6, 0x4a3a2c);
    tip.position.set(s * 1.6, 2.42, 0);
    tip.rotation.z = s * -0.9;
    g.add(tip);
  }
  g.add(put(box(0.24, 0.18, 2.7, 0x4a3a2c), 0, 2.6, 0));
  // фонарик у входа
  g.add(put(cyl(0.18, 0.18, 0.36, 10, 0xffd98a, { emissive: 0xffb545, emissiveIntensity: 0.9 }), 1.0, 1.9, 1.1));
  return g;
}

/* сушильные стеллажи */
export function dryingRacks() {
  const g = new THREE.Group();
  for (const x of [-1.3, 1.3]) {
    for (const z of [-1.0, 1.0]) {
      g.add(put(cyl(0.09, 0.11, 2.0, 8, 0x8a6a45), x, 1.0, z));
    }
  }
  // полки с листом
  for (let i = 0; i < 4; i++) {
    const y = 0.4 + i * 0.5;
    g.add(put(box(2.9, 0.07, 2.2, 0xc9a878), 0, y, 0));
    for (let k = 0; k < 6; k++) {
      const leaf = box(0.34, 0.06, 0.28, mixHexNum(TEA_LEAF, 0x000000, i * 0.1));
      g.add(put(leaf, -1.0 + (k % 3) * 1.0, y + 0.07, k < 3 ? -0.5 : 0.5));
    }
  }
  g.add(put(box(3.1, 0.12, 2.4, 0x8a6a45), 0, 2.35, 0));
  return g;
}

/* мельница для чая */
export function teaMill(store) {
  const g = new THREE.Group();
  g.add(put(cyl(1.1, 1.3, 2.6, 12, 0xd4c4a8), 0, 1.3, 0));
  g.add(put(cone(1.5, 1.0, 12, 0x8a5f3a), 0, 3.1, 0));
  g.add(put(box(0.6, 1.0, 0.1, 0x6b4a2c), 0, 0.5, 1.25));
  // колесо
  const wheel = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.11, 8, 18), mat(0x8a5f3a));
  wheel.add(rim);
  for (let i = 0; i < 8; i++) {
    const p = box(0.44, 0.06, 0.5, 0xa5713f);
    p.rotation.z = (i / 8) * Math.PI * 2;
    p.position.set(Math.cos((i / 8) * Math.PI * 2) * 1.1, Math.sin((i / 8) * Math.PI * 2) * 1.1, 0);
    wheel.add(p);
  }
  wheel.position.set(1.5, 1.2, 0);
  g.add(wheel);
  store.teaWheel = wheel;
  return g;
}

/* ============================================================
   ПОСТРОЙКИ: ЧАСОВОЙ КВАРТАЛ
   ============================================================ */

const BRASS = 0xc9a23c;
const BRASS_D = 0x8a6f26;

/* башня с часами */
export function clockTower(store) {
  const g = new THREE.Group();
  g.add(put(box(2.6, 5.4, 2.6, 0xc4b8a4), 0, 2.7, 0));
  // пояса
  for (const y of [1.4, 3.0]) g.add(put(box(2.8, 0.2, 2.8, 0xa89880), 0, y, 0));
  // циферблат
  const face = cyl(0.95, 0.95, 0.16, 20, 0xf5efe0);
  face.rotation.x = Math.PI / 2;
  g.add(put(face, 0, 4.3, 1.32));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.98, 0.1, 8, 22), mat(BRASS));
  g.add(put(ring, 0, 4.3, 1.34));
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    g.add(put(box(0.07, 0.16, 0.05, BRASS_D), Math.cos(a) * 0.75, 4.3 + Math.sin(a) * 0.75, 1.42));
  }
  // стрелки
  const hour = box(0.09, 0.5, 0.05, 0x3a352e);
  const minute = box(0.07, 0.75, 0.05, 0x3a352e);
  const hourG = new THREE.Group();
  hourG.add(put(hour, 0, 0.25, 0));
  hourG.position.set(0, 4.3, 1.46);
  const minG = new THREE.Group();
  minG.add(put(minute, 0, 0.37, 0));
  minG.position.set(0, 4.3, 1.48);
  g.add(hourG);
  g.add(minG);
  store.clockHands = { hour: hourG, minute: minG };
  // купол и флюгер
  g.add(put(cone(1.7, 1.4, 8, 0x4f8f8a), 0, 6.1, 0));
  g.add(put(cyl(0.06, 0.06, 0.8, 6, BRASS), 0, 7.1, 0));
  g.add(put(sph(0.16, BRASS), 0, 7.5, 0));
  return g;
}

/* мастерская часовщика */
export function watchmakerShop() {
  const g = new THREE.Group();
  g.add(put(box(3.4, 2.4, 2.6, 0xd8c9a8), 0, 1.2, 0));
  g.add(put(box(3.6, 0.2, 2.8, 0x8a6f26), 0, 2.4, 0));
  // витрина
  g.add(put(box(2.2, 1.2, 0.1, 0x9fd4e8, {
    transparent: true, opacity: 0.6, emissive: 0x3a6a7a, emissiveIntensity: 0.4,
  }), -0.4, 1.3, 1.32));
  g.add(put(box(0.8, 1.6, 0.12, 0x6b4a2c), 1.2, 0.8, 1.32));
  // маркиза в полоску
  for (let i = -3; i <= 3; i++) {
    const stripe = box(0.42, 0.1, 0.9, i % 2 ? 0xd94f4f : 0xf2ede0);
    stripe.rotation.x = -0.42;
    g.add(put(stripe, i * 0.44, 2.15, 1.6));
  }
  // вывеска-шестерня
  const gear = new THREE.Group();
  const ring = cyl(0.34, 0.34, 0.1, 14, BRASS);
  ring.rotation.x = Math.PI / 2;
  gear.add(ring);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const tooth = box(0.13, 0.13, 0.11, BRASS);
    tooth.position.set(Math.cos(a) * 0.4, Math.sin(a) * 0.4, 0);
    tooth.rotation.z = a;
    gear.add(tooth);
  }
  gear.position.set(1.9, 2.2, 1.0);
  g.add(gear);
  // крыша
  for (const s of [-1, 1]) {
    const slope = box(2.2, 0.18, 2.8, 0x7a5a3a);
    slope.position.set(s * 0.9, 2.9, 0);
    slope.rotation.z = s * -0.5;
    g.add(slope);
  }
  return g;
}

/* уличные куранты */
export function streetChimes(store) {
  const g = new THREE.Group();
  g.add(put(cyl(0.4, 0.5, 0.3, 12, 0x8a8278), 0, 0.15, 0));
  g.add(put(cyl(0.14, 0.16, 3.0, 10, 0x4a4f57), 0, 1.6, 0));
  // перекладина
  g.add(put(box(1.8, 0.1, 0.1, BRASS_D), 0, 3.1, 0));
  // трубки разной длины
  const tubes = [];
  for (let i = 0; i < 5; i++) {
    const h = 1.4 - i * 0.18;
    const tube = cyl(0.07, 0.07, h, 10, i % 2 ? BRASS : mixHexNum(BRASS, 0xffffff, 0.3));
    const t = new THREE.Group();
    t.add(put(tube, 0, -h / 2, 0));
    t.position.set(-0.72 + i * 0.36, 3.05, 0);
    g.add(t);
    tubes.push(t);
  }
  store.chimes = [...(store.chimes || []), ...tubes];
  // фонарь сверху
  g.add(put(box(0.34, 0.42, 0.34, 0x3a352e), 0, 3.4, 0));
  g.add(put(sph(0.13, 0xffe8b0, { emissive: 0xffc46b, emissiveIntensity: 1.1 }), 0, 3.4, 0));
  return g;
}

/* солнечные часы */
export function sundial() {
  const g = new THREE.Group();
  g.add(put(cyl(0.42, 0.55, 0.9, 10, 0x8a8278), 0, 0.45, 0));
  g.add(put(cyl(1.15, 1.15, 0.18, 20, 0xd4cdbc), 0, 0.98, 0));
  // деления
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    g.add(put(box(0.06, 0.05, 0.22, 0x5e584e), Math.cos(a) * 0.85, 1.08, Math.sin(a) * 0.85))
      .rotation.y = -a;
  }
  // гномон
  const gn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 0.07, 3),
    mat(BRASS)
  );
  gn.rotation.x = Math.PI / 2;
  gn.rotation.z = 0.5;
  g.add(put(gn, 0, 1.3, 0));
  return g;
}
