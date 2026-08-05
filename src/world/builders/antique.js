import * as THREE from "three";
import { C, box, cone, cyl, mat, put, sph } from "../../core/geometry";
import { makeSmoke } from "../life";


/* ============================================================
   ПОСТРОЙКИ: АНТИЧНЫЙ ГОРОД
   ============================================================ */

const MARBLE = 0xf2ece0;
const MARBLE_D = 0xd8d0c0;
const TERRACOTTA = 0xc46a3f;

/* колонна с капителью и каннелюрами */
function column(h = 3.2, r = 0.24) {
  const g = new THREE.Group();
  g.add(put(cyl(r * 1.4, r * 1.5, 0.22, 12, MARBLE_D), 0, 0.11, 0));
  const shaft = cyl(r * 0.88, r, h, 12, MARBLE);
  g.add(put(shaft, 0, h / 2 + 0.2, 0));
  // каннелюры
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.add(put(box(0.05, h * 0.94, 0.05, MARBLE_D), Math.cos(a) * r * 0.92, h / 2 + 0.2, Math.sin(a) * r * 0.92));
  }
  // капитель с завитками
  g.add(put(cyl(r * 1.25, r * 0.9, 0.24, 12, MARBLE), 0, h + 0.32, 0));
  g.add(put(box(r * 2.7, 0.16, r * 2.7, MARBLE), 0, h + 0.5, 0));
  for (const sx of [-1, 1]) {
    const volute25 = cyl(0.13, 0.13, 0.12, 10, MARBLE_D);
    volute25.rotation.x = Math.PI / 2;
    g.add(put(volute25, sx * r * 1.1, h + 0.36, 0));
  }
  return g;
}

/* храм с фронтоном */
export function temple() {
  const g = new THREE.Group();
  // ступенчатый стилобат
  for (let i = 0; i < 3; i++) {
    g.add(put(box(7.0 - i * 0.5, 0.3, 5.0 - i * 0.5, MARBLE_D), 0, 0.15 + i * 0.3, 0));
  }
  const base = 0.9;
  // целла
  g.add(put(box(4.0, 3.0, 2.6, MARBLE), 0, base + 1.5, 0));
  g.add(put(box(1.2, 2.0, 0.14, 0x8a6a3c), 0, base + 1.0, 1.35));
  // колоннада по периметру
  for (let i = -3; i <= 3; i++) {
    for (const z of [-1.9, 1.9]) {
      const c = column(3.2, 0.22);
      c.position.set(i * 0.95, base, z);
      g.add(c);
    }
  }
  for (const x of [-2.9, 2.9]) {
    for (const z of [-0.95, 0, 0.95]) {
      const c = column(3.2, 0.22);
      c.position.set(x, base, z);
      g.add(c);
    }
  }
  // антаблемент
  g.add(put(box(6.4, 0.4, 4.4, MARBLE), 0, base + 3.9, 0));
  g.add(put(box(6.6, 0.22, 4.6, MARBLE_D), 0, base + 4.2, 0));
  // фронтоны
  for (const z of [-2.2, 2.2]) {
    const ped = new THREE.Mesh(new THREE.ConeGeometry(3.3, 1.2, 3), mat(MARBLE));
    ped.rotation.y = Math.PI / 2;
    ped.scale.set(1, 1, 0.07);
    ped.castShadow = true;
    g.add(put(ped, 0, base + 4.9, z));
  }
  // черепичная кровля
  for (const s of [-1, 1]) {
    const slope = box(3.5, 0.18, 4.7, TERRACOTTA);
    slope.position.set(s * 1.5, base + 4.85, 0);
    slope.rotation.z = s * -0.33;
    g.add(slope);
  }
  g.add(put(box(0.28, 0.2, 4.8, 0xa8542f), 0, base + 5.42, 0));
  return g;
}

