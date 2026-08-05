import * as THREE from "three";
import { box, cone, cyl, mat, put, sph } from "../../core/geometry";


/* ============================================================
   ПОСТРОЙКИ: ЗИМА
   ============================================================ */

const SNOW = 0xfaffff;
const ICE = 0x8fe8ff;

/* ёлка в снегу */
function firTree(scale = 1) {
  const g = new THREE.Group();
  g.add(put(cyl(0.16, 0.24, 0.9, 7, 0x6b4a34), 0, 0.45, 0));
  const tiers = [
    { r: 1.25, h: 1.3, y: 1.25 },
    { r: 1.0, h: 1.2, y: 2.1 },
    { r: 0.72, h: 1.1, y: 2.85 },
  ];
  tiers.forEach((tr, i) => {
    g.add(put(cone(tr.r, tr.h, 7, i === 2 ? 0x2f5f3f : 0x27543a), 0, tr.y, 0));
    // снежная шапка на ярусе
    const cap = cone(tr.r * 0.82, tr.h * 0.42, 7, SNOW);
    g.add(put(cap, 0, tr.y + tr.h * 0.3, 0));
  });
  g.add(put(sph(0.13, 0xf2c144), 0, 3.5, 0));
  g.scale.setScalar(scale);
  return g;
}

export function firGrove() {
  const g = new THREE.Group();
  [[0, 0, 1.0], [2.3, 1.5, 0.78], [-2.0, 1.2, 0.88], [0.9, -2.1, 0.7]].forEach(([x, z, s]) => {
    const t = firTree(s);
    t.position.set(x, 0, z);
    t.rotation.y = Math.random() * Math.PI;
    g.add(t);
  });
  // сугробы
  for (let i = 0; i < 5; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 1.6 + Math.random() * 1.6;
    const drift = sph(0.45 + Math.random() * 0.3, SNOW);
    drift.scale.set(1.5, 0.45, 1.3);
    g.add(put(drift, Math.cos(a) * r, 0.12, Math.sin(a) * r));
  }
  return g;
}

/* снеговик */
export function snowman() {
  const g = new THREE.Group();
  const base = new THREE.Group();
  base.add(put(sph(0.78, SNOW), 0, 0.7, 0));
  base.add(put(sph(0.56, SNOW), 0, 1.75, 0));
  base.add(put(sph(0.4, SNOW), 0, 2.6, 0));
  // лицо
  base.add(put(sph(0.06, 0x33373a), 0.16, 2.68, 0.34));
  base.add(put(sph(0.06, 0x33373a), -0.16, 2.68, 0.34));
  const nose = cone(0.08, 0.36, 6, 0xe0812f);
  nose.rotation.x = Math.PI / 2;
  base.add(put(nose, 0, 2.56, 0.5));
  for (let i = -1; i <= 1; i++) base.add(put(sph(0.05, 0x33373a), i * 0.13, 2.42 - Math.abs(i) * 0.04, 0.36));
  // пуговицы
  for (let i = 0; i < 3; i++) base.add(put(sph(0.07, 0x33373a), 0, 1.55 + i * 0.28, 0.5));
  // ведро вместо шляпы
  base.add(put(cyl(0.3, 0.26, 0.42, 10, 0x8d949a), 0, 3.1, 0));
  base.add(put(cyl(0.32, 0.32, 0.05, 10, 0x7f868c), 0, 2.9, 0));
  // руки-ветки
  for (const s of [-1, 1]) {
    const arm = cyl(0.05, 0.06, 1.1, 5, 0x6b4a34);
    arm.rotation.z = s * 1.0;
    base.add(put(arm, s * 0.75, 1.95, 0));
    const twig = cyl(0.03, 0.03, 0.35, 5, 0x6b4a34);
    twig.rotation.z = s * 0.4;
    base.add(put(twig, s * 1.22, 2.3, 0));
  }
  // шарф
  base.add(put(box(0.62, 0.16, 0.62, 0xd94f4f), 0, 2.22, 0));
  base.add(put(box(0.18, 0.5, 0.14, 0xd94f4f), 0.3, 2.0, 0.28));
  g.add(base);
  // снежные комья рядом
  g.add(put(sph(0.24, SNOW), 1.5, 0.2, 0.9));
  g.add(put(sph(0.18, SNOW), -1.3, 0.15, 1.1));
  return g;
}

