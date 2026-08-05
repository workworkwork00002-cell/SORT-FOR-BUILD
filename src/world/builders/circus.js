import * as THREE from "three";
import { mixHexNum } from "../../board/models";
import { box, cone, cyl, mat, put, sph } from "../../core/geometry";


/* ============================================================
   ПОСТРОЙКИ: ЦИРК
   ============================================================ */

const TENT_RED = 0xd94f4f;
const TENT_CREAM = 0xfaf3e4;

/* шапито */
export function bigTop(store) {
  const g = new THREE.Group();
  // купол в полоску
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const seg = new THREE.Mesh(
      new THREE.ConeGeometry(4.2, 3.4, 14, 1, false, a, Math.PI / 7),
      mat(i % 2 ? TENT_RED : TENT_CREAM)
    );
    seg.castShadow = true;
    g.add(put(seg, 0, 3.2, 0));
  }
  // стенки
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(4.2, 4.2, 1.6, 14, 1, true, a, Math.PI / 7),
      mat(i % 2 ? TENT_CREAM : TENT_RED, { side: THREE.DoubleSide })
    );
    g.add(put(wall, 0, 0.8, 0));
  }
  // вход-арка
  g.add(put(box(2.2, 1.6, 0.2, 0x8f3a3a), 0, 0.8, 4.2));
  const arc = cyl(1.1, 1.1, 0.2, 14, 0x8f3a3a);
  arc.rotation.x = Math.PI / 2;
  g.add(put(arc, 0, 1.6, 4.2));
  // мачта и флаги
  g.add(put(cyl(0.1, 0.1, 1.8, 8, 0xc9a05a), 0, 5.6, 0));
  const flags = [];
  for (let i = 0; i < 3; i++) {
    const f = box(0.7, 0.42, 0.04, [0xf2c144, 0x4f8fc4, 0x5aa85a][i]);
    f.position.set(0.38, 6.1 - i * 0.42, 0);
    g.add(f);
    flags.push(f);
  }
  store.circusFlags = flags;
  // гирлянда лампочек по кромке
  const bulbs = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const b = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.14, 0),
      new THREE.MeshStandardMaterial({
        color: 0xfff0c0, emissive: 0xffc46b, emissiveIntensity: 1.1, flatShading: true,
      })
    );
    b.position.set(Math.cos(a) * 4.25, 1.7, Math.sin(a) * 4.25);
    g.add(b);
    bulbs.push(b);
  }
  store.carouselBulbs = [...(store.carouselBulbs || []), ...bulbs];
  return g;
}

/* арена с барьером */
export function circusRing() {
  const g = new THREE.Group();
  g.add(put(cyl(2.8, 2.9, 0.24, 20, 0xc9a878), 0, 0.12, 0));
  g.add(put(cyl(2.5, 2.5, 0.1, 20, 0xd8b98a), 0, 0.26, 0));
  // барьер полосками
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const seg = box(0.6, 0.4, 0.2, i % 2 ? TENT_RED : TENT_CREAM);
    seg.rotation.y = -a;
    g.add(put(seg, Math.cos(a) * 2.85, 0.42, Math.sin(a) * 2.85));
  }
  // тумбы для номера
  for (const [x, z, h] of [[0, 0, 0.7], [1.3, 0.8, 0.5], [-1.2, -0.7, 0.45]]) {
    g.add(put(cyl(0.42, 0.46, h, 12, 0x4f8fc4), x, 0.26 + h / 2, z));
    g.add(put(cyl(0.46, 0.46, 0.08, 12, 0xf2c144), x, 0.26 + h, z));
  }
  return g;
}

