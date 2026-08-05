import * as THREE from "three";
import { C, box, cone, cyl, mat, put, sph } from "../../core/geometry";


/* ============================================================
   ПОСТРОЙКИ: СРЕДНЕВЕКОВЫЙ ЗАМОК
   ============================================================ */

const STONE_W = 0xc4bfae;
const STONE_D = 0x9a9482;
const BANNER = 0xc4304a;

/* кладка: ряды блоков со смещением */
function masonry(w, h, d, color, rows = 4) {
  const g = new THREE.Group();
  g.add(put(box(w, h, d, color), 0, h / 2, 0));
  for (let r = 0; r < rows; r++) {
    const y = (r + 0.5) * (h / rows);
    const cols = 4;
    for (let c = 0; c < cols; c++) {
      const off = r % 2 ? 0.5 : 0;
      const x = (c - (cols - 1) / 2 + off) * (w / cols);
      if (Math.abs(x) > w / 2 - 0.15) continue;
      g.add(put(box(w / cols - 0.08, h / rows - 0.07, 0.04, STONE_D), x, y, d / 2 + 0.01));
    }
  }
  return g;
}

/* зубцы поверх стены */
function battlements(w, d, y, step = 0.7) {
  const g = new THREE.Group();
  for (let x = -w / 2 + 0.3; x <= w / 2 - 0.3; x += step) {
    g.add(put(box(0.38, 0.45, d + 0.12, STONE_D), x, y, 0));
  }
  return g;
}

export function castleWall() {
  const g = new THREE.Group();
  g.add(masonry(7.0, 2.8, 1.1, STONE_W, 4));
  g.add(battlements(7.0, 1.1, 3.02));
  // боковые башенки
  for (const s of [-1, 1]) {
    const t = new THREE.Group();
    t.add(put(cyl(0.75, 0.85, 3.6, 10, STONE_W), 0, 1.8, 0));
    t.add(put(cyl(0.95, 0.95, 0.24, 10, STONE_D), 0, 3.7, 0));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      t.add(put(box(0.26, 0.4, 0.26, STONE_D), Math.cos(a) * 0.82, 4.0, Math.sin(a) * 0.82));
    }
    t.add(put(cone(1.0, 1.3, 8, 0x6a4a8f), 0, 4.7, 0));
    t.add(put(cyl(0.05, 0.05, 0.9, 5, 0x8a6a4a), 0, 5.7, 0));
    t.add(put(box(0.55, 0.35, 0.04, BANNER), 0.3, 6.0, 0));
    t.position.set(s * 3.6, 0, 0);
    g.add(t);
  }
  // ход поверху
  g.add(put(box(6.6, 0.12, 0.7, 0x8a6a4a), 0, 2.86, 0));
  return g;
}

/* донжон — главная башня */
export function keep() {
  const g = new THREE.Group();
  g.add(masonry(3.6, 6.0, 3.4, STONE_W, 7));
  g.add(put(box(3.9, 0.28, 3.7, STONE_D), 0, 6.1, 0));
  // зубцы по периметру
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    for (let i = -1.4; i <= 1.4; i += 0.7) {
      g.add(put(box(0.32, 0.5, 0.32, STONE_D), dx ? dx * 1.85 : i, 6.5, dz ? dz * 1.75 : i));
    }
  }
  // угловые башенки
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(put(cyl(0.42, 0.5, 7.4, 8, STONE_W), sx * 1.9, 3.7, sz * 1.8));
    g.add(put(cone(0.62, 1.0, 8, 0x6a4a8f), sx * 1.9, 7.9, sz * 1.8));
  }
  // окна-бойницы
  for (const y of [1.6, 3.2, 4.8]) {
    for (const s of [-1, 1]) {
      g.add(put(box(0.26, 0.8, 0.1, 0x33302a), s * 0.9, y, 1.73));
    }
  }
  // вход с аркой
  g.add(put(box(1.1, 1.8, 0.14, 0x6b4a2c), 0, 0.9, 1.75));
  const arch = cyl(0.55, 0.55, 0.14, 12, 0x6b4a2c);
  arch.rotation.x = Math.PI / 2;
  g.add(put(arch, 0, 1.8, 1.75));
  // флаг на вершине
  g.add(put(cyl(0.06, 0.06, 1.6, 5, 0x8a6a4a), 0, 7.4, 0));
  g.add(put(box(0.8, 0.5, 0.05, BANNER), 0.45, 7.9, 0));
  return g;
}