/* каток */
export function iceRink(store) {
  const g = new THREE.Group();
  const rim = cyl(3.5, 3.6, 0.34, 20, 0xdce6ec);
  g.add(put(rim, 0, 0.17, 0));
  const ice = new THREE.Mesh(
    new THREE.CylinderGeometry(3.25, 3.25, 0.28, 20),
    mat(ICE, { roughness: 0.06, metalness: 0.35, transparent: true, opacity: 0.9, flatShading: false })
  );
  ice.receiveShadow = true;
  g.add(put(ice, 0, 0.26, 0));
  store.rinkIce = ice;
  // бортик
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    g.add(put(box(0.5, 0.42, 0.14, 0xfaf3e4), Math.cos(a) * 3.5, 0.5, Math.sin(a) * 3.5)).rotation;
    const b = g.children[g.children.length - 1];
    b.rotation.y = -a;
  }
  // гирлянда на столбиках
  const bulbs = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.add(put(cyl(0.07, 0.09, 2.2, 6, 0x8a6a4a), Math.cos(a) * 3.7, 1.1, Math.sin(a) * 3.7));
    const lamp = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.17, 0),
      new THREE.MeshStandardMaterial({
        color: [0xffd98a, 0xff8a8a, 0x8adcff][i % 3],
        emissive: [0xffb545, 0xff5a5a, 0x45c4ff][i % 3],
        emissiveIntensity: 1.2, flatShading: true,
      })
    );
    lamp.position.set(Math.cos(a) * 3.7, 2.3, Math.sin(a) * 3.7);
    g.add(lamp);
    bulbs.push(lamp);
  }
  store.rinkBulbs = bulbs;
  // ёлка в центре
  const tree = firTree(0.55);
  g.add(put(tree, 0, 0.4, 0));
  return g;
}

/* горнолыжный домик */
export function skiLodge() {
  const g = new THREE.Group();
  g.add(put(box(4.4, 2.6, 3.2, 0x9c6b45), 0, 1.3, 0));
  g.add(put(box(4.6, 0.4, 3.4, 0x7a5236), 0, 0.2, 0));
  // широкая двускатная крыша со снегом
  for (const s of [-1, 1]) {
    const slope = box(2.9, 0.24, 4.0, 0x6b4a34);
    slope.position.set(s * 1.2, 3.15, 0);
    slope.rotation.z = s * -0.52;
    g.add(slope);
    const snowCap = box(2.7, 0.22, 3.9, SNOW);
    snowCap.position.set(s * 1.28, 3.42, 0);
    snowCap.rotation.z = s * -0.52;
    g.add(snowCap);
  }
  g.add(put(box(0.3, 0.3, 4.1, 0x5a3e2c), 0, 3.86, 0));
  // тёплые окна
  for (const x of [-1.3, 1.3]) {
    g.add(put(box(1.0, 0.9, 0.12, 0xffd98a, { emissive: 0xffb545, emissiveIntensity: 0.9 }), x, 1.6, 1.63));
    g.add(put(box(1.15, 1.05, 0.05, 0xfaf3e4), x, 1.6, 1.58));
  }
  g.add(put(box(0.9, 1.6, 0.14, 0x5a3e2c), 0, 0.8, 1.65));
  // балкон
  g.add(put(box(4.6, 0.14, 0.9, 0x7a5236), 0, 2.3, 1.9));
  for (let i = -3; i <= 3; i++) g.add(put(box(0.1, 0.5, 0.1, 0x7a5236), i * 0.65, 2.55, 2.3));
  // труба с дымом
  g.add(put(box(0.5, 1.3, 0.5, 0x8d949a), 1.4, 3.9, -0.9));
  // лыжи у стены
  for (const s of [-1, 1]) {
    const ski = box(0.12, 1.9, 0.06, s > 0 ? 0xd94f4f : 0x4f7f9e);
    ski.rotation.z = s * 0.14;
    g.add(put(ski, 2.35 + s * 0.16, 0.95, 1.2));
  }
  return g;
}