/* трапеция */
export function trapeze(store) {
  const g = new THREE.Group();
  for (const s of [-1, 1]) {
    const post = cyl(0.14, 0.18, 4.4, 8, 0xc9a05a);
    post.rotation.z = s * 0.08;
    g.add(put(post, s * 1.9, 2.2, 0));
  }
  g.add(put(box(4.2, 0.16, 0.16, 0xc9a05a), 0, 4.35, 0));
  // качели
  const swing = new THREE.Group();
  for (const s of [-1, 1]) swing.add(put(cyl(0.03, 0.03, 1.5, 5, 0x8d949a), s * 0.35, -0.75, 0));
  swing.add(put(cyl(0.05, 0.05, 0.8, 8, 0xd94f4f), 0, -1.5, 0)).rotation.z = Math.PI / 2;
  swing.position.set(0, 4.3, 0);
  g.add(swing);
  store.trapeze = swing;
  // страховочная сетка
  const net = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 1.8),
    mat(0xdfe3e6, { transparent: true, opacity: 0.35, side: THREE.DoubleSide })
  );
  net.rotation.x = -Math.PI / 2;
  g.add(put(net, 0, 0.6, 0));
  for (const s of [-1, 1]) g.add(put(box(3.6, 0.06, 0.06, 0x8d949a), 0, 0.6, s * 0.9));
  return g;
}

/* фургон циркача */
export function circusWagon() {
  const g = new THREE.Group();
  g.add(put(box(2.4, 1.5, 1.4, 0x8f5aa8), 0, 1.1, 0));
  g.add(put(box(2.5, 0.14, 1.5, 0xf2c144), 0, 1.9, 0));
  // круглая крыша
  const roof = cyl(0.75, 0.75, 2.5, 12, 0xd94f4f, {});
  roof.rotation.z = Math.PI / 2;
  g.add(put(roof, 0, 2.2, 0));
  // окошко и дверь
  g.add(put(box(0.6, 0.5, 0.08, 0xfff0c4, { emissive: 0xffc46b, emissiveIntensity: 0.6 }), -0.6, 1.3, 0.72));
  g.add(put(box(0.7, 1.1, 0.1, 0x6b4a2c), 0.7, 0.9, 0.72));
  // колёса со спицами
  for (const [wx, wz] of [[-0.8, 0.75], [0.8, 0.75], [-0.8, -0.75], [0.8, -0.75]]) {
    const w = cyl(0.42, 0.42, 0.12, 12, 0xc9a05a);
    w.rotation.z = Math.PI / 2;
    g.add(put(w, wx, 0.42, wz));
    for (let i = 0; i < 5; i++) {
      const sp = box(0.05, 0.78, 0.05, 0x8a6a3c);
      sp.rotation.x = (i / 5) * Math.PI;
      g.add(put(sp, wx, 0.42, wz));
    }
  }
  // флажки
  for (let i = -1; i <= 1; i++) {
    g.add(put(box(0.3, 0.22, 0.03, [0xf2c144, 0x5aa85a, 0x4f8fc4][i + 1]), i * 0.7, 2.9, 0.4));
  }
  return g;
}

/* ============================================================
   ПОСТРОЙКИ: ПИРАТСКАЯ БУХТА
   ============================================================ */

const PIRATE_WOOD = 0x7a5230;
const PIRATE_DARK = 0x543720;

/* пиратский корабль */
export function pirateShip(store) {
  const g = new THREE.Group();
  // корпус
  const hull = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.6, 7.0), mat(PIRATE_WOOD));
  hull.castShadow = true;
  g.add(put(hull, 0, 1.0, 0));
  const bow = new THREE.Mesh(new THREE.ConeGeometry(1.35, 2.2, 4), mat(PIRATE_WOOD));
  bow.rotation.x = -Math.PI / 2;
  bow.rotation.y = Math.PI / 4;
  bow.scale.set(1, 1, 0.6);
  g.add(put(bow, 0, 1.0, 4.4));
  // обшивка полосами
  for (const y of [0.5, 1.1]) {
    g.add(put(box(2.65, 0.12, 7.05, PIRATE_DARK), 0, y, 0));
  }
  // палуба и фальшборт
  g.add(put(box(2.4, 0.14, 6.8, 0xa5713f), 0, 1.85, 0));
  for (const s of [-1, 1]) {
    g.add(put(box(0.14, 0.5, 6.8, PIRATE_DARK), s * 1.2, 2.1, 0));
  }
  // надстройка на корме
  g.add(put(box(2.0, 1.1, 1.6, 0x8a5f3a), 0, 2.5, -2.4));
  g.add(put(box(2.1, 0.12, 1.7, PIRATE_DARK), 0, 3.1, -2.4));
  // мачта с парусом
  g.add(put(cyl(0.14, 0.16, 5.4, 10, 0x6b4a2c), 0, 4.4, 0.4));
  const sail = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 2.6),
    mat(0xf2ede0, { side: THREE.DoubleSide })
  );
  g.add(put(sail, 0, 5.0, 0.42));
  store.sails = [...(store.sails || []), sail];
  g.add(put(box(3.0, 0.1, 0.1, 0x6b4a2c), 0, 6.3, 0.4));
  // чёрный флаг
  g.add(put(box(0.8, 0.5, 0.03, 0x1f1c1a), 0.42, 6.9, 0.4));
  g.add(put(sph(0.09, 0xf2ede0), 0.35, 6.98, 0.42));
  // пушечные порты
  for (const s of [-1, 1]) {
    for (let i = -1; i <= 1; i++) {
      g.add(put(cyl(0.16, 0.16, 0.3, 10, 0x2e2620), s * 1.28, 1.3, i * 1.6)).rotation.z = Math.PI / 2;
    }
  }
  g.userData.phase = Math.random() * 6;
  store.ships = [...(store.ships || []), g];
  return g;
}