/* надвратная башня с решёткой и мостом */
export function gatehouse() {
  const g = new THREE.Group();
  for (const s of [-1, 1]) {
    g.add(masonry(1.6, 4.6, 2.2, STONE_W, 5));
    g.children[g.children.length - 1].position.x = s * 1.9;
    g.add(battlements(1.6, 2.2, 4.75).translateX(s * 1.9));
  }
  // перемычка
  g.add(put(box(2.4, 1.6, 2.0, STONE_W), 0, 3.6, 0));
  g.add(battlements(2.4, 2.0, 4.55));
  // проём и решётка
  g.add(put(box(2.2, 2.8, 0.16, 0x2e2820), 0, 1.4, 0.9));
  for (let i = -2; i <= 2; i++) g.add(put(box(0.09, 2.6, 0.09, 0x55504a), i * 0.42, 1.4, 1.0));
  for (const y of [0.5, 1.4, 2.3]) g.add(put(box(2.1, 0.09, 0.09, 0x55504a), 0, y, 1.0));
  // подъёмный мост
  const bridgeD = box(2.0, 0.16, 2.4, 0x8a6a4a);
  bridgeD.rotation.x = -0.22;
  g.add(put(bridgeD, 0, 0.35, 2.2));
  for (const s of [-1, 1]) {
    const chain = cyl(0.04, 0.04, 2.6, 4, 0x6b7075);
    chain.rotation.x = 0.55;
    g.add(put(chain, s * 0.85, 2.4, 1.9));
  }
  // ров
  const moat = new THREE.Mesh(
    new THREE.BoxGeometry(6.0, 0.2, 1.8),
    mat(0x2f7f9e, { roughness: 0.15, transparent: true, opacity: 0.85, flatShading: false })
  );
  g.add(put(moat, 0, 0.05, 3.6));
  return g;
}

/* кузница */
export function forge(store) {
  const g = new THREE.Group();
  g.add(put(box(3.4, 2.2, 2.8, 0x8a6a4a), 0, 1.1, 0));
  for (const s of [-1, 1]) {
    const slope = box(2.2, 0.2, 3.2, 0x5a3f2c);
    slope.position.set(s * 0.92, 2.6, 0);
    slope.rotation.z = s * -0.55;
    g.add(slope);
  }
  g.add(put(box(0.24, 0.2, 3.3, 0x452f20), 0, 3.06, 0));
  // труба с огнём
  g.add(put(box(0.6, 1.6, 0.6, STONE_D), 1.1, 3.0, -0.7));
  const fire = new THREE.Mesh(
    new THREE.ConeGeometry(0.3, 0.7, 6),
    new THREE.MeshStandardMaterial({ color: 0xff8a2f, emissive: 0xff5a10, emissiveIntensity: 1.4, flatShading: true })
  );
  fire.position.set(1.1, 3.9, -0.7);
  g.add(fire);
  store.forgeFire = [...(store.forgeFire || []), fire];
  const fl = new THREE.PointLight(0xff7a2f, 0.8, 7);
  fl.position.set(1.1, 3.6, -0.7);
  g.add(fl);
  // горн внутри проёма
  const glow = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.9, 0.1),
    new THREE.MeshStandardMaterial({ color: 0xffb04a, emissive: 0xff7a20, emissiveIntensity: 1.2, flatShading: true })
  );
  glow.position.set(-0.5, 1.0, 1.42);
  g.add(glow);
  // наковальня и молот
  g.add(put(box(0.5, 0.3, 0.9, 0x55504a), 2.4, 0.5, 1.0));
  g.add(put(box(0.35, 0.4, 0.35, 0x6b4a2c), 2.4, 0.2, 1.0));
  g.add(put(cyl(0.05, 0.05, 0.7, 5, 0x8a6a4a), 2.7, 0.85, 1.2));
  // стойка с оружием
  for (let i = -1; i <= 1; i++) {
    g.add(put(box(0.08, 1.3, 0.08, 0x9aa2a8), -2.2, 0.65, i * 0.35));
  }
  return g;
}

/* таверна */
export function tavern() {
  const g = new THREE.Group();
  g.add(put(box(4.0, 2.4, 3.0, 0xe0cfa8), 0, 1.2, 0));
  // фахверк
  for (const s of [-1, 1]) {
    for (let i = -1; i <= 1; i++) {
      g.add(put(box(0.14, 2.4, 0.1, 0x6b4a2c), i * 1.3, 1.2, s * 1.52));
    }
    g.add(put(box(4.0, 0.16, 0.1, 0x6b4a2c), 0, 2.3, s * 1.52));
    g.add(put(box(4.0, 0.16, 0.1, 0x6b4a2c), 0, 0.12, s * 1.52));
  }
  // второй этаж с нависанием
  g.add(put(box(4.4, 1.5, 3.4, 0xe8d9b8), 0, 3.15, 0));
  for (const s of [-1, 1]) {
    const slope = box(2.8, 0.22, 3.8, 0x8a4f3a);
    slope.position.set(s * 1.15, 4.5, 0);
    slope.rotation.z = s * -0.58;
    g.add(slope);
  }
  g.add(put(box(0.26, 0.22, 3.9, 0x6e3c2a), 0, 5.0, 0));
  // окна с тёплым светом
  for (const x of [-1.2, 1.2]) {
    g.add(put(box(0.8, 0.8, 0.1, 0xffc46b, { emissive: 0xff9a2f, emissiveIntensity: 0.85 }), x, 1.4, 1.53));
    g.add(put(box(0.7, 0.6, 0.1, 0xffc46b, { emissive: 0xff9a2f, emissiveIntensity: 0.7 }), x, 3.2, 1.73));
  }
  g.add(put(box(0.9, 1.6, 0.14, 0x6b4a2c), 0, 0.8, 1.55));
  // вывеска-кружка
  g.add(put(cyl(0.06, 0.06, 0.9, 5, 0x6b4a2c), 2.3, 2.6, 1.4));
  g.add(put(box(0.9, 0.06, 0.06, 0x6b4a2c), 1.95, 3.0, 1.4));
  g.add(put(cyl(0.28, 0.24, 0.45, 8, 0xc9a05a), 1.6, 2.6, 1.4));
  // бочки и стол
  for (const [x, z] of [[2.6, 0.4], [3.1, 0.9]]) {
    g.add(put(cyl(0.36, 0.32, 0.8, 10, 0x8a5f3a), x, 0.4, z));
    g.add(put(cyl(0.38, 0.38, 0.08, 10, 0x55504a), x, 0.55, z));
  }
  return g;
}

