import * as THREE from "three";
import { C, box, cone, cyl, mat, put, sph } from "../../core/geometry";
import { ASPHALT_LIGHT, GLASS_BLUE } from "./town";


/* ============================================================
   ПАРАМЕТРИЧЕСКИЕ ПОСТРОЙКИ
   Один конструктор даёт десятки вариантов — так наращиваем
   количество зданий без сотен уникальных моделей
   ============================================================ */

/* жилой дом: этажи, тип крыши, крыльцо, труба */
export function dwelling(o = {}) {
  const {
    w = 3.2, d = 2.8, floors = 1, fh = 1.75,
    body = 0xf3e3cd, roof = 0xa8563f, roofType = "gable",
    porch = true, chimney = false, balcony = false,
  } = o;
  const g = new THREE.Group();
  const H = floors * fh;

  g.add(put(box(w, H, d, body), 0, H / 2, 0));
  // цоколь
  g.add(put(box(w + 0.16, 0.3, d + 0.16, 0xc9c2b4), 0, 0.15, 0));

  if (roofType === "gable") {
    for (const s of [-1, 1]) {
      const slope = box(w * 0.66, 0.2, d + 0.4, roof);
      slope.position.set(s * (w * 0.27), H + 0.62, 0);
      slope.rotation.z = s * -0.6;
      g.add(slope);
    }
    g.add(put(box(0.26, 0.2, d + 0.5, roof), 0, H + 1.08, 0));
    for (const z of [-d / 2, d / 2]) {
      const gable = new THREE.Mesh(new THREE.ConeGeometry(w * 0.62, w * 0.42, 3), mat(body));
      gable.rotation.y = Math.PI / 2;
      gable.scale.set(1, 1, 0.05);
      gable.castShadow = true;
      g.add(put(gable, 0, H + 0.42, z));
    }
  } else if (roofType === "hip") {
    const r = cone(Math.max(w, d) * 0.78, 1.3, 4, roof);
    r.rotation.y = Math.PI / 4;
    g.add(put(r, 0, H + 0.62, 0));
  } else {
    g.add(put(box(w + 0.3, 0.24, d + 0.3, roof), 0, H + 0.12, 0));
    g.add(put(box(w + 0.32, 0.22, 0.2, roof), 0, H + 0.32, d / 2 + 0.14));
  }

  // окна по этажам
  const cols = w > 3.6 ? 3 : 2;
  for (let f = 0; f < floors; f++) {
    const y = f * fh + fh * 0.62;
    for (let c = 0; c < cols; c++) {
      const x = (c - (cols - 1) / 2) * (w / (cols + 0.4));
      if (f === 0 && porch && Math.abs(x) < 0.35) continue;
      g.add(put(box(0.62, 0.72, 0.1, GLASS_BLUE, { emissive: 0x2a4d5a, emissiveIntensity: 0.22 }), x, y, d / 2 + 0.03));
      g.add(put(box(0.72, 0.82, 0.05, 0xfaf3e4), x, y, d / 2 + 0.005));
    }
    for (const s of [-1, 1]) {
      g.add(put(box(0.06, 0.68, 0.6, GLASS_BLUE, { emissive: 0x2a4d5a, emissiveIntensity: 0.2 }), s * (w / 2 + 0.02), y, 0));
    }
  }

  if (porch) {
    g.add(put(box(0.8, 1.45, 0.12, 0x8a5a37), 0, 0.72, d / 2 + 0.04));
    g.add(put(sph(0.06, C.gold), 0.28, 0.75, d / 2 + 0.12));
    g.add(put(box(1.5, 0.16, 0.8, C.wood), 0, 0.08, d / 2 + 0.45));
    for (const s of [-1, 1]) g.add(put(box(0.11, 1.0, 0.11, C.wood), s * 0.62, 0.6, d / 2 + 0.78));
    const canopy = box(1.7, 0.14, 1.0, roof);
    g.add(put(canopy, 0, 1.15, d / 2 + 0.6));
  }
  if (balcony) {
    const y = fh + 0.15;
    g.add(put(box(w * 0.7, 0.12, 0.7, 0xe0d2b8), 0, y, d / 2 + 0.35));
    g.add(put(box(w * 0.7, 0.36, 0.07, 0xd8c9a8), 0, y + 0.24, d / 2 + 0.68));
  }
  if (chimney) {
    g.add(put(box(0.42, 1.2, 0.42, 0xb0764a), w * 0.28, H + 0.9, -d * 0.25));
    g.add(put(box(0.5, 0.16, 0.5, 0x8a5a37), w * 0.28, H + 1.55, -d * 0.25));
  }
  return g;
}