/* сундук с сокровищами */
export function treasureChest() {
  const g = new THREE.Group();
  g.add(put(box(1.3, 0.7, 0.9, PIRATE_WOOD), 0, 0.35, 0));
  // выпуклая крышка, откинута
  const lid = new THREE.Group();
  const dome = cyl(0.45, 0.45, 1.3, 12, PIRATE_WOOD, {});
  dome.rotation.z = Math.PI / 2;
  lid.add(put(dome, 0, 0, 0));
  lid.rotation.x = -0.9;
  lid.position.set(0, 0.72, -0.42);
  g.add(lid);
  // оковка
  for (const x of [-0.42, 0.42]) {
    g.add(put(box(0.1, 0.74, 0.94, 0x8d949a), x, 0.35, 0));
  }
  g.add(put(box(0.22, 0.22, 0.1, 0xe0b545), 0, 0.4, 0.47));
  // золото внутри
  for (let i = 0; i < 10; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.4;
    g.add(put(cyl(0.09, 0.09, 0.04, 10, 0xf2c144), Math.cos(a) * r, 0.7 + Math.random() * 0.12, Math.sin(a) * r));
  }
  for (const [x, z, c] of [[0.2, 0.15, 0x6fd4c4], [-0.25, -0.1, 0xd48fd4], [0.05, -0.2, 0xd94f4f]]) {
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.11, 0),
      mat(c, { emissive: c, emissiveIntensity: 0.5 })
    );
    g.add(put(gem, x, 0.8, z));
  }
  return g;
}

/* таверна на сваях */
export function pirateTavern() {
  const g = new THREE.Group();
  for (const [x, z] of [[-1.5, -1.2], [1.5, -1.2], [-1.5, 1.2], [1.5, 1.2]]) {
    g.add(put(cyl(0.16, 0.19, 1.2, 8, PIRATE_DARK), x, 0.6, z));
  }
  g.add(put(box(3.8, 0.2, 3.0, 0xa5713f), 0, 1.3, 0));
  g.add(put(box(3.2, 2.0, 2.4, 0xc9a878), 0, 2.4, 0));
  // косые доски
  for (let i = -2; i <= 2; i++) {
    const plank = box(0.12, 2.0, 0.06, PIRATE_DARK);
    plank.rotation.z = 0.1;
    g.add(put(plank, i * 0.62, 2.4, 1.22));
  }
  // крыша внахлёст
  for (const s of [-1, 1]) {
    const slope = box(2.2, 0.2, 3.0, 0x6b4a2c);
    slope.position.set(s * 0.95, 3.7, 0);
    slope.rotation.z = s * -0.5;
    g.add(slope);
  }
  g.add(put(box(0.26, 0.2, 3.1, 0x543720), 0, 4.2, 0));
  // окна и дверь
  for (const x of [-1.0, 1.0]) {
    g.add(put(box(0.6, 0.6, 0.08, 0xffc46b, { emissive: 0xff9a2f, emissiveIntensity: 0.8 }), x, 2.6, 1.24));
  }
  g.add(put(box(0.9, 1.4, 0.12, 0x6b4a2c), 0, 2.1, 1.25));
  // вывеска-бочка
  g.add(put(cyl(0.06, 0.06, 0.8, 5, 0x6b4a2c), 1.9, 2.9, 1.0));
  g.add(put(cyl(0.3, 0.26, 0.5, 10, PIRATE_WOOD), 1.9, 2.4, 1.0));
  // бочки у входа
  for (const [x, z] of [[2.3, 0.3], [2.6, 0.9]]) {
    g.add(put(cyl(0.34, 0.3, 0.75, 10, PIRATE_WOOD), x, 0.38, z));
    for (const y of [0.2, 0.55]) g.add(put(cyl(0.36, 0.36, 0.06, 10, 0x55595e), x, y, z));
  }
  return g;
}