/* амфитеатр */
export function amphitheater() {
  const g = new THREE.Group();
  // ярусы полукругом
  for (let r = 0; r < 5; r++) {
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4 + r * 0.65, 2.4 + r * 0.65, 0.42, 22, 1, false, 0, Math.PI),
      mat(r % 2 ? MARBLE : MARBLE_D)
    );
    ring.castShadow = true;
    ring.receiveShadow = true;
    g.add(put(ring, 0, 0.21 + r * 0.4, 0));
  }
  // орхестра
  g.add(put(cyl(2.2, 2.2, 0.16, 20, 0xd8c9a8), 0, 0.08, 0));
  // сцена
  g.add(put(box(5.4, 0.4, 1.0, MARBLE_D), 0, 0.2, -2.0));
  g.add(put(box(5.6, 2.4, 0.5, MARBLE), 0, 1.4, -2.6));
  for (let i = -2; i <= 2; i++) {
    const c = column(1.9, 0.16);
    c.position.set(i * 1.15, 0.4, -2.2);
    g.add(c);
  }
  // проходы
  for (const s of [-1, 1]) {
    const aisle103 = box(0.5, 0.1, 5.4, 0xc9bfa8);
    aisle103.rotation.x = -0.42;
    g.add(put(aisle103, s * 2.6, 1.3, 1.4));
  }
  return g;
}

/* статуя на постаменте */
export function statue() {
  const g = new THREE.Group();
  g.add(put(box(1.6, 0.9, 1.6, MARBLE_D), 0, 0.45, 0));
  g.add(put(box(1.4, 0.18, 1.4, MARBLE), 0, 0.99, 0));
  // фигура
  const body = cyl(0.28, 0.36, 1.5, 10, MARBLE);
  g.add(put(body, 0, 1.85, 0));
  // драпировка
  const cloth = cone(0.44, 1.1, 8, MARBLE_D);
  g.add(put(cloth, 0, 1.6, 0));
  g.add(put(sph(0.22, MARBLE), 0, 2.75, 0));
  // руки
  const armR = cyl(0.09, 0.09, 0.9, 6, MARBLE);
  armR.rotation.z = -0.9;
  g.add(put(armR, 0.42, 2.3, 0));
  const armL = cyl(0.09, 0.09, 0.8, 6, MARBLE);
  armL.rotation.z = 0.35;
  g.add(put(armL, -0.34, 2.1, 0));
  // венок и копьё
  g.add(put(cyl(0.24, 0.24, 0.08, 10, C.gold), 0, 2.92, 0));
  g.add(put(cyl(0.05, 0.05, 2.4, 5, 0x8a6a3c), 0.62, 1.9, 0));
  g.add(put(cone(0.1, 0.3, 5, 0xc9c2b0), 0.62, 3.2, 0));
  return g;
}

/* агора — торговая площадь */
export function agora() {
  const g = new THREE.Group();
  g.add(put(cyl(3.6, 3.7, 0.2, 22, 0xe0d8c4), 0, 0.1, 0));
  // мозаика
  for (let r = 1; r < 4; r++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 0.85, 0.06, 5, 24), mat(TERRACOTTA));
    ring.rotation.x = Math.PI / 2;
    g.add(put(ring, 0, 0.22, 0));
  }
  // портик по краю
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const c = column(2.4, 0.18);
    c.position.set(Math.cos(a) * 3.3, 0.15, Math.sin(a) * 3.3);
    g.add(c);
  }
  // прилавки и амфоры
  for (const [x, z] of [[1.4, 1.0], [-1.6, 0.8], [0.2, -1.7]]) {
    g.add(put(box(1.3, 0.6, 0.8, 0x8a6a3c), x, 0.4, z));
    g.add(put(box(1.4, 0.1, 0.9, TERRACOTTA), x, 0.72, z));
  }
  for (const [x, z] of [[2.2, -0.6], [-2.4, -1.2], [0.9, 2.2]]) {
    const amp = new THREE.Group();
    amp.add(put(sph(0.3, TERRACOTTA), 0, 0.34, 0));
    amp.add(put(cyl(0.11, 0.18, 0.4, 8, TERRACOTTA), 0, 0.72, 0));
    amp.add(put(cyl(0.16, 0.13, 0.1, 8, 0xa8542f), 0, 0.95, 0));
    amp.position.set(x, 0.1, z);
    g.add(amp);
  }
  return g;
}