/* катапульта */
export function catapult() {
  const g = new THREE.Group();
  g.add(put(box(2.2, 0.24, 1.4, 0x8a6a4a), 0, 0.5, 0));
  for (const [wx, wz] of [[-0.9, 0.65], [0.9, 0.65], [-0.9, -0.65], [0.9, -0.65]]) {
    const w = cyl(0.42, 0.42, 0.18, 10, 0x6b4a2c);
    w.rotation.z = Math.PI / 2;
    g.add(put(w, wx, 0.42, wz));
    for (let i = 0; i < 4; i++) {
      const sp = box(0.06, 0.7, 0.06, 0x55402c);
      sp.rotation.x = (i / 4) * Math.PI;
      g.add(put(sp, wx, 0.42, wz));
    }
  }
  // рама
  for (const s of [-1, 1]) {
    const beam = box(0.16, 1.6, 0.16, 0x6b4a2c);
    beam.rotation.z = s * 0.25;
    g.add(put(beam, s * 0.4, 1.3, 0));
  }
  g.add(put(box(1.4, 0.14, 0.14, 0x6b4a2c), 0, 2.05, 0));
  // рычаг с ковшом
  const arm = new THREE.Group();
  arm.add(put(box(0.14, 2.6, 0.14, 0x8a6a4a), 0, 0.9, 0));
  arm.add(put(cyl(0.3, 0.24, 0.32, 8, 0x6b4a2c), 0, 2.2, 0));
  arm.add(put(sph(0.22, STONE_D), 0, 2.4, 0));
  arm.rotation.x = -0.9;
  arm.position.set(0, 1.0, -0.2);
  g.add(arm);
  // канат
  g.add(put(cyl(0.04, 0.04, 1.2, 4, 0xc4a165), 0, 1.1, 0.7));
  // ядра
  for (const [x, z] of [[1.5, 0.8], [1.8, 0.5], [1.6, 0.2]]) {
    g.add(put(sph(0.22, STONE_D), x, 0.22, z));
  }
  return g;
}

/* рыцарский шатёр */
export function knightTent() {
  const g = new THREE.Group();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const seg = new THREE.Mesh(
      new THREE.ConeGeometry(1.9, 2.8, 10, 1, false, a, Math.PI / 5),
      mat(i % 2 ? BANNER : 0xf2ead6)
    );
    seg.castShadow = true;
    g.add(put(seg, 0, 1.4, 0));
  }
  g.add(put(cyl(0.06, 0.06, 1.0, 5, 0x8a6a4a), 0, 3.2, 0));
  g.add(put(box(0.7, 0.4, 0.04, BANNER), 0.4, 3.5, 0));
  // вход
  g.add(put(box(0.9, 1.3, 0.08, 0x6b4a2c), 0, 0.65, 1.72));
  // щит и копья
  const scale261 = cyl(0.42, 0.42, 0.1, 8, 0x9aa2a8);
  scale261.rotation.x = Math.PI / 2;
  g.add(put(scale261, 1.9, 0.5, 1.2));
  for (const s of [-1, 1]) {
    const spear = cyl(0.05, 0.05, 2.4, 5, 0x8a6a4a);
    spear.rotation.z = s * 0.15;
    g.add(put(spear, 2.3 + s * 0.25, 1.2, 0.4));
    g.add(put(cone(0.09, 0.3, 5, 0xb0b6bb), 2.3 + s * 0.25, 2.5, 0.4));
  }
  return g;
}

/* ============================================================
   ПОСТРОЙКИ: ЯПОНСКАЯ ДЕРЕВНЯ
   ============================================================ */

const SAKURA = 0xffb7d5;
const SAKURA_D = 0xff8fc0;
const TORII_RED = 0xe03f3f;
const ROOF_JP = 0x3f4a5c;