/* дозорная вышка на скале */
export function crowsNest() {
  const g = new THREE.Group();
  const rock = cone(1.8, 3.0, 8, 0x7a7268);
  g.add(put(rock, 0, 1.3, 0));
  g.add(put(cyl(0.18, 0.22, 3.6, 8, 0x6b4a2c), 0, 4.2, 0));
  // бочка-корзина
  g.add(put(cyl(0.7, 0.6, 0.9, 12, PIRATE_WOOD), 0, 6.2, 0));
  for (const y of [5.95, 6.5]) g.add(put(cyl(0.72, 0.72, 0.07, 12, 0x55595e), 0, y, 0));
  // фонарь
  const lamp = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.2, 0),
    new THREE.MeshStandardMaterial({
      color: 0xffd98a, emissive: 0xffb545, emissiveIntensity: 1.3, flatShading: true,
    })
  );
  lamp.position.set(0, 7.0, 0);
  g.add(lamp);
  const pl = new THREE.PointLight(0xffb545, 0.8, 9);
  pl.position.set(0, 7.0, 0);
  g.add(pl);
  // верёвочная лестница
  for (let i = 0; i < 7; i++) {
    g.add(put(box(0.5, 0.05, 0.05, 0xc4a165), 0.45, 2.6 + i * 0.5, 0));
  }
  for (const s of [-1, 1]) {
    g.add(put(cyl(0.025, 0.025, 3.6, 4, 0xc4a165), 0.45 + s * 0.25, 4.2, 0));
  }
  return g;
}

/* ============================================================
   ПОСТРОЙКИ: ГРИБНОЙ ЛЕС
   ============================================================ */

const CAP_RED = 0xd9435a;
const CAP_PURPLE = 0x9a5ad4;
const CAP_TEAL = 0x3fc4b4;

/* домик-гриб */
export function mushroomHouse(capColor = CAP_RED) {
  const g = new THREE.Group();
  // ножка-дом
  g.add(put(cyl(1.0, 1.15, 2.2, 14, 0xf0e6d2), 0, 1.1, 0));
  // шляпка
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(1.9, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    mat(capColor, { flatShading: false })
  );
  cap.scale.y = 0.75;
  cap.castShadow = true;
  g.add(put(cap, 0, 2.2, 0));
  g.add(put(cyl(1.9, 1.9, 0.14, 16, mixHexNum(capColor, 0x000000, 0.25)), 0, 2.18, 0));
  // белые пятна
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const r = 0.7 + Math.random() * 0.8;
    const s = 0.18 + Math.random() * 0.14;
    const spot = new THREE.Mesh(new THREE.SphereGeometry(s, 10, 8), mat(0xfaf3e4, { flatShading: false }));
    spot.scale.set(1, 0.4, 1);
    const y = 2.2 + Math.sqrt(Math.max(0, 1 - (r / 1.9) ** 2)) * 1.42;
    g.add(put(spot, Math.cos(a) * r, y, Math.sin(a) * r));
  }
  // окна и дверь
  g.add(put(cyl(0.28, 0.28, 0.1, 12, 0xffd98a, { emissive: 0xffb545, emissiveIntensity: 0.8 }), -0.45, 1.5, 1.0))
    .rotation.x = Math.PI / 2;
  g.add(put(cyl(0.24, 0.24, 0.1, 12, 0xffd98a, { emissive: 0xffb545, emissiveIntensity: 0.8 }), 0.5, 1.6, 0.95))
    .rotation.x = Math.PI / 2;
  g.add(put(box(0.62, 1.0, 0.12, 0x8a5f3a), 0, 0.55, 1.05));
  const arch = cyl(0.31, 0.31, 0.12, 12, 0x8a5f3a);
  arch.rotation.x = Math.PI / 2;
  g.add(put(arch, 0, 1.05, 1.05));
  g.add(put(sph(0.06, 0xe0b545), 0.18, 0.6, 1.12));
  return g;
}