/* общественное здание: школа, больница, мэрия, пожарная часть */
export function civic(o = {}) {
  const {
    w = 5.0, d = 3.2, floors = 2, body = 0xf0e6d2, roof = 0xa8927a,
    tower = false, clock = false, columns = false, accent = 0xd94f4f, doors = 1,
  } = o;
  const g = new THREE.Group();
  const fh = 1.7;
  const H = floors * fh;

  g.add(put(box(w, H, d, body), 0, H / 2, 0));
  // боковые крылья
  for (const s of [-1, 1]) {
    g.add(put(box(w * 0.3, H * 0.8, d * 1.25, body), s * (w / 2 - w * 0.13), H * 0.4, 0));
  }
  g.add(put(box(w + 0.35, 0.26, d * 1.32, roof), 0, H + 0.13, 0));
  g.add(put(box(w + 0.2, 0.3, d + 0.2, 0xd6cdbb), 0, 0.15, 0));

  // ленты окон
  for (let f = 0; f < floors; f++) {
    const y = f * fh + fh * 0.6;
    for (let c = -3; c <= 3; c++) {
      g.add(put(box(0.5, 0.8, 0.1, GLASS_BLUE, { emissive: 0x2a4d5a, emissiveIntensity: 0.25 }), c * 0.72, y, d / 2 + 0.03));
    }
  }

  // вход
  for (let i = 0; i < doors; i++) {
    const dx = doors === 1 ? 0 : (i - 0.5) * 1.6;
    g.add(put(box(doors === 1 ? 1.1 : 1.3, 1.6, 0.14, i % 2 ? 0x8a5a37 : accent), dx, 0.8, d / 2 + 0.05));
  }
  g.add(put(box(w * 0.55, 0.18, 1.1, accent), 0, 2.0, d / 2 + 0.5));
  for (const s of [-1, 1]) g.add(put(cyl(0.1, 0.1, 1.9, 8, 0xd6cdbb), s * (w * 0.22), 0.95, d / 2 + 0.95));

  if (columns) {
    for (let i = -2; i <= 2; i++) {
      g.add(put(cyl(0.19, 0.22, H * 0.95, 10, 0xfaf3e4), i * 1.0, H * 0.48, d / 2 + 0.55));
    }
    const ped = new THREE.Mesh(new THREE.ConeGeometry(w * 0.42, 0.9, 3), mat(body));
    ped.rotation.y = Math.PI / 2;
    ped.scale.set(1, 1, 0.08);
    g.add(put(ped, 0, H + 0.6, d / 2 + 0.55));
  }
  if (tower) {
    g.add(put(box(1.5, H + 1.6, 1.5, body), 0, (H + 1.6) / 2, -d * 0.1));
    g.add(put(cone(1.15, 1.5, 4, roof), 0, H + 2.4, -d * 0.1));
    if (clock) {
      const face = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.42, 0.1, 14),
        new THREE.MeshStandardMaterial({ color: 0xfaf3e4, emissive: 0xd8c9a8, emissiveIntensity: 0.3, flatShading: true })
      );
      face.rotation.x = Math.PI / 2;
      g.add(put(face, 0, H + 0.9, -d * 0.1 + 0.78));
      g.add(put(box(0.05, 0.3, 0.04, 0x33373a), 0, H + 1.0, -d * 0.1 + 0.84));
      g.add(put(box(0.22, 0.05, 0.04, 0x33373a), 0.08, H + 0.9, -d * 0.1 + 0.84));
    }
  }
  return g;
}