/* акведук */
export function aqueduct() {
  const g = new THREE.Group();
  const span = 2.6;
  for (let i = -1; i <= 1; i++) {
    const x = i * span;
    // опора
    g.add(put(box(0.7, 3.4, 1.0, MARBLE_D), x, 1.7, 0));
    // арка
    if (i < 1) {
      const arch = new THREE.Mesh(new THREE.TorusGeometry(span / 2 - 0.35, 0.32, 6, 14, Math.PI), mat(MARBLE));
      arch.rotation.y = Math.PI / 2;
      arch.rotation.z = 0;
      g.add(put(arch, x + span / 2, 3.4, 0));
    }
  }
  // жёлоб
  g.add(put(box(span * 2 + 1.2, 0.5, 1.3, MARBLE), 0, 3.9, 0));
  g.add(put(box(span * 2 + 1.0, 0.24, 0.7, 0x3fb0d8, { roughness: 0.1, transparent: true, opacity: 0.85 }), 0, 4.2, 0));
  for (const s of [-1, 1]) {
    g.add(put(box(span * 2 + 1.2, 0.36, 0.28, MARBLE_D), 0, 4.25, s * 0.5));
  }
  // второй ярус арок поменьше
  for (let i = -2; i <= 2; i++) {
    g.add(put(box(0.34, 1.0, 0.9, MARBLE_D), i * 1.3, 3.0, 0));
  }
  return g;
}

/* ============================================================
   ПОСТРОЙКИ: ВУЛКАНИЧЕСКИЙ ОСТРОВ
   ============================================================ */

const BASALT = 0x4a4550;
const BASALT_D = 0x332f3a;
const LAVA = 0xff5a1e;

/* вулкан с лавой в кратере */
export function volcano(store) {
  const g = new THREE.Group();
  const cone1 = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 4.4, 5.0, 14), mat(BASALT));
  cone1.castShadow = true;
  cone1.receiveShadow = true;
  g.add(put(cone1, 0, 2.5, 0));
  // потёки лавы по склону
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.4;
    const flow = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 3.6, 0.18),
      new THREE.MeshStandardMaterial({ color: LAVA, emissive: 0xff3a00, emissiveIntensity: 1.1, flatShading: true })
    );
    flow.position.set(Math.cos(a) * 2.5, 2.3, Math.sin(a) * 2.5);
    flow.rotation.z = -Math.cos(a) * 0.32;
    flow.rotation.x = Math.sin(a) * 0.32;
    g.add(flow);
    store.lavaFlows = [...(store.lavaFlows || []), flow];
  }
  // кратер
  g.add(put(cyl(1.55, 1.55, 0.3, 14, BASALT_D), 0, 4.95, 0));
  const pool = new THREE.Mesh(
    new THREE.CylinderGeometry(1.35, 1.35, 0.3, 14),
    new THREE.MeshStandardMaterial({ color: 0xff8a2f, emissive: 0xff4a10, emissiveIntensity: 1.5, flatShading: true })
  );
  g.add(put(pool, 0, 5.05, 0));
  store.lavaPool = pool;
  const gl = new THREE.PointLight(0xff6a20, 1.4, 16);
  gl.position.set(0, 5.4, 0);
  g.add(gl);
  store.lavaLight = gl;
  // дым
  const smoke = makeSmoke(0, 5.4, 0);
  g.add(smoke);
  store.smokes = [...(store.smokes || []), smoke];
  return g;
}