/* изогнутая крыша в японском стиле */
function jpRoof(w, d, y, color = ROOF_JP) {
  const g = new THREE.Group();
  for (const s of [-1, 1]) {
    const slope = box(w * 0.62, 0.16, d + 0.9, color);
    slope.position.set(s * w * 0.27, y + 0.4, 0);
    slope.rotation.z = s * -0.42;
    g.add(slope);
    // загнутый край
    const tip = box(w * 0.22, 0.14, d + 1.0, color);
    tip.position.set(s * (w * 0.55), y + 0.12, 0);
    tip.rotation.z = s * -0.12;
    g.add(tip);
  }
  g.add(put(box(w * 0.14, 0.2, d + 1.0, color), 0, y + 0.72, 0));
  return g;
}

/* пагода */
export function pagoda() {
  const g = new THREE.Group();
  g.add(put(box(3.2, 0.4, 3.2, STONE_W), 0, 0.2, 0));
  const tiers = [
    { w: 2.6, h: 1.7, y: 0.4 },
    { w: 2.2, h: 1.5, y: 2.5 },
    { w: 1.8, h: 1.3, y: 4.4 },
    { w: 1.4, h: 1.1, y: 6.1 },
  ];
  tiers.forEach((t) => {
    g.add(put(box(t.w, t.h, t.w, 0xe8dcc4), 0, t.y + t.h / 2, 0));
    // столбы по углам
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      g.add(put(box(0.12, t.h, 0.12, TORII_RED), sx * t.w * 0.44, t.y + t.h / 2, sz * t.w * 0.44));
    }
    // окна
    for (const s of [-1, 1]) {
      g.add(put(box(t.w * 0.45, t.h * 0.45, 0.08, 0xfff0c4, { emissive: 0xffc46b, emissiveIntensity: 0.5 }),
        0, t.y + t.h * 0.55, s * (t.w / 2 + 0.02)));
    }
    g.add(jpRoof(t.w + 0.9, t.w + 0.9, t.y + t.h, ROOF_JP));
  });
  // шпиль
  g.add(put(cyl(0.06, 0.09, 1.5, 6, C.gold), 0, 8.1, 0));
  for (let i = 0; i < 3; i++) g.add(put(cyl(0.24 - i * 0.05, 0.24 - i * 0.05, 0.06, 8, C.gold), 0, 7.7 + i * 0.3, 0));
  g.add(put(sph(0.16, C.gold), 0, 8.9, 0));
  return g;
}

/* тории */
export function torii() {
  const g = new THREE.Group();
  for (const s of [-1, 1]) {
    const pillar = cyl(0.2, 0.26, 3.4, 10, TORII_RED);
    pillar.rotation.z = s * 0.035;
    g.add(put(pillar, s * 1.5, 1.7, 0));
    g.add(put(cyl(0.3, 0.32, 0.16, 10, 0x8a2f2f), s * 1.5, 0.08, 0));
  }
  // верхняя балка с изгибом
  g.add(put(box(4.4, 0.24, 0.42, TORII_RED), 0, 3.55, 0));
  for (const s of [-1, 1]) {
    const tip = box(0.7, 0.2, 0.4, TORII_RED);
    tip.rotation.z = s * -0.18;
    g.add(put(tip, s * 2.4, 3.62, 0));
  }
  g.add(put(box(4.9, 0.16, 0.34, 0x8a2f2f), 0, 3.82, 0));
  // нижняя перекладина и табличка
  g.add(put(box(3.4, 0.18, 0.3, TORII_RED), 0, 2.8, 0));
  g.add(put(box(0.6, 0.75, 0.12, 0xf2ead6), 0, 3.15, 0));
  return g;
}

/* чайный домик */
export function teahouse() {
  const g = new THREE.Group();
  // помост на сваях
  for (const [x, z] of [[-1.5, -1.2], [1.5, -1.2], [-1.5, 1.2], [1.5, 1.2]]) {
    g.add(put(cyl(0.12, 0.14, 0.7, 7, 0x6b4a2c), x, 0.35, z));
  }
  g.add(put(box(3.6, 0.2, 3.0, 0xc9a978), 0, 0.8, 0));
  g.add(put(box(3.0, 1.7, 2.4, 0xf2ead6), 0, 1.75, -0.1));
  // решётчатые сёдзи
  for (const s of [-1, 1]) {
    for (let i = -1; i <= 1; i++) {
      g.add(put(box(0.86, 1.5, 0.05, 0xfff8e8, { emissive: 0xffd98a, emissiveIntensity: 0.4 }), i * 0.95, 1.75, s * 1.22));
      g.add(put(box(0.06, 1.5, 0.06, 0x6b4a2c), i * 0.95 - 0.45, 1.75, s * 1.25));
    }
    g.add(put(box(3.0, 0.07, 0.07, 0x6b4a2c), 0, 1.75, s * 1.26));
  }
  g.add(jpRoof(3.6, 3.0, 2.6, 0x4a5a48));
  // веранда и ступени
  g.add(put(box(3.6, 0.14, 0.8, 0xc9a978), 0, 0.9, 1.7));
  for (let i = 0; i < 2; i++) g.add(put(box(1.2, 0.12, 0.35, 0xc9a978), 0, 0.6 - i * 0.28, 2.25 + i * 0.3));
  // фонарик у входа
  g.add(put(cyl(0.05, 0.05, 0.9, 5, 0x6b4a2c), 1.5, 1.4, 1.8));
  const lamp = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 0.34, 8),
    new THREE.MeshStandardMaterial({ color: 0xffd98a, emissive: 0xffb545, emissiveIntensity: 1.1, flatShading: true })
  );
  lamp.position.set(1.5, 1.95, 1.8);
  g.add(lamp);
  return g;
}