/* поленница */
export function firewood() {
  const g = new THREE.Group();
  // навес
  for (const [x, z] of [[-1.5, -0.7], [1.5, -0.7], [-1.5, 0.7], [1.5, 0.7]]) {
    g.add(put(cyl(0.11, 0.13, 1.9, 6, 0x6b4a34), x, 0.95, z));
  }
  const roof = box(3.6, 0.16, 2.2, 0x5a3e2c);
  roof.rotation.x = 0.12;
  g.add(put(roof, 0, 2.0, 0));
  const snowTop = box(3.5, 0.18, 2.1, SNOW);
  snowTop.rotation.x = 0.12;
  g.add(put(snowTop, 0, 2.16, 0));
  // поленья торцами наружу
  for (let row = 0; row < 4; row++) {
    for (let i = 0; i < 7; i++) {
      const log = cyl(0.16, 0.16, 1.5, 7, row % 2 ? 0xa5713f : 0x8a5a37);
      log.rotation.x = Math.PI / 2;
      g.add(put(log, -1.05 + i * 0.35, 0.2 + row * 0.34, 0));
    }
  }
  // топор и колода
  g.add(put(cyl(0.42, 0.45, 0.6, 9, 0x8a5a37), 2.3, 0.3, 0.9));
  g.add(put(cyl(0.05, 0.05, 0.8, 5, 0x6b4a34), 2.3, 0.85, 0.9));
  g.add(put(box(0.34, 0.24, 0.09, 0x9aa2a8), 2.3, 1.2, 0.9));
  return g;
}

/* замёрзший пруд с лункой */
export function frozenPond(store) {
  const g = new THREE.Group();
  const hole = cyl(2.4, 2.4, 0.3, 16, 0xc9d2d8);
  g.add(put(hole, 0, 0.04, 0));
  const ice = new THREE.Mesh(
    new THREE.CylinderGeometry(2.25, 2.25, 0.24, 20),
    mat(ICE, { roughness: 0.05, metalness: 0.4, transparent: true, opacity: 0.88, flatShading: false })
  );
  g.add(put(ice, 0, 0.18, 0));
  store.rinkIce = store.rinkIce || ice;
  // трещины
  for (let i = 0; i < 5; i++) {
    const a = Math.random() * Math.PI * 2;
    const cr = box(0.05, 0.02, 1.2 + Math.random(), 0xdcecf2);
    cr.rotation.y = a;
    g.add(put(cr, Math.cos(a) * 0.6, 0.31, Math.sin(a) * 0.6));
  }
  // камыш и сугробы по краю
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const drift = sph(0.4, SNOW);
    drift.scale.set(1.6, 0.4, 1.2);
    g.add(put(drift, Math.cos(a) * 2.6, 0.14, Math.sin(a) * 2.6));
    if (i % 3 === 0) {
      g.add(put(cyl(0.03, 0.04, 1.0, 4, 0xb5a06a), Math.cos(a) * 2.5, 0.6, Math.sin(a) * 2.5));
      g.add(put(cyl(0.08, 0.08, 0.24, 6, 0x8a6a4a), Math.cos(a) * 2.5, 1.2, Math.sin(a) * 2.5));
    }
  }
  // прорубь для рыбалки
  const holeIce = cyl(0.42, 0.42, 0.12, 10, 0x3a7f9e);
  g.add(put(holeIce, 1.2, 0.24, -0.8));
  return g;
}

/* ============================================================
   ПОСТРОЙКИ: НОЧНОЙ ГОРОД
   ============================================================ */