/* лавовое озеро */
export function lavaLake(store) {
  const g = new THREE.Group();
  const rim = cyl(2.9, 3.0, 0.4, 16, BASALT_D);
  g.add(put(rim, 0, 0.12, 0));
  const lava = new THREE.Mesh(
    new THREE.CylinderGeometry(2.65, 2.65, 0.32, 18),
    new THREE.MeshStandardMaterial({ color: 0xff7a2a, emissive: 0xff4a10, emissiveIntensity: 1.35, flatShading: true })
  );
  g.add(put(lava, 0, 0.24, 0));
  store.lavaPool = store.lavaPool || lava;
  store.lavaFlows = [...(store.lavaFlows || []), lava];
  // остывшая корка островками
  for (let i = 0; i < 7; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 2.0;
    const crust = sph(0.3 + Math.random() * 0.25, BASALT_D);
    crust.scale.set(1.5, 0.3, 1.3);
    g.add(put(crust, Math.cos(a) * r, 0.34, Math.sin(a) * r));
  }
  // базальтовые глыбы по краю
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    g.add(put(box(0.5, 0.6 + Math.random() * 0.5, 0.5, BASALT), Math.cos(a) * 3.1, 0.3, Math.sin(a) * 3.1))
      .rotation.y = a;
  }
  const l = new THREE.PointLight(0xff5a1e, 1.0, 12);
  l.position.set(0, 0.9, 0);
  g.add(l);
  return g;
}

/* хижина из вулканического камня */
export function basaltHut() {
  const g = new THREE.Group();
  g.add(put(cyl(1.5, 1.75, 1.9, 8, BASALT), 0, 0.95, 0));
  // кладка
  for (let r = 0; r < 3; r++) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + r * 0.3;
      g.add(put(box(0.5, 0.5, 0.12, BASALT_D), Math.cos(a) * 1.68, 0.35 + r * 0.6, Math.sin(a) * 1.68))
        .rotation.y = -a;
    }
  }
  // соломенная крыша
  const roof = cone(2.1, 1.4, 8, 0x8a6a3c);
  g.add(put(roof, 0, 2.6, 0));
  const roof2 = cone(1.6, 0.9, 8, 0x6b5230);
  g.add(put(roof2, 0, 3.2, 0));
  // проём с тёплым светом
  g.add(put(box(0.8, 1.3, 0.14, 0x2a2028), 0, 0.65, 1.62));
  const glow = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 1.0, 0.06),
    new THREE.MeshStandardMaterial({ color: 0xffa54a, emissive: 0xff7a20, emissiveIntensity: 0.9, flatShading: true })
  );
  glow.position.set(0, 0.6, 1.68);
  g.add(glow);
  // навес и утварь
  for (const s of [-1, 1]) g.add(put(cyl(0.09, 0.09, 1.6, 6, 0x6b5230), s * 1.1, 0.8, 2.2));
  g.add(put(box(2.4, 0.1, 1.0, 0x8a6a3c), 0, 1.6, 2.2));
  g.add(put(cyl(0.28, 0.34, 0.4, 9, BASALT_D), 1.9, 0.2, 1.2));
  return g;
}

/* горячий источник */
export function hotSpring(store) {
  const g = new THREE.Group();
  for (let r = 0; r < 3; r++) {
    const ring = cyl(1.4 + r * 0.6, 1.5 + r * 0.6, 0.22, 14, r % 2 ? 0xc9bfae : 0xb0a494);
    g.add(put(ring, 0, 0.5 - r * 0.16, 0));
  }
  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(1.25, 1.25, 0.3, 14),
    mat(0x6fe0d4, { roughness: 0.06, metalness: 0.25, transparent: true, opacity: 0.9, flatShading: false })
  );
  g.add(put(water, 0, 0.62, 0));
  store.springWater = water;
  // пар
  const steam = makeSmoke(0, 0.8, 0);
  steam.userData.puffs.forEach((p) => {
    p.mesh.material.color.setHex(0xdff5f2);
    p.mesh.material.opacity = 0.4;
  });
  g.add(steam);
  store.smokes = [...(store.smokes || []), steam];
  // камни и пузыри
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.add(put(sph(0.26, BASALT), Math.cos(a) * 2.4, 0.3, Math.sin(a) * 2.4));
  }
  return g;
}