/* сакура */
function sakuraTree(scale = 1) {
  const g = new THREE.Group();
  const trunk = cyl(0.16, 0.3, 1.6, 7, 0x6b4a44);
  g.add(put(trunk, 0, 0.8, 0));
  // ветви
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.5;
    const br = cyl(0.07, 0.11, 1.2, 5, 0x6b4a44);
    br.rotation.z = Math.cos(a) * 0.7;
    br.rotation.x = Math.sin(a) * 0.7;
    g.add(put(br, Math.cos(a) * 0.4, 1.7, Math.sin(a) * 0.4));
  }
  // крона из шапок цветов
  const puffs = [[0, 2.5, 0, 1.15], [0.85, 2.25, 0.4, 0.8], [-0.8, 2.3, -0.3, 0.85],
                 [0.3, 2.9, -0.7, 0.7], [-0.4, 2.8, 0.65, 0.72]];
  puffs.forEach(([x, y, z, r], i) => {
    g.add(put(sph(r, i % 2 ? SAKURA : SAKURA_D), x, y, z));
  });
  g.scale.setScalar(scale);
  return g;
}

export function sakuraGrove() {
  const g = new THREE.Group();
  [[0, 0, 1.0], [2.4, 1.4, 0.78], [-2.2, 1.1, 0.85], [0.7, -2.2, 0.72]].forEach(([x, z, s]) => {
    const t = sakuraTree(s);
    t.position.set(x, 0, z);
    t.rotation.y = Math.random() * Math.PI;
    g.add(t);
  });
  // опавшие лепестки
  for (let i = 0; i < 12; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 1 + Math.random() * 2.4;
    const p = cyl(0.16, 0.16, 0.03, 6, SAKURA);
    g.add(put(p, Math.cos(a) * r, 0.03, Math.sin(a) * r));
  }
  return g;
}

/* сад камней */
export function zenGarden() {
  const g = new THREE.Group();
  const sand = cyl(3.2, 3.3, 0.26, 20, 0xf0ead8);
  g.add(put(sand, 0, 0.16, 0));
  // концентрические борозды
  for (let r = 0.8; r < 3.0; r += 0.42) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.045, 5, 26), mat(0xd8d0bc));
    ring.rotation.x = Math.PI / 2;
    g.add(put(ring, 0, 0.3, 0));
  }
  // камни
  [[0.7, 0.4, 0.5], [-1.1, -0.6, 0.38], [0.2, -1.4, 0.3], [-0.5, 1.3, 0.26]].forEach(([x, z, r]) => {
    const s = sph(r, 0x8a8f92);
    s.scale.set(1.3, 0.85, 1.1);
    g.add(put(s, x, 0.3, z));
  });
  // мох и бордюр
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    const stone444 = box(0.42, 0.18, 0.18, 0x6b4a2c);
    stone444.rotation.y = -a;
    g.add(put(stone444, Math.cos(a) * 3.3, 0.2, Math.sin(a) * 3.3));
  }
  g.add(put(sph(0.3, 0x5a9e4a), 2.2, 0.28, -1.6));
  g.add(put(sph(0.22, 0x6fb45a), -2.4, 0.26, 1.2));
  return g;
}

/* каменный фонарь */
export function stoneLantern() {
  const g = new THREE.Group();
  g.add(put(cyl(0.5, 0.6, 0.3, 8, 0x9a9f9a), 0, 0.15, 0));
  g.add(put(cyl(0.18, 0.2, 1.5, 8, 0xa8ada6), 0, 1.0, 0));
  g.add(put(cyl(0.46, 0.4, 0.18, 8, 0x9a9f9a), 0, 1.85, 0));
  // светящаяся камера
  const box1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 0.6, 6),
    new THREE.MeshStandardMaterial({ color: 0xffe6a8, emissive: 0xffb545, emissiveIntensity: 1.2, flatShading: true })
  );
  g.add(put(box1, 0, 2.24, 0));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.add(put(box(0.08, 0.62, 0.08, 0x8a8f8a), Math.cos(a) * 0.4, 2.24, Math.sin(a) * 0.4));
  }
  const l = new THREE.PointLight(0xffb545, 0.6, 6);
  l.position.set(0, 2.24, 0);
  g.add(l);
  // крыша
  g.add(put(cone(0.75, 0.45, 6, 0x7a7f7a), 0, 2.8, 0));
  g.add(put(sph(0.13, 0x7a7f7a), 0, 3.1, 0));
  return g;
}