/* амбар */
export function barn() {
  const g = new THREE.Group();
  g.add(put(box(4.2, 2.8, 3.2, 0xb5453a), 0, 1.4, 0));
  // ломаная крыша
  for (const s of [-1, 1]) {
    const lower = box(1.5, 0.2, 3.5, 0x8a3a30);
    lower.position.set(s * 1.55, 3.1, 0);
    lower.rotation.z = s * -0.85;
    g.add(lower);
    const upper = box(1.5, 0.2, 3.5, 0x8a3a30);
    upper.position.set(s * 0.65, 3.95, 0);
    upper.rotation.z = s * -0.38;
    g.add(upper);
  }
  g.add(put(box(0.24, 0.2, 3.6, 0x6e2e26), 0, 4.2, 0));
  // белая отделка и ворота
  for (const s of [-1, 1]) g.add(put(box(0.16, 2.8, 0.16, 0xfaf3e4), s * 2.05, 1.4, 1.6));
  g.add(put(box(2.0, 2.0, 0.14, 0x8a5a37), 0, 1.0, 1.63));
  g.add(put(box(2.1, 0.14, 0.06, 0xfaf3e4), 0, 1.0, 1.71));
  g.add(put(box(0.14, 2.0, 0.06, 0xfaf3e4), 0, 1.0, 1.71));
  // сеновал
  g.add(put(box(0.9, 0.8, 0.12, 0x6e2e26), 0, 3.2, 1.62));
  g.add(put(box(0.5, 0.12, 0.7, C.wood), 0, 3.7, 2.0));
  return g;
}

/* часовня с колокольней */
export function chapel() {
  const g = new THREE.Group();
  g.add(put(box(2.8, 2.6, 4.2, 0xfaf3e4), 0, 1.3, 0));
  for (const s of [-1, 1]) {
    const slope = box(1.9, 0.2, 4.4, 0x6b7f8e);
    slope.position.set(s * 0.78, 2.95, 0);
    slope.rotation.z = s * -0.62;
    g.add(slope);
  }
  g.add(put(box(0.22, 0.2, 4.5, 0x55697a), 0, 3.42, 0));
  // башня
  g.add(put(box(1.5, 4.2, 1.5, 0xfaf3e4), 0, 2.1, 2.6));
  g.add(put(box(1.7, 0.18, 1.7, 0x6b7f8e), 0, 4.28, 2.6));
  // звонница
  for (const [x, z] of [[-0.6, 2.0], [0.6, 2.0], [-0.6, 3.2], [0.6, 3.2]]) {
    g.add(put(box(0.14, 1.1, 0.14, 0xfaf3e4), x, 4.9, z));
  }
  g.add(put(cone(1.2, 1.8, 4, 0x55697a), 0, 6.3, 2.6));
  g.add(put(sph(0.14, C.gold), 0, 7.3, 2.6));
  const bell = cone(0.26, 0.36, 8, 0xc9a05a);
  g.add(put(bell, 0, 5.1, 2.6));
  // стрельчатые окна
  for (const z of [-1.2, 0, 1.2]) {
    for (const s of [-1, 1]) {
      g.add(put(box(0.06, 1.1, 0.45, 0x8fc0dc, { emissive: 0x3a5a7a, emissiveIntensity: 0.35 }), s * 1.42, 1.5, z));
    }
  }
  g.add(put(box(0.85, 1.5, 0.12, 0x8a5a37), 0, 0.75, 3.38));
  return g;
}

/* стога сена */
export function haystacks() {
  const g = new THREE.Group();
  [[0, 0, 1.0], [1.9, 1.1, 0.8], [-1.6, 1.3, 0.7]].forEach(([x, z, s]) => {
    const st = new THREE.Group();
    st.add(put(cyl(0.95, 1.15, 1.3, 10, 0xd9b45c), 0, 0.65, 0));
    st.add(put(cone(1.1, 1.0, 10, 0xc79f46), 0, 1.8, 0));
    st.scale.setScalar(s);
    st.position.set(x, 0, z);
    g.add(st);
  });
  // вилы и тюки
  g.add(put(box(1.0, 0.6, 0.7, 0xe0c476), 2.2, 0.3, -1.4));
  g.add(put(box(1.0, 0.6, 0.7, 0xe0c476), 2.2, 0.9, -1.4));
  g.add(put(cyl(0.05, 0.05, 1.6, 6, C.wood), 1.2, 0.8, -1.9));
  return g;
}