/* поляна светящихся грибов */
export function glowShrooms(store) {
  const g = new THREE.Group();
  const glows = [];
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2 + Math.random();
    const r = 0.6 + Math.random() * 2.2;
    const h = 0.4 + Math.random() * 0.7;
    const col = [0x6fe0d4, 0x9a7fe8, 0x7fe08f][i % 3];
    const m = new THREE.Group();
    m.add(put(cyl(0.07, 0.1, h, 8, 0xe8e0cc), 0, h / 2, 0));
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({
        color: col, emissive: col, emissiveIntensity: 0.9, flatShading: false,
      })
    );
    cap.scale.y = 0.7;
    m.add(put(cap, 0, h, 0));
    m.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    g.add(m);
    glows.push(cap);
  }
  store.glowCaps = [...(store.glowCaps || []), ...glows];
  const l = new THREE.PointLight(0x7fe0d4, 0.6, 8);
  l.position.set(0, 1.0, 0);
  g.add(l);
  // мох и камни
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.add(put(sph(0.2, 0x4f9e5a), Math.cos(a) * 2.6, 0.1, Math.sin(a) * 2.6));
  }
  return g;
}

/* мост из шляпок */
export function mushroomBridge() {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const z = -2.0 + t * 4.0;
    const y = 0.5 + Math.sin(t * Math.PI) * 0.55;
    const col = [CAP_RED, CAP_PURPLE, CAP_TEAL][i % 3];
    g.add(put(cyl(0.12, 0.16, y, 8, 0xf0e6d2), 0, y / 2, z));
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.62, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      mat(col, { flatShading: false })
    );
    cap.scale.y = 0.5;
    g.add(put(cap, 0, y, z));
  }
  // светлячки над мостом
  for (let i = 0; i < 5; i++) {
    g.add(put(sph(0.07, 0xffe89a, { emissive: 0xffd45a, emissiveIntensity: 1.2 }),
      (Math.random() - 0.5) * 1.2, 1.6 + Math.random() * 0.6, -1.8 + i * 0.9));
  }
  return g;
}

/* кольцо фей */
export function fairyRing(store) {
  const g = new THREE.Group();
  g.add(put(cyl(2.4, 2.5, 0.16, 20, 0x4f9e5a), 0, 0.08, 0));
  // грибы по кругу
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const m = new THREE.Group();
    m.add(put(cyl(0.09, 0.12, 0.5, 8, 0xf0e6d2), 0, 0.25, 0));
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      mat(i % 2 ? CAP_PURPLE : CAP_RED, { flatShading: false })
    );
    cap.scale.y = 0.6;
    m.add(put(cap, 0, 0.5, 0));
    m.position.set(Math.cos(a) * 2.0, 0.16, Math.sin(a) * 2.0);
    g.add(m);
  }
  // мерцающая пыльца в центре
  const motes = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const p = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.09, 0),
      new THREE.MeshStandardMaterial({
        color: 0xffe89a, emissive: 0xffd45a, emissiveIntensity: 1.3, flatShading: true,
      })
    );
    p.position.set(Math.cos(a) * 0.9, 0.7 + Math.sin(i) * 0.3, Math.sin(a) * 0.9);
    p.userData.a = a;
    g.add(p);
    motes.push(p);
  }
  store.motes = [...(store.motes || []), ...motes];
  const l = new THREE.PointLight(0xffd45a, 0.5, 7);
  l.position.set(0, 1.0, 0);
  g.add(l);
  return g;
}