/* пруд с карпами */
export function koiPond(store) {
  const g = new THREE.Group();
  const basin = cyl(2.6, 2.7, 0.34, 18, 0x7a6f5a);
  g.add(put(basin, 0, 0.1, 0));
  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(2.4, 2.4, 0.3, 20),
    mat(0x2f9e8f, { roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.88, flatShading: false })
  );
  g.add(put(water, 0, 0.22, 0));
  store.pondWater = water;
  // карпы
  const koi = [];
  [[0.9, 0.3, 0xff6a3f], [-0.7, -0.6, 0xfff0e0], [0.2, 1.0, 0xffb03f]].forEach(([x, z, c]) => {
    const f = new THREE.Group();
    const body = sph(0.22, c);
    body.scale.set(1.7, 0.55, 0.8);
    f.add(body);
    const tail = cone(0.16, 0.3, 4, c);
    tail.rotation.z = Math.PI / 2;
    f.add(put(tail, -0.42, 0, 0));
    f.position.set(x, 0.34, z);
    f.userData.a = Math.random() * 6.28;
    f.userData.r = Math.hypot(x, z) || 1;
    g.add(f);
    koi.push(f);
  });
  store.koi = koi;
  // камни и кувшинки
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.add(put(sph(0.24 + (i % 3) * 0.07, 0x8a8f92), Math.cos(a) * 2.75, 0.2, Math.sin(a) * 2.75));
  }
  for (const [x, z] of [[1.2, 0.6], [-1.0, 0.9]]) {
    g.add(put(cyl(0.34, 0.34, 0.04, 8, 0x4a9e4a), x, 0.38, z));
  }
  g.add(put(sph(0.14, SAKURA), 1.2, 0.46, 0.6));
  return g;
}

/* красный мостик */
export function jpBridge() {
  const g = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    const z = -1.9 + t * 3.8;
    const y = 0.5 + Math.sin(t * Math.PI) * 0.7;
    const plank = box(1.9, 0.13, 0.45, TORII_RED);
    plank.rotation.x = Math.cos(t * Math.PI) * 0.36;
    g.add(put(plank, 0, y, z));
  }
  for (const s of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const t = i / 4;
      const z = -1.8 + t * 3.6;
      const y = 0.5 + Math.sin(t * Math.PI) * 0.7;
      g.add(put(box(0.1, 0.75, 0.1, TORII_RED), s * 0.88, y + 0.38, z));
    }
    for (let i = 0; i < 4; i++) {
      const t1 = i / 4, t2 = (i + 1) / 4;
      const z1 = -1.8 + t1 * 3.6, z2 = -1.8 + t2 * 3.6;
      const y1 = 0.5 + Math.sin(t1 * Math.PI) * 0.7 + 0.72;
      const y2 = 0.5 + Math.sin(t2 * Math.PI) * 0.7 + 0.72;
      const len = Math.hypot(z2 - z1, y2 - y1);
      const rail = box(0.09, 0.09, len, TORII_RED);
      rail.position.set(s * 0.88, (y1 + y2) / 2, (z1 + z2) / 2);
      rail.rotation.x = -Math.atan2(y2 - y1, z2 - z1);
      g.add(rail);
    }
  }
  return g;
}

/* ============================================================
   ПОСТРОЙКИ: ПОРТ
   ============================================================ */

const HULL = 0xc4453f;

/* причал */
export function wharf() {
  const g = new THREE.Group();
  g.add(put(box(9.0, 0.5, 3.4, 0x9a8f7a), 0, 0.55, 0));
  for (let i = 0; i < 9; i++) {
    g.add(put(box(8.8, 0.06, 0.28, 0x8a7f6a), 0, 0.81, -1.5 + i * 0.38));
  }
  // сваи
  for (let x = -4; x <= 4; x += 2) {
    for (const z of [-1.5, 1.5]) {
      g.add(put(cyl(0.18, 0.2, 1.4, 8, 0x6b4a2c), x, 0.0, z));
    }
  }
  // кнехты и покрышки
  for (let x = -3; x <= 3; x += 3) {
    g.add(put(cyl(0.2, 0.24, 0.5, 8, 0x44484c), x, 1.05, 1.4));
    g.add(put(cyl(0.28, 0.28, 0.1, 8, 0x33373a), x, 1.32, 1.4));
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.1, 6, 10), mat(0x2e3236));
    g.add(put(tire, x + 1.2, 0.55, 1.75));
  }
  // канаты
  for (let i = 0; i < 3; i++) {
    const rope577 = cyl(0.05, 0.05, 1.1, 5, 0xc4a165);
    rope577.rotation.x = 0.8;
    g.add(put(rope577, -3 + i * 3, 1.0, 1.9));
  }
  return g;
}