/* торговая лавка */
export function marketStall() {
  const g = new THREE.Group();
  g.add(put(box(2.6, 0.95, 1.1, C.wood), 0, 0.48, 0));
  g.add(put(box(2.8, 0.12, 1.3, 0xc9a05a), 0, 1.02, 0));
  for (const x of [-1.2, 1.2]) {
    g.add(put(cyl(0.08, 0.08, 2.2, 6, C.woodDark), x, 1.1, -0.45));
    g.add(put(cyl(0.08, 0.08, 2.2, 6, C.woodDark), x, 1.1, 0.45));
  }
  // полосатый тент
  for (let i = -3; i <= 3; i++) {
    const stripe = box(0.4, 0.1, 1.7, i % 2 ? 0xd94f4f : 0xfaf3e4);
    stripe.rotation.x = -0.15;
    g.add(put(stripe, i * 0.42, 2.25, 0.1));
  }
  // товар
  const goods = [0xe4573f, 0xf2b544, 0x8e63c4, 0x67b25a];
  for (let i = 0; i < 4; i++) {
    g.add(put(box(0.5, 0.28, 0.42, C.wood), -0.95 + i * 0.62, 1.2, 0.1));
    for (let j = 0; j < 3; j++) {
      g.add(put(sph(0.11, goods[i]), -0.95 + i * 0.62 + (j - 1) * 0.14, 1.4, 0.1));
    }
  }
  return g;
}

/* пасека */
export function beehives() {
  const g = new THREE.Group();
  [[0, 0], [1.5, 0.7], [-1.4, 0.5], [0.4, -1.5]].forEach(([x, z], i) => {
    const h = new THREE.Group();
    const col = [0xf2d06a, 0xdfe8e0, 0xc7d9e8, 0xe8c9a0][i % 4];
    h.add(put(box(0.9, 0.16, 0.8, 0x8a6a4a), 0, 0.16, 0));
    for (let k = 0; k < 3; k++) h.add(put(box(0.82, 0.38, 0.72, col), 0, 0.42 + k * 0.4, 0));
    h.add(put(box(1.0, 0.14, 0.9, 0x8a5a37), 0, 1.68, 0));
    h.add(put(box(0.4, 0.06, 0.05, 0x6b4226), 0, 0.32, 0.38));
    h.position.set(x, 0, z);
    h.rotation.y = Math.random() * 0.6 - 0.3;
    g.add(h);
  });
  // цветочная поляна вокруг
  for (let i = 0; i < 10; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 2.0 + Math.random() * 0.9;
    g.add(put(cone(0.1, 0.26, 5, C.leaf), Math.cos(a) * r, 0.14, Math.sin(a) * r));
    g.add(put(sph(0.09, [0xf2c144, 0xd4789e, 0xa96bd4][i % 3]), Math.cos(a) * r, 0.34, Math.sin(a) * r));
  }
  return g;
}