/* обсидиановые шпили */
export function obsidianSpikes() {
  const g = new THREE.Group();
  [[0, 0, 3.2, 0.55], [1.7, 1.1, 2.2, 0.42], [-1.5, 1.3, 2.6, 0.46], [0.6, -1.8, 1.8, 0.36]].forEach(
    ([x, z, h, r]) => {
      const spike = cone(r, h, 6, 0x2a2434);
      spike.rotation.z = (Math.random() - 0.5) * 0.25;
      g.add(put(spike, x, h / 2, z));
      // блик обсидиана
      const shine = cone(r * 0.5, h * 0.8, 6, 0x6f5a8f);
      g.add(put(shine, x + r * 0.25, h / 2, z + r * 0.2));
    }
  );
  // тлеющие трещины у основания
  for (let i = 0; i < 5; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 1.5 + Math.random() * 1.2;
    const crack = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.05, 0.12),
      new THREE.MeshStandardMaterial({ color: LAVA, emissive: 0xff3a00, emissiveIntensity: 0.9, flatShading: true })
    );
    crack.position.set(Math.cos(a) * r, 0.04, Math.sin(a) * r);
    crack.rotation.y = a;
    g.add(crack);
  }
  return g;
}

/* ============================================================
   ПОСТРОЙКИ: ЖЕЛЕЗНОДОРОЖНАЯ СТАНЦИЯ
   ============================================================ */

/* пути со шпалами */
export function railTrack() {
  const g = new THREE.Group();
  const L = 22;
  // насыпь
  g.add(put(box(3.4, 0.24, L, 0x8a8072), 0, 0.12, 0));
  // шпалы
  for (let z = -L / 2 + 0.5; z < L / 2; z += 1.0) {
    g.add(put(box(2.6, 0.14, 0.34, 0x6b4a2c), 0, 0.28, z));
  }
  // рельсы
  for (const x of [-0.75, 0.75]) {
    g.add(put(box(0.14, 0.18, L, 0x9aa2a8), x, 0.42, 0));
    g.add(put(box(0.22, 0.06, L, 0x7f868c), x, 0.32, 0));
  }
  return g;
}

/* здание вокзала */
export function station() {
  const g = new THREE.Group();
  g.add(put(box(6.0, 3.0, 3.2, 0xe8dcc4), 0, 1.5, 0));
  // кирпичные углы
  for (const s of [-1, 1]) g.add(put(box(0.5, 3.0, 0.5, 0xb5654a), s * 2.75, 1.5, 1.35));
  // крыша
  for (const s of [-1, 1]) {
    const slope = box(3.6, 0.22, 3.8, 0x5d6a72);
    slope.position.set(s * 1.5, 3.5, 0);
    slope.rotation.z = s * -0.42;
    g.add(slope);
  }
  g.add(put(box(0.3, 0.22, 3.9, 0x44505a), 0, 4.15, 0));
  // часы на фасаде
  const face = new THREE.Mesh(
    new THREE.CylinderGeometry(0.48, 0.48, 0.12, 14),
    new THREE.MeshStandardMaterial({ color: 0xfaf3e4, emissive: 0xd8c9a8, emissiveIntensity: 0.35, flatShading: true })
  );
  face.rotation.x = Math.PI / 2;
  g.add(put(face, 0, 3.15, 1.65));
  g.add(put(box(0.06, 0.32, 0.05, 0x33373a), 0, 3.26, 1.72));
  g.add(put(box(0.24, 0.06, 0.05, 0x33373a), 0.09, 3.15, 1.72));
  // арочные окна и двери
  for (let i = -2; i <= 2; i++) {
    if (i === 0) continue;
    g.add(put(box(0.8, 1.4, 0.1, 0x8fd0e6, { transparent: true, opacity: 0.7, emissive: 0x2a5a70, emissiveIntensity: 0.3 }), i * 1.15, 1.5, 1.63));
    const arc = cyl(0.4, 0.4, 0.1, 12, 0x8fd0e6, { transparent: true, opacity: 0.7 });
    arc.rotation.x = Math.PI / 2;
    g.add(put(arc, i * 1.15, 2.2, 1.63));
  }
  g.add(put(box(1.3, 2.0, 0.14, 0x8a5a37), 0, 1.0, 1.65));
  // навес над входом
  const canopy = box(2.4, 0.16, 1.2, 0x5d6a72);
  g.add(put(canopy, 0, 2.6, 2.3));
  for (const s of [-1, 1]) g.add(put(cyl(0.09, 0.09, 2.5, 8, 0x44505a), s * 1.0, 1.25, 2.8));
  return g;
}