/* ночной клуб с неоном */
export function nightClub(store) {
  const g = new THREE.Group();
  g.add(put(box(5.0, 3.0, 3.6, 0x2e2a3a), 0, 1.5, 0));
  g.add(put(box(5.3, 0.3, 3.9, 0x201d2c), 0, 3.15, 0));

  const neons = [];
  const mkNeon = (w, h, d, color, x, y, z) => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.6, flatShading: true })
    );
    m.position.set(x, y, z);
    g.add(m);
    neons.push(m);
    return m;
  };
  // неоновая вывеска
  mkNeon(3.2, 0.5, 0.14, 0xff3fa4, 0, 2.6, 1.85);
  mkNeon(0.16, 1.6, 0.12, 0x3fe0ff, -2.3, 1.7, 1.85);
  mkNeon(0.16, 1.6, 0.12, 0x3fe0ff, 2.3, 1.7, 1.85);
  mkNeon(2.2, 0.14, 0.12, 0xffe23f, 0, 1.0, 1.85);
  // подсветка входа
  const door = box(1.4, 1.9, 0.16, 0x14121c);
  g.add(put(door, 0, 0.95, 1.86));
  mkNeon(1.6, 0.1, 0.1, 0xff3fa4, 0, 1.95, 1.95);
  store.neons = [...(store.neons || []), ...neons];

  // прожекторы на крыше
  const beams = [];
  for (const s of [-1, 1]) {
    const beam = new THREE.Mesh(
      new THREE.ConeGeometry(0.5, 4.5, 8, 1, true),
      mat(0x8fd8ff, { transparent: true, opacity: 0.18, flatShading: false })
    );
    beam.position.set(s * 1.6, 5.4, 0);
    beam.rotation.z = s * 0.3;
    g.add(beam);
    beams.push({ mesh: beam, side: s });
    const l = new THREE.PointLight(0x6fc8ff, 0.6, 9);
    l.position.set(s * 1.6, 3.4, 0);
    g.add(l);
  }
  store.clubBeams = [...(store.clubBeams || []), ...beams];
  // очередь-канат
  for (const x of [-1.6, 1.6]) {
    g.add(put(cyl(0.09, 0.11, 0.9, 8, 0xc9a05a), x, 0.45, 2.6));
    g.add(put(sph(0.1, 0xc9a05a), x, 0.95, 2.6));
  }
  g.add(put(box(3.1, 0.05, 0.05, 0x8a2a4a), 0, 0.85, 2.6));
  return g;
}

/* фудтрак */
export function foodTruck(store) {
  const g = new THREE.Group();
  g.add(put(box(1.9, 1.6, 3.6, 0xf2c144), 0, 1.2, 0));
  // кабина
  g.add(put(box(1.8, 1.1, 1.2, 0xe0a83c), 0, 0.95, 2.2));
  g.add(put(box(1.6, 0.6, 0.1, 0xcfe4ec, { transparent: true, opacity: 0.75 }), 0, 1.25, 2.78));
  // окно выдачи
  g.add(put(box(0.12, 1.0, 2.2, 0x2e2a24), 0.96, 1.35, -0.2));
  const glow = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.9, 2.0),
    new THREE.MeshStandardMaterial({ color: 0xffe9b8, emissive: 0xffc46b, emissiveIntensity: 1.3, flatShading: true })
  );
  glow.position.set(1.0, 1.35, -0.2);
  g.add(glow);
  store.neons = [...(store.neons || []), glow];
  // навес
  const awn = box(0.1, 1.2, 2.2, 0xd94f4f);
  awn.rotation.z = -0.9;
  g.add(put(awn, 1.5, 2.1, -0.2));
  // колёса
  for (const [wx, wz] of [[-0.85, 1.2], [0.85, 1.2], [-0.85, -1.2], [0.85, -1.2]]) {
    const pivot = new THREE.Group();
    pivot.position.set(wx, 0.35, wz);
    pivot.rotation.z = Math.PI / 2;
    pivot.add(cyl(0.35, 0.35, 0.2, 8, 0x2e3236));
    g.add(pivot);
  }
  // столики
  for (const [x, z] of [[2.6, 0.8], [2.8, -1.0]]) {
    g.add(put(cyl(0.45, 0.42, 0.1, 8, 0xd6cdbb), x, 0.75, z));
    g.add(put(cyl(0.08, 0.08, 0.75, 6, 0x8d949a), x, 0.38, z));
    for (const s of [-1, 1]) g.add(put(cyl(0.22, 0.2, 0.5, 8, 0x8a6a4a), x + s * 0.75, 0.25, z));
  }
  return g;
}