/* загон с овцами */
export function pen() {
  const g = new THREE.Group();
  const R = 2.7;
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    if (a > 1.2 && a < 1.9) continue; // проём
    g.add(put(box(0.14, 0.9, 0.14, C.wood), Math.cos(a) * R, 0.45, Math.sin(a) * R));
    const b = ((i + 1) / 14) * Math.PI * 2;
    const x1 = Math.cos(a) * R, z1 = Math.sin(a) * R;
    const x2 = Math.cos(b) * R, z2 = Math.sin(b) * R;
    const len = Math.hypot(x2 - x1, z2 - z1);
    for (const y of [0.35, 0.68]) {
      const rail = box(len, 0.09, 0.07, C.woodDark);
      rail.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
      rail.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
      g.add(rail);
    }
  }
  // овцы
  [[0.5, 0.3], [-0.9, -0.6], [0.2, -1.3]].forEach(([x, z]) => {
    const s = new THREE.Group();
    const wool = sph(0.44, 0xfaf3e4);
    wool.scale.set(1.25, 1, 1);
    s.add(put(wool, 0, 0.55, 0));
    s.add(put(sph(0.2, 0x44403c), 0.46, 0.66, 0));
    s.add(put(sph(0.09, 0x44403c), 0.5, 0.82, 0.12));
    s.add(put(sph(0.09, 0x44403c), 0.5, 0.82, -0.12));
    for (const [lx, lz] of [[-0.22, 0.2], [0.22, 0.2], [-0.22, -0.2], [0.22, -0.2]]) {
      s.add(put(box(0.1, 0.34, 0.1, 0x44403c), lx, 0.17, lz));
    }
    s.position.set(x, 0, z);
    s.rotation.y = Math.random() * Math.PI * 2;
    g.add(s);
  });
  // кормушка
  g.add(put(box(1.2, 0.3, 0.5, C.wood), -1.6, 0.2, 1.2));
  g.add(put(box(1.0, 0.2, 0.3, 0xd9b45c), -1.6, 0.4, 1.2));
  return g;
}

/* мостик через ручей */
export function bridge() {
  const g = new THREE.Group();
  // ручей
  const water = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.16, 7.0),
    mat(C.water, { roughness: 0.1, transparent: true, opacity: 0.85, flatShading: false })
  );
  g.add(put(water, 0, 0.06, 0));
  for (let i = 0; i < 12; i++) {
    const z = -3.2 + i * 0.6;
    g.add(put(sph(0.2 + Math.random() * 0.12, C.stone), (Math.random() < 0.5 ? -1 : 1) * (1.1 + Math.random() * 0.3), 0.14, z));
  }
  // настил дугой
  for (let i = 0; i < 9; i++) {
    const tt = i / 8;
    const z = -1.9 + tt * 3.8;
    const y = 0.5 + Math.sin(tt * Math.PI) * 0.45;
    const plank = box(2.2, 0.14, 0.46, i % 2 ? C.wood : 0xa5713f);
    plank.rotation.x = Math.cos(tt * Math.PI) * 0.28;
    g.add(put(plank, 0, y, z));
  }
  // перила
  for (const s of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const tt = i / 4;
      const z = -1.8 + tt * 3.6;
      const y = 0.5 + Math.sin(tt * Math.PI) * 0.45;
      g.add(put(box(0.1, 0.7, 0.1, C.woodDark), s * 1.0, y + 0.35, z));
    }
    for (let i = 0; i < 4; i++) {
      const t1 = i / 4, t2 = (i + 1) / 4;
      const z1 = -1.8 + t1 * 3.6, z2 = -1.8 + t2 * 3.6;
      const y1 = 0.5 + Math.sin(t1 * Math.PI) * 0.45 + 0.68;
      const y2 = 0.5 + Math.sin(t2 * Math.PI) * 0.45 + 0.68;
      const len = Math.hypot(z2 - z1, y2 - y1);
      const rail = box(0.08, 0.08, len, C.woodDark);
      rail.position.set(s * 1.0, (y1 + y2) / 2, (z1 + z2) / 2);
      rail.rotation.x = -Math.atan2(y2 - y1, z2 - z1);
      g.add(rail);
    }
  }
  return g;
}