/* платформа с навесом */
export function platform() {
  const g = new THREE.Group();
  g.add(put(box(3.0, 0.6, 12.0, 0xd8d0c0), 0, 0.3, 0));
  g.add(put(box(3.1, 0.1, 12.0, 0xc4bcae), 0, 0.62, 0));
  // жёлтая линия безопасности
  for (const s of [-1, 1]) g.add(put(box(0.16, 0.04, 12.0, 0xe8c43c), s * 1.3, 0.68, 0));
  // навес
  for (let z = -4.5; z <= 4.5; z += 3) {
    for (const s of [-1, 1]) g.add(put(cyl(0.11, 0.13, 2.8, 8, 0x6b7075), s * 1.1, 2.0, z));
  }
  g.add(put(box(3.4, 0.16, 11.0, 0x4f7f9e), 0, 3.45, 0));
  for (const s of [-1, 1]) g.add(put(box(0.14, 0.4, 11.0, 0x3f6a85), s * 1.6, 3.25, 0));
  // скамейки и табло
  for (const z of [-3, 1.5]) {
    g.add(put(box(0.5, 0.12, 1.6, C.wood), 0, 1.0, z));
    g.add(put(box(0.1, 0.5, 1.6, C.wood), -0.22, 1.22, z));
    for (const q of [-0.6, 0.6]) g.add(put(box(0.4, 0.4, 0.12, 0x6b7075), 0, 0.8, z + q));
  }
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.7, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x1a2430, emissive: 0x2fa85a, emissiveIntensity: 0.6, flatShading: true })
  );
  board.position.set(0, 2.9, 4.4);
  g.add(board);
  return g;
}