/* игровой автомат-салон */
export function arcade(store) {
  const g = new THREE.Group();
  g.add(put(box(4.2, 2.8, 3.0, 0x24304a), 0, 1.4, 0));
  g.add(put(box(4.5, 0.28, 3.3, 0x1a2438), 0, 2.94, 0));
  const neons = [];
  const strip = (w, h, color, x, y, z) => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, 0.12),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.5, flatShading: true })
    );
    m.position.set(x, y, z);
    g.add(m);
    neons.push(m);
  };
  strip(3.4, 0.6, 0xff5ac4, 0, 2.35, 1.56);
  strip(2.6, 0.12, 0x5affd4, 0, 1.9, 1.56);
  for (let i = -2; i <= 2; i++) strip(0.1, 1.5, i % 2 ? 0xffd45a : 0x5ac8ff, i * 0.85, 1.0, 1.56);
  // витрина
  g.add(put(box(3.0, 1.4, 0.1, 0x3fd8ff, { transparent: true, opacity: 0.35, emissive: 0x1a6a8a, emissiveIntensity: 0.6 }), 0, 1.1, 1.52));
  store.neons = [...(store.neons || []), ...neons];
  // автоматы у входа
  for (const x of [-1.5, 1.5]) {
    g.add(put(box(0.7, 1.5, 0.6, 0x2e2a3a), x, 0.75, 2.0));
    const scr = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.5, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x8fd8ff, emissive: 0x3fa8d8, emissiveIntensity: 1.1, flatShading: true })
    );
    scr.position.set(x, 1.15, 2.32);
    g.add(scr);
    neons.push(scr);
  }
  return g;
}

/* ============================================================
   АТМОСФЕРА: снег и звёзды
   ============================================================ */
export function makeSnow(radius, count = 260, color = 0xffffff, size = 0.26) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const spd = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * radius;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = Math.random() * 16;
    pos[i * 3 + 2] = Math.sin(a) * r;
    spd[i] = 0.6 + Math.random() * 1.1;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({
    color, size, transparent: true, opacity: 0.85, depthWrite: false,
  });
  const points = new THREE.Points(geo, m);
  points.userData = { spd, count, radius };
  return points;
}

export function makeStars(radius = 90, count = 320) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const y = Math.random() * 0.75 + 0.12;
    const rr = Math.sqrt(1 - y * y) * radius;
    pos[i * 3] = Math.cos(a) * rr;
    pos[i * 3 + 1] = y * radius;
    pos[i * 3 + 2] = Math.sin(a) * rr;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({
    color: 0xffffff, size: 0.7, transparent: true, opacity: 0.9, depthWrite: false, sizeAttenuation: true,
  });
  return new THREE.Points(geo, m);
}

export function makeMoon() {
  const g = new THREE.Group();
  const moon = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.6, 1),
    new THREE.MeshBasicMaterial({ color: 0xf2f0e0 })
  );
  g.add(moon);
  const halo = new THREE.Mesh(
    new THREE.IcosahedronGeometry(3.8, 1),
    new THREE.MeshBasicMaterial({ color: 0xbfd0e8, transparent: true, opacity: 0.16 })
  );
  g.add(halo);
  g.position.set(-26, 24, -34);
  return g;
}