/* заправка */
export function gasStation() {
  const g = new THREE.Group();
  const pad = box(6.0, 0.2, 4.6, ASPHALT_LIGHT);
  g.add(put(pad, 0, 0.14, 0));
  // магазинчик
  g.add(put(box(2.6, 2.4, 2.2, 0xf0e6d2), -1.8, 1.2, -1.0));
  g.add(put(box(2.9, 0.24, 2.5, 0xd94f4f), -1.8, 2.5, -1.0));
  g.add(put(box(1.8, 1.2, 0.1, GLASS_BLUE, { transparent: true, opacity: 0.65 }), -1.8, 1.3, 0.13));
  // навес
  for (const [x, z] of [[1.4, -1.4], [1.4, 1.4], [3.6, -1.4], [3.6, 1.4]]) {
    g.add(put(cyl(0.14, 0.16, 2.9, 8, 0xd6cdbb), x, 1.45, z));
  }
  g.add(put(box(3.6, 0.3, 4.0, 0xfaf3e4), 2.5, 3.05, 0));
  g.add(put(box(3.7, 0.24, 0.3, 0xd94f4f), 2.5, 2.8, 2.05));
  // колонки
  for (const z of [-0.8, 0.8]) {
    g.add(put(box(0.5, 1.3, 0.7, 0xe8e2d6), 2.5, 0.75, z));
    g.add(put(box(0.36, 0.4, 0.06, 0x33373a), 2.5, 1.15, z + 0.38));
    g.add(put(cyl(0.05, 0.05, 0.5, 6, 0x44484c), 2.9, 1.1, z));
  }
  // ценник
  g.add(put(cyl(0.1, 0.1, 2.6, 6, 0xd6cdbb), -3.4, 1.3, 1.8));
  const price = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.9, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x3f6244, emissive: 0x2a4a30, emissiveIntensity: 0.5, flatShading: true })
  );
  price.position.set(-3.4, 2.9, 1.8);
  g.add(price);
  return g;
}

/* спортплощадка */
export function sportsField() {
  const g = new THREE.Group();
  const field = box(6.4, 0.18, 4.4, 0x5f9e4f);
  g.add(put(field, 0, 0.14, 0));
  // разметка
  g.add(put(box(0.1, 0.03, 4.2, 0xfaf3e4), 0, 0.24, 0));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.045, 6, 20), mat(0xfaf3e4));
  ring.rotation.x = Math.PI / 2;
  g.add(put(ring, 0, 0.24, 0));
  for (const s of [-1, 1]) {
    g.add(put(box(0.1, 0.03, 2.2, 0xfaf3e4), s * 3.1, 0.24, 0));
    // ворота
    g.add(put(box(0.1, 1.0, 0.1, 0xfaf3e4), s * 3.05, 0.6, -0.9));
    g.add(put(box(0.1, 1.0, 0.1, 0xfaf3e4), s * 3.05, 0.6, 0.9));
    g.add(put(box(0.1, 0.1, 1.9, 0xfaf3e4), s * 3.05, 1.1, 0));
    const net = box(0.06, 0.95, 1.8, 0xd6cdbb, { transparent: true, opacity: 0.5 });
    g.add(put(net, s * 3.3, 0.58, 0));
  }
  // мяч и трибунка
  g.add(put(sph(0.2, 0xfaf3e4), 1.2, 0.35, 0.6));
  for (let r = 0; r < 2; r++) {
    g.add(put(box(4.0, 0.16, 0.5, 0xc9a05a), 0, 0.35 + r * 0.42, 2.7 + r * 0.5));
    g.add(put(box(4.0, 0.42, 0.1, 0xb08d4a), 0, 0.55 + r * 0.42, 2.95 + r * 0.5));
  }
  // ограждение
  for (const s of [-1, 1]) {
    for (let i = -3; i <= 3; i++) {
      g.add(put(box(0.07, 1.1, 0.07, 0x8d949a), i * 1.05, 0.55, s * 2.35));
    }
  }
  return g;
}