/* паровоз с вагонами */
export function locomotive(store) {
  const g = new THREE.Group();
  const loco = new THREE.Group();
  // котёл
  const boiler = cyl(0.7, 0.7, 3.2, 12, 0x2f4a5a);
  boiler.rotation.x = Math.PI / 2;
  loco.add(put(boiler, 0, 1.15, 0.4));
  loco.add(put(cyl(0.75, 0.75, 0.2, 12, 0xc4a03c), 0, 1.15, 1.95));
  // труба
  loco.add(put(cyl(0.26, 0.34, 0.9, 10, 0x1f3340), 0, 2.05, 1.5));
  loco.add(put(cyl(0.36, 0.28, 0.2, 10, 0x1f3340), 0, 2.55, 1.5));
  // будка
  loco.add(put(box(1.5, 1.6, 1.5, 0x8a3a30), 0, 1.6, -1.4));
  loco.add(put(box(1.6, 0.2, 1.7, 0x6b2a22), 0, 2.5, -1.4));
  for (const s of [-1, 1]) {
    loco.add(put(box(0.06, 0.6, 0.7, 0xcfe4ec, { transparent: true, opacity: 0.75 }), s * 0.78, 1.9, -1.2));
  }
  // рама и колёса
  loco.add(put(box(1.5, 0.34, 4.4, 0x33373a), 0, 0.62, 0));
  const wheels = [];
  [[0.9, 1.5, 0.5], [0.9, 0.4, 0.5], [0.9, -1.4, 0.62]].forEach(([wx, wz, r]) => {
    for (const s of [-1, 1]) {
      const pv = new THREE.Group();
      pv.position.set(s * wx, r * 0.75, wz);
      pv.rotation.z = Math.PI / 2;
      const w = cyl(r, r, 0.16, 12, 0x55151a);
      pv.add(w);
      const rim = cyl(r * 0.55, r * 0.55, 0.18, 12, 0x8a8f92);
      pv.add(rim);
      loco.add(pv);
      wheels.push(w);
    }
  });
  loco.userData.wheels = wheels;
  // фара
  const lamp = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.24, 0.24, 10),
    new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffc46b, emissiveIntensity: 1.3, flatShading: true })
  );
  lamp.rotation.x = Math.PI / 2;
  loco.add(put(lamp, 0, 1.75, 2.1));
  // дым из трубы
  const sm = makeSmoke(0, 2.7, 1.5);
  loco.add(sm);
  store.smokes = [...(store.smokes || []), sm];
  g.add(loco);

  // вагоны
  const carCols = [0x8a3a30, 0x2f5a4a, 0x3a4a6a];
  for (let i = 0; i < 3; i++) {
    const car = new THREE.Group();
    car.add(put(box(1.6, 1.7, 3.4, carCols[i]), 0, 1.5, 0));
    car.add(put(box(1.7, 0.18, 3.5, 0x2a2a2e), 0, 2.44, 0));
    car.add(put(box(1.5, 0.3, 3.6, 0x33373a), 0, 0.62, 0));
    for (let k = -1; k <= 1; k++) {
      for (const s of [-1, 1]) {
        car.add(put(box(0.06, 0.6, 0.8, 0xffd98a, { emissive: 0xffb545, emissiveIntensity: 0.55 }), s * 0.83, 1.75, k * 1.05));
      }
    }
    for (const wz of [1.1, -1.1]) {
      for (const s of [-1, 1]) {
        const pv = new THREE.Group();
        pv.position.set(s * 0.8, 0.4, wz);
        pv.rotation.z = Math.PI / 2;
        pv.add(cyl(0.4, 0.4, 0.14, 10, 0x33373a));
        car.add(pv);
      }
    }
    car.position.z = -4.6 - i * 3.9;
    g.add(car);
  }
  store.train = g;
  return g;
}

/* водонапорная колонка и семафор */
export function railSignal(store) {
  const g = new THREE.Group();
  // семафор
  g.add(put(cyl(0.13, 0.16, 4.2, 8, 0x55606b), 0, 2.1, 0));
  g.add(put(box(0.6, 1.5, 0.4, 0x33373a), 0, 3.9, 0));
  const lights = [];
  [0xff3a2f, 0xe8c43c, 0x3fd45a].forEach((c, i) => {
    const l = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.16, 0),
      new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.3, flatShading: true })
    );
    l.position.set(0, 4.4 - i * 0.48, 0.24);
    g.add(l);
    lights.push(l);
  });
  store.trafficLights = [...(store.trafficLights || []), ...lights];
  // лесенка
  for (let i = 0; i < 6; i++) g.add(put(box(0.34, 0.05, 0.05, 0x8d949a), 0, 0.5 + i * 0.5, -0.22));
  // водонапорная колонка
  g.add(put(cyl(0.24, 0.28, 3.0, 8, 0x6b4a2c), 2.6, 1.5, 0));
  const arm = cyl(0.14, 0.14, 1.6, 8, 0x6b4a2c);
  arm.rotation.z = Math.PI / 2;
  g.add(put(arm, 1.9, 2.9, 0));
  g.add(put(cyl(0.7, 0.8, 1.1, 10, 0x4a6a7a), 2.6, 3.6, 0));
  g.add(put(cone(0.9, 0.5, 10, 0x33505e), 2.6, 4.35, 0));
  return g;
}