/* портовый кран */
export function portCrane(store) {
  const g = new THREE.Group();
  // основание на рельсах
  g.add(put(box(3.0, 0.3, 2.4, 0x55606b), 0, 0.15, 0));
  for (const z of [-0.9, 0.9]) g.add(put(box(3.4, 0.12, 0.2, 0x8d949a), 0, 0.05, z));
  // мачта
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(put(box(0.16, 5.5, 0.16, 0xe8a83c), sx * 0.7, 2.9, sz * 0.7));
  }
  for (let y = 1.2; y < 5.4; y += 1.1) {
    for (const s of [-1, 1]) {
      g.add(put(box(1.5, 0.09, 0.09, 0xd09a34), 0, y, s * 0.7));
      g.add(put(box(0.09, 0.09, 1.5, 0xd09a34), s * 0.7, y, 0));
    }
  }
  // кабина
  g.add(put(box(1.1, 0.9, 1.1, 0xe8a83c), 0, 6.1, 0));
  g.add(put(box(0.95, 0.5, 0.08, 0xcfe4ec, { transparent: true, opacity: 0.75 }), 0, 6.2, 0.58));
  // стрела
  const jib = new THREE.Group();
  jib.add(put(box(6.0, 0.16, 0.16, 0xe8a83c), 2.4, 0, 0));
  jib.add(put(box(6.0, 0.16, 0.16, 0xe8a83c), 2.4, -0.5, 0));
  for (let i = 0; i < 7; i++) {
    const d = box(0.1, 0.55, 0.1, 0xd09a34);
    jib.add(put(d, 0.2 + i * 0.85, -0.25, 0));
  }
  // противовес
  jib.add(put(box(1.2, 0.9, 1.0, 0x8d949a), -1.4, -0.1, 0));
  jib.position.set(0, 6.7, 0);
  g.add(jib);
  store.craneJib = jib;
  // трос с крюком
  const hook = new THREE.Group();
  hook.add(put(cyl(0.04, 0.04, 2.4, 4, 0x55595e), 0, -1.2, 0));
  hook.add(put(box(0.4, 0.3, 0.4, 0x44484c), 0, -2.5, 0));
  hook.add(put(cyl(0.08, 0.08, 0.5, 6, 0x8d949a), 0, -2.9, 0));
  hook.position.set(4.2, 0, 0);
  jib.add(hook);
  store.craneHook = hook;
  return g;
}

/* контейнеры */
export function containers() {
  const g = new THREE.Group();
  const cols = [0xd94f4f, 0x3f8fc4, 0x4fa85a, 0xe8a83c, 0x8f5aa8];
  const layout = [[0, 0, 3], [1, 0, 2], [-1, 0, 2], [0, 1, 2], [1, 1, 1], [-1, 1, 1]];
  layout.forEach(([cx, cz, h], i) => {
    for (let k = 0; k < h; k++) {
      const c = box(2.3, 1.0, 1.15, cols[(i + k) % cols.length]);
      g.add(put(c, cx * 2.5, 0.55 + k * 1.05, cz * 1.3));
      // рёбра жёсткости
      for (let r = -4; r <= 4; r++) {
        g.add(put(box(0.06, 0.88, 0.04, 0x00000022), cx * 2.5 + r * 0.24, 0.55 + k * 1.05, cz * 1.3 + 0.6));
      }
    }
  });
  return g;
}

/* склад */
export function warehouse() {
  const g = new THREE.Group();
  g.add(put(box(6.4, 3.0, 4.2, 0xc9c2b0), 0, 1.5, 0));
  // рифлёные стены
  for (let i = -7; i <= 7; i++) {
    g.add(put(box(0.08, 3.0, 0.06, 0xb0a894), i * 0.42, 1.5, 2.13));
  }
  // двускатная крыша
  for (const s of [-1, 1]) {
    const slope = box(3.6, 0.2, 4.6, 0x7a8590);
    slope.position.set(s * 1.5, 3.5, 0);
    slope.rotation.z = s * -0.42;
    g.add(slope);
  }
  g.add(put(box(0.3, 0.2, 4.7, 0x5f6a75), 0, 4.15, 0));
  // ворота
  g.add(put(box(2.6, 2.2, 0.14, 0x5a8fa8), 0, 1.1, 2.18));
  for (let i = 0; i < 6; i++) g.add(put(box(2.5, 0.08, 0.06, 0x4a7a92), 0, 0.3 + i * 0.38, 2.25));
  // окна под крышей
  for (const x of [-2.2, 2.2]) {
    g.add(put(box(1.0, 0.6, 0.1, 0x9fd7e6, { transparent: true, opacity: 0.7 }), x, 2.5, 2.15));
  }
  // поддоны
  for (const [x, z] of [[3.8, 1.6], [4.3, 0.6]]) {
    g.add(put(box(1.0, 0.14, 0.9, 0x8a6a4a), x, 0.1, z));
    g.add(put(box(0.85, 0.6, 0.75, 0xc4a165), x, 0.45, z));
  }
  return g;
}