/* беседка */
export function gazebo() {
  const g = new THREE.Group();
  const R = 1.7;
  g.add(put(cyl(R + 0.3, R + 0.4, 0.35, 6, 0xd6cdbb), 0, 0.18, 0));
  g.add(put(cyl(R + 0.1, R + 0.1, 0.14, 6, C.wood), 0, 0.4, 0));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.add(put(cyl(0.1, 0.1, 2.3, 6, 0xfaf3e4), Math.cos(a) * R, 1.6, Math.sin(a) * R));
    // перила между стойками
    const b = ((i + 1) / 6) * Math.PI * 2;
    if (i !== 0) {
      const x1 = Math.cos(a) * R, z1 = Math.sin(a) * R;
      const x2 = Math.cos(b) * R, z2 = Math.sin(b) * R;
      const len = Math.hypot(x2 - x1, z2 - z1);
      const rail = box(len, 0.5, 0.08, 0xfaf3e4);
      rail.position.set((x1 + x2) / 2, 0.85, (z1 + z2) / 2);
      rail.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
      g.add(rail);
    }
  }
  const roof = cone(R + 0.65, 1.2, 6, 0x8a6a4a);
  g.add(put(roof, 0, 3.35, 0));
  g.add(put(sph(0.16, C.gold), 0, 4.05, 0));
  // скамейка внутри
  g.add(put(box(1.6, 0.12, 0.45, C.wood), 0, 0.75, -0.8));
  return g;
}

/* волейбольная площадка */
export function volleyball() {
  const g = new THREE.Group();
  const court = box(5.0, 0.16, 3.4, 0xe8d5a8);
  g.add(put(court, 0, 0.13, 0));
  for (const s of [-1, 1]) {
    g.add(put(cyl(0.08, 0.1, 2.4, 6, 0xd6cdbb), 0, 1.2, s * 1.7));
  }
  const net = box(0.06, 0.85, 3.4, 0xfaf3e4, { transparent: true, opacity: 0.55 });
  g.add(put(net, 0, 1.6, 0));
  g.add(put(box(0.08, 0.1, 3.4, 0xfaf3e4), 0, 2.05, 0));
  // разметка
  for (const s of [-1, 1]) {
    g.add(put(box(0.06, 0.03, 3.3, 0xfaf3e4), s * 2.4, 0.22, 0));
    g.add(put(box(4.8, 0.03, 0.06, 0xfaf3e4), 0, 0.22, s * 1.65));
  }
  g.add(put(sph(0.22, 0xfaf3e4), 1.6, 0.38, 0.8));
  return g;
}

/* набережная */
export function promenade() {
  const g = new THREE.Group();
  const len = 9.0;
  g.add(put(box(2.4, 0.22, len, 0xe8e0cf), 0, 0.16, 0));
  for (let i = 0; i < 10; i++) {
    g.add(put(box(2.3, 0.03, 0.08, 0xcfc5b0), 0, 0.28, -len / 2 + i * (len / 9)));
  }
  // перила со стороны воды
  for (let i = 0; i < 8; i++) {
    g.add(put(cyl(0.07, 0.07, 0.9, 6, 0xfaf3e4), 1.1, 0.65, -len / 2 + 0.6 + i * 1.15));
  }
  g.add(put(box(0.1, 0.1, len - 0.6, 0xfaf3e4), 1.1, 1.12, 0));
  // фонари и скамейки
  for (const z of [-2.6, 1.4]) {
    g.add(put(cyl(0.08, 0.1, 2.6, 6, 0xd6cdbb), -0.9, 1.3, z));
    const lamp = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.2, 0),
      new THREE.MeshStandardMaterial({ color: 0xffe9b8, emissive: 0xffc46b, emissiveIntensity: 1.0, flatShading: true })
    );
    lamp.position.set(-0.9, 2.7, z);
    g.add(lamp);
    g.add(put(box(0.5, 0.1, 1.4, C.wood), 0.3, 0.55, z + 1.2));
    g.add(put(box(0.5, 0.45, 0.08, C.wood), 0.52, 0.75, z + 1.2));
  }
  return g;
}

/* бунгало */
export function bungalow(color = 0xf6ecd8) {
  const g = new THREE.Group();
  // сваи
  for (const [x, z] of [[-1.3, -1.1], [1.3, -1.1], [-1.3, 1.1], [1.3, 1.1]]) {
    g.add(put(cyl(0.14, 0.16, 0.9, 7, C.woodDark), x, 0.45, z));
  }
  g.add(put(box(3.2, 0.22, 2.6, C.wood), 0, 1.0, 0));
  g.add(put(box(2.8, 1.8, 2.2, color), 0, 2.0, -0.2));
  // соломенная крыша
  const th = cone(2.5, 1.3, 4, 0xd0a94a);
  th.rotation.y = Math.PI / 4;
  g.add(put(th, 0, 3.5, -0.1));
  const th2 = cone(2.0, 0.8, 4, 0xc39a3e);
  th2.rotation.y = Math.PI / 4;
  g.add(put(th2, 0, 4.0, -0.1));
  // веранда
  g.add(put(box(3.2, 0.12, 0.9, C.wood), 0, 1.1, 1.2));
  for (const x of [-1.35, 1.35]) g.add(put(cyl(0.09, 0.09, 1.5, 6, C.woodDark), x, 1.85, 1.5));
  g.add(put(box(3.3, 0.5, 0.08, 0xd8c9a8), 0, 1.4, 1.62));
  // окно и дверь
  g.add(put(box(0.8, 1.2, 0.1, 0x8a5a37), 0, 1.85, 0.92));
  for (const s of [-1, 1]) {
    g.add(put(box(0.06, 0.7, 0.7, GLASS_BLUE, { emissive: 0x2a4d5a, emissiveIntensity: 0.25 }), s * 1.42, 2.1, -0.2));
  }
  // лесенка
  for (let i = 0; i < 3; i++) g.add(put(box(1.0, 0.1, 0.3, C.wood), 0, 0.85 - i * 0.28, 1.75 + i * 0.3));
  return g;
}

/* ============================================================
   РАСКЛАДКА ПОСТРОЕК ПО ОСТРОВУ
   Позиции считаются автоматически по кольцам — так можно
   добавлять здания, не подбирая координаты вручную
   ============================================================ */
function layoutStages(stages, opts = {}) {
  const { corridor = 0, minGap = 4.4, startR = 5.2, radialGap = 4.4 } = opts;
  const need = stages.filter((s) => !s.global).length;

  // раскладываем по кольцам, пока не хватит мест;
  // на каждом кольце соседи не ближе minGap, между кольцами — radialGap
  const slots = [];
  let r = startR;
  let guard = 0;
  while (slots.length < need && guard++ < 12) {
    const arcs = [];
    if (corridor > 0 && corridor < r) {
      // дорога идёт вдоль оси Z — оставляем два сектора по бокам
      const half = Math.acos(Math.min(0.985, corridor / r));
      arcs.push([-half, half], [Math.PI - half, Math.PI + half]);
    } else if (corridor === 0) {
      arcs.push([0, Math.PI * 2 * 0.999]);
    }
    for (const [a0, a1] of arcs) {
      const arcLen = r * (a1 - a0);
      const cnt = Math.floor(arcLen / minGap);
      for (let i = 0; i < cnt; i++) {
        const a = a0 + ((i + 0.5) / cnt) * (a1 - a0);
        slots.push([Math.cos(a) * r, Math.sin(a) * r, r]);
      }
    }
    r += radialGap;
  }

  // ближние кольца заполняем первыми, чтобы центр не пустовал
  slots.sort((a, b) => a[2] - b[2]);

  let si = 0;
  let maxR = 0;
  stages.forEach((s) => {
    if (s.global) {
      s.pos = [0, 0];
      s.rot = 0;
    } else {
      const sl = slots[si++] || [0, 0, 0];
      s.pos = [sl[0], sl[1]];
      s.rot = Math.atan2(-sl[0], -sl[1]); // фасадом к центру
      maxR = Math.max(maxR, sl[2]);
    }
  });
  stages.maxR = maxR;
  return stages;
}

/* мир собирается из списка стадий: размер острова и маршрут
   пешеходов считаются из фактической раскладки */
export function makeWorld(cfg) {
  const stages = layoutStages(cfg.stages, cfg.layout || {});
  const maxR = stages.maxR || 8;
  return {
    ...cfg,
    stages,
    // остров с запасом за внешним кольцом построек,
    // прогулочная дорожка — между зданиями и краем
    radius: maxR + 3.7,
    walkR: maxR + 2.4,
  };
}