/* грузовое судно */
export function cargoShip(store) {
  const g = new THREE.Group();
  // корпус
  const hull = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 1.5, 8.5),
    mat(HULL)
  );
  hull.castShadow = true;
  g.add(put(hull, 0, 0.9, 0));
  // нос клином
  const bow = new THREE.Mesh(new THREE.ConeGeometry(1.45, 2.4, 4), mat(HULL));
  bow.rotation.x = -Math.PI / 2;
  bow.rotation.y = Math.PI / 4;
  bow.scale.set(1, 1, 0.62);
  g.add(put(bow, 0, 0.9, 5.2));
  // ватерлиния
  g.add(put(box(2.9, 0.28, 8.6, 0x2e2a28), 0, 0.34, 0));
  // палуба
  g.add(put(box(2.6, 0.16, 8.3, 0xd8cfb8), 0, 1.7, 0));
  // надстройка
  g.add(put(box(2.2, 1.6, 2.0, 0xf0ead8), 0, 2.5, -2.6));
  g.add(put(box(1.8, 0.9, 1.6, 0xf0ead8), 0, 3.7, -2.6));
  for (const s of [-1, 1]) {
    g.add(put(box(0.08, 0.5, 1.4, 0x8fd0e6, { transparent: true, opacity: 0.75 }), s * 0.92, 3.7, -2.6));
  }
  g.add(put(box(1.6, 0.5, 0.08, 0x8fd0e6, { transparent: true, opacity: 0.75 }), 0, 3.7, -1.82));
  // труба
  g.add(put(cyl(0.32, 0.36, 1.2, 10, 0x2e3236), 0, 4.7, -3.0));
  g.add(put(cyl(0.34, 0.34, 0.3, 10, 0xd94f4f), 0, 4.9, -3.0));
  // контейнеры на палубе
  const cc = [0x3f8fc4, 0x4fa85a, 0xe8a83c, 0x8f5aa8];
  for (let r = 0; r < 4; r++) {
    for (let c = -1; c <= 1; c++) {
      const h = r === 1 || r === 2 ? 2 : 1;
      for (let k = 0; k < h; k++) {
        g.add(put(box(0.72, 0.5, 1.6, cc[(r + c + k + 4) % 4]), c * 0.8, 2.05 + k * 0.55, 2.6 - r * 1.75));
      }
    }
  }
  // мачта и флаг
  g.add(put(cyl(0.06, 0.06, 1.8, 5, 0x8d949a), 0, 5.0, -1.9));
  g.add(put(box(0.6, 0.36, 0.04, 0xd94f4f), 0.33, 5.6, -1.9));
  g.userData.phase = Math.random() * 6;
  store.ships = [...(store.ships || []), g];
  return g;
}

/* рыбный рынок */
export function fishMarket() {
  const g = new THREE.Group();
  g.add(put(box(4.6, 0.3, 3.0, 0xd8d0bc), 0, 0.15, 0));
  // навес на столбах
  for (const [x, z] of [[-2.0, -1.2], [2.0, -1.2], [-2.0, 1.2], [2.0, 1.2]]) {
    g.add(put(cyl(0.1, 0.12, 2.4, 8, 0x8a6a4a), x, 1.2, z));
  }
  for (let i = -3; i <= 3; i++) {
    const stripe = box(0.66, 0.1, 3.4, i % 2 ? 0x3f8fc4 : 0xfaf3e4);
    stripe.rotation.x = 0;
    g.add(put(stripe, i * 0.68, 2.5, 0));
  }
  // прилавки со льдом и рыбой
  for (const z of [-0.7, 0.7]) {
    g.add(put(box(4.0, 0.7, 0.9, 0xc4a165), 0, 0.65, z));
    g.add(put(box(3.8, 0.14, 0.8, 0xd8eef5), 0, 1.05, z));
    for (let i = -3; i <= 3; i++) {
      const f = sph(0.16, [0x8fa8b8, 0xc4785a, 0x9ab0c4][Math.abs(i) % 3]);
      f.scale.set(1.6, 0.7, 0.9);
      g.add(put(f, i * 0.52, 1.16, z));
    }
  }
  // ящики и весы
  g.add(put(box(0.7, 0.5, 0.6, 0x8a6a4a), 2.6, 0.25, 1.7));
  g.add(put(cyl(0.24, 0.24, 0.1, 8, 0x9aa2a8), -2.4, 1.15, 1.4));
  g.add(put(cyl(0.06, 0.06, 0.4, 6, 0x9aa2a8), -2.4, 1.35, 1.4));
  return g;
}

/* маячная будка и буи */
export function harborBuoys(store) {
  const g = new THREE.Group();
  const buoys = [];
  [[0, 0, 0xd94f4f], [2.2, 1.4, 0x4fa85a], [-2.0, 1.0, 0xe8a83c]].forEach(([x, z, c]) => {
    const b = new THREE.Group();
    const body = cone(0.42, 1.1, 8, c);
    b.add(put(body, 0, 0.55, 0));
    b.add(put(cyl(0.45, 0.5, 0.3, 8, 0xf0ead8), 0, 0.15, 0));
    b.add(put(cyl(0.06, 0.06, 0.5, 5, 0x8d949a), 0, 1.3, 0));
    const lamp = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.15, 0),
      new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.2, flatShading: true })
    );
    lamp.position.set(0, 1.6, 0);
    b.add(lamp);
    b.position.set(x, 0.1, z);
    b.userData.phase = Math.random() * 6;
    g.add(b);
    buoys.push(b);
  });
  store.buoys = buoys;
  return g;
}
