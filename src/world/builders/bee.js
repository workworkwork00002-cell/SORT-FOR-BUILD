import * as THREE from "three";
import { mixHexNum } from "../../board/models";
import { box, cone, cyl, mat, put, sph } from "../../core/geometry";


/* ============================================================
   ПОСТРОЙКИ: ПАСЕКА
   ============================================================ */

const HONEY = 0xe8a02c;
const HONEY_D = 0xb87718;

/* улей-башенка */
export function beehive(store) {
  const g = new THREE.Group();
  // подставка
  g.add(put(box(1.5, 0.2, 1.3, 0x8a6a45), 0, 0.1, 0));
  for (const [x, z] of [[-0.55, -0.45], [0.55, -0.45], [-0.55, 0.45], [0.55, 0.45]]) {
    g.add(put(box(0.14, 0.4, 0.14, 0x6b4a2c), x, 0.4, z));
  }
  // корпуса стопкой
  for (let i = 0; i < 3; i++) {
    const y = 0.75 + i * 0.62;
    g.add(put(box(1.35 - i * 0.05, 0.56, 1.15 - i * 0.04, i % 2 ? 0xf0dcae : 0xe8cf98), 0, y, 0));
    g.add(put(box(1.42 - i * 0.05, 0.08, 1.22 - i * 0.04, 0xc9a878), 0, y + 0.3, 0));
    // леток
    g.add(put(box(0.5, 0.07, 0.05, 0x5a4530), 0, y - 0.18, 0.6 - i * 0.02));
  }
  // крышка
  g.add(put(box(1.5, 0.14, 1.3, 0x8a5f3a), 0, 2.55, 0));
  const roof = cone(1.1, 0.5, 4, 0x7a4f2c);
  roof.rotation.y = Math.PI / 4;
  g.add(put(roof, 0, 2.85, 0));
  // пчёлы кружат
  const bees = [];
  for (let i = 0; i < 5; i++) {
    const b = new THREE.Group();
    b.add(put(sph(0.09, HONEY), 0, 0, 0));
    b.add(put(box(0.14, 0.05, 0.06, 0x3a3028), 0, 0, 0));
    for (const s of [-1, 1]) {
      b.add(put(box(0.12, 0.02, 0.09, 0xdfe8ee, { transparent: true, opacity: 0.7 }), 0, 0.06, s * 0.07));
    }
    b.userData.a = (i / 5) * Math.PI * 2;
    b.userData.r = 1.1 + Math.random() * 0.6;
    b.userData.y = 1.4 + Math.random() * 0.9;
    g.add(b);
    bees.push(b);
  }
  store.bees = [...(store.bees || []), ...bees];
  return g;
}

/* поле медоносов */
export function meadow() {
  const g = new THREE.Group();
  g.add(put(cyl(3.0, 3.1, 0.14, 18, 0x6fae4a), 0, 0.07, 0));
  const cols = [0xf2c144, 0xe8749a, 0xa87fd4, 0xf0e8d4];
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 2.6;
    const h = 0.35 + Math.random() * 0.35;
    const f = new THREE.Group();
    f.add(put(cyl(0.035, 0.045, h, 5, 0x4f8f3a), 0, h / 2, 0));
    const col = cols[i % cols.length];
    // лепестки
    for (let k = 0; k < 5; k++) {
      const ang = (k / 5) * Math.PI * 2;
      const pet = sph(0.1, col);
      pet.scale.set(1, 0.4, 1.5);
      f.add(put(pet, Math.cos(ang) * 0.11, h, Math.sin(ang) * 0.11));
    }
    f.add(put(sph(0.07, HONEY), 0, h + 0.03, 0));
    f.position.set(Math.cos(a) * r, 0.14, Math.sin(a) * r);
    g.add(f);
  }
  return g;
}

/* медоварня */
export function honeyHouse() {
  const g = new THREE.Group();
  g.add(put(box(3.0, 1.9, 2.4, 0xe8cf98), 0, 0.95, 0));
  // фахверк
  for (let i = -2; i <= 2; i++) {
    g.add(put(box(0.1, 1.9, 0.06, 0x7a5230), i * 0.6, 0.95, 1.22));
  }
  g.add(put(box(3.0, 0.1, 0.06, 0x7a5230), 0, 1.0, 1.22));
  // соломенная крыша
  for (const s of [-1, 1]) {
    const slope = box(2.2, 0.24, 2.8, 0xc9a05a);
    slope.position.set(s * 0.9, 2.55, 0);
    slope.rotation.z = s * -0.55;
    g.add(slope);
  }
  g.add(put(box(0.3, 0.2, 2.9, 0xb08f44), 0, 3.15, 0));
  // дверь и окно
  g.add(put(box(0.8, 1.3, 0.1, 0x6b4a2c), -0.7, 0.65, 1.24));
  g.add(put(box(0.6, 0.6, 0.08, 0xffd98a, { emissive: 0xffb545, emissiveIntensity: 0.85 }), 0.8, 1.2, 1.24));
  // бочонки мёда
  for (const [x, z] of [[1.9, 0.6], [2.2, -0.2]]) {
    g.add(put(cyl(0.32, 0.28, 0.7, 12, HONEY_D), x, 0.35, z));
    g.add(put(cyl(0.3, 0.3, 0.06, 12, HONEY), x, 0.71, z));
  }
  // вывеска-сота
  const cell = cyl(0.3, 0.3, 0.1, 6, HONEY);
  cell.rotation.x = Math.PI / 2;
  g.add(put(cell, 1.7, 2.2, 0.8));
  return g;
}

/* соты на раме */
export function honeycombFrame() {
  const g = new THREE.Group();
  g.add(put(box(2.0, 0.12, 0.16, 0x8a6a45), 0, 1.7, 0));
  for (const s of [-1, 1]) g.add(put(box(0.12, 1.7, 0.16, 0x8a6a45), s * 0.94, 0.85, 0));
  g.add(put(box(2.0, 0.12, 0.16, 0x8a6a45), 0, 0.05, 0));
  // шестиугольные ячейки
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const x = -0.72 + col * 0.36 + (row % 2 ? 0.18 : 0);
      const y = 0.3 + row * 0.3;
      if (Math.abs(x) > 0.8) continue;
      const c = cyl(0.17, 0.17, 0.12, 6, row + col > 4 ? HONEY : mixHexNum(HONEY, 0xffffff, 0.35));
      c.rotation.x = Math.PI / 2;
      g.add(put(c, x, y, 0));
    }
  }
  return g;
}

/* ============================================================
   ПОСТРОЙКИ: ОБСЕРВАТОРИЯ
   ============================================================ */

const DOME_W = 0xdfe4ea;

/* купол с телескопом */
export function observatoryDome(store) {
  const g = new THREE.Group();
  // основание
  g.add(put(cyl(2.2, 2.4, 2.2, 16, 0xc4ccd4), 0, 1.1, 0));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.add(put(box(0.4, 0.7, 0.1, 0x8fd0e6, { emissive: 0x2a5a70, emissiveIntensity: 0.4 }),
      Math.cos(a) * 2.25, 1.3, Math.sin(a) * 2.25)).rotation.y = -a;
  }
  // купол
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    mat(DOME_W, { flatShading: false })
  );
  dome.castShadow = true;
  const domeG = new THREE.Group();
  domeG.add(put(dome, 0, 0, 0));
  // прорезь
  domeG.add(put(box(0.7, 2.3, 2.3, 0x2a2f36), 0, 1.0, 0.6));
  // телескоп в прорези
  const tube = cyl(0.28, 0.34, 2.4, 14, 0x6e757c);
  tube.rotation.x = -0.7;
  domeG.add(put(tube, 0, 1.2, 0.5));
  domeG.add(put(cyl(0.36, 0.36, 0.14, 14, 0x4a5057), 0, 1.9, 1.1)).rotation.x = -0.7;
  domeG.position.y = 2.2;
  g.add(domeG);
  store.dome = domeG;
  return g;
}

/* радиотелескоп */
export function radioDish(store) {
  const g = new THREE.Group();
  g.add(put(cyl(0.8, 1.0, 0.4, 12, 0x8a8f96), 0, 0.2, 0));
  g.add(put(cyl(0.24, 0.28, 2.6, 10, 0x9aa2ac), 0, 1.5, 0));
  const arm = new THREE.Group();
  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2.6),
    mat(0xeff2f5, { side: THREE.DoubleSide, flatShading: false })
  );
  dish.rotation.x = Math.PI;
  arm.add(put(dish, 0, 0, 0));
  // приёмник на треноге
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const leg = cyl(0.04, 0.04, 1.2, 5, 0x8a8f96);
    leg.rotation.z = Math.cos(a) * 0.32;
    leg.rotation.x = Math.sin(a) * 0.32;
    arm.add(put(leg, Math.cos(a) * 0.3, -0.6, Math.sin(a) * 0.3));
  }
  arm.add(put(box(0.28, 0.28, 0.28, 0xd94f4f), 0, -1.2, 0));
  arm.position.set(0, 3.0, 0);
  arm.rotation.x = -0.5;
  g.add(arm);
  store.dish = arm;
  return g;
}

/* звёздная карта на постаменте */
export function starChart(store) {
  const g = new THREE.Group();
  g.add(put(cyl(1.0, 1.2, 0.7, 12, 0x8a8278), 0, 0.35, 0));
  const disc = cyl(0.95, 0.95, 0.12, 20, 0x2a3550);
  disc.rotation.x = -0.35;
  g.add(put(disc, 0, 0.78, 0));
  // созвездия
  const stars = [];
  for (let i = 0; i < 11; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.75;
    const st = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.06 + Math.random() * 0.05, 0),
      new THREE.MeshStandardMaterial({
        color: 0xfff0c0, emissive: 0xffe08a, emissiveIntensity: 1.2, flatShading: true,
      })
    );
    st.position.set(Math.cos(a) * r, 0.88 + Math.sin(-0.35) * 0, Math.sin(a) * r);
    g.add(st);
    stars.push(st);
  }
  store.chartStars = [...(store.chartStars || []), ...stars];
  const l = new THREE.PointLight(0x8fb4ff, 0.5, 6);
  l.position.set(0, 1.4, 0);
  g.add(l);
  return g;
}

/* домик астронома */
export function astronomerHut() {
  const g = new THREE.Group();
  g.add(put(box(2.6, 1.8, 2.2, 0xb4bcc8), 0, 0.9, 0));
  g.add(put(box(2.8, 0.16, 2.4, 0x8a92a0), 0, 1.85, 0));
  // плоская крыша с площадкой
  for (const s of [-1, 1]) {
    g.add(put(box(0.1, 0.4, 2.4, 0x6e757c), s * 1.35, 2.1, 0));
    g.add(put(box(2.8, 0.4, 0.1, 0x6e757c), 0, 2.1, s * 1.15));
  }
  // маленький телескоп на крыше
  g.add(put(cyl(0.07, 0.07, 0.5, 8, 0x55595e), 0.6, 2.3, 0));
  const sm = cyl(0.13, 0.16, 0.9, 10, 0x4f8fc4);
  sm.rotation.x = -0.8;
  g.add(put(sm, 0.6, 2.7, 0));
  // окна
  for (const x of [-0.75, 0.75]) {
    g.add(put(box(0.55, 0.6, 0.08, 0xffd98a, { emissive: 0xffb545, emissiveIntensity: 0.8 }), x, 1.1, 1.12));
  }
  g.add(put(box(0.7, 1.2, 0.1, 0x4a5057), 0, 0.6, 1.12));
  return g;
}

/* ============================================================
   ПОСТРОЙКИ: ХУДОЖЕСТВЕННЫЙ КВАРТАЛ
   ============================================================ */

const CANVAS_W = 0xf5f0e4;

/* галерея со стеклянным фасадом */
export function artGallery() {
  const g = new THREE.Group();
  g.add(put(box(4.4, 3.0, 3.0, CANVAS_W), 0, 1.5, 0));
  // витражный фасад
  const cols = [0xd94f4f, 0x4f8fc4, 0xf2c144, 0x5aa85a, 0xa87fd4];
  for (let i = 0; i < 5; i++) {
    g.add(put(box(0.72, 2.0, 0.1, cols[i], {
      transparent: true, opacity: 0.62, emissive: cols[i], emissiveIntensity: 0.3,
    }), -1.6 + i * 0.8, 1.6, 1.53));
  }
  g.add(put(box(4.5, 0.2, 3.1, 0xc9c2b4), 0, 3.1, 0));
  // козырёк
  const canopy = box(4.8, 0.12, 1.2, 0xd8d0c0);
  canopy.rotation.x = -0.18;
  g.add(put(canopy, 0, 2.9, 1.9));
  // вход
  g.add(put(box(1.0, 1.4, 0.12, 0x6e6558), 0, 0.7, 1.55));
  // скульптура у входа
  const s1 = new THREE.Mesh(new THREE.TorusKnotGeometry(0.35, 0.12, 48, 8), mat(0xc9a23c, { flatShading: false }));
  g.add(put(s1, 2.6, 1.0, 1.4));
  g.add(put(cyl(0.35, 0.42, 0.6, 10, 0x8a8278), 2.6, 0.3, 1.4));
  return g;
}

/* стена с муралом */
export function muralWall() {
  const g = new THREE.Group();
  g.add(put(box(4.6, 3.2, 0.4, 0xc4bcae), 0, 1.6, 0));
  // абстрактные пятна
  const cols = [0xe8544a, 0x3f8fc4, 0xf2c144, 0x5aa85a, 0xa87fd4, 0xe8749a];
  for (let i = 0; i < 9; i++) {
    const x = -1.9 + (i % 3) * 1.4 + (Math.random() - 0.5) * 0.4;
    const y = 0.7 + Math.floor(i / 3) * 0.95 + (Math.random() - 0.5) * 0.3;
    const col = cols[i % cols.length];
    if (i % 3 === 0) {
      const c = cyl(0.42, 0.42, 0.06, 14, col);
      c.rotation.x = Math.PI / 2;
      g.add(put(c, x, y, 0.22));
    } else if (i % 3 === 1) {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.06, 3), mat(col));
      t.rotation.x = Math.PI / 2;
      t.rotation.z = Math.random() * 3;
      g.add(put(t, x, y, 0.22));
    } else {
      g.add(put(box(0.7, 0.5, 0.06, col), x, y, 0.22));
    }
  }
  // подпись художника
  g.add(put(box(0.9, 0.16, 0.06, 0x3a352e), 1.6, 0.35, 0.22));
  // банки краски внизу
  for (let i = 0; i < 3; i++) {
    const c = cols[i];
    g.add(put(cyl(0.19, 0.17, 0.34, 10, c), -2.4 + i * 0.45, 0.17, 0.6));
    g.add(put(cyl(0.2, 0.2, 0.05, 10, mixHexNum(c, 0xffffff, 0.4)), -2.4 + i * 0.45, 0.36, 0.6));
  }
  return g;
}

/* мастерская скульптора */
export function sculptorStudio(store) {
  const g = new THREE.Group();
  g.add(put(box(3.2, 2.2, 2.6, 0xd8d0c0), 0, 1.1, 0));
  // большое окно-фонарь
  const glass = box(2.4, 1.0, 0.1, 0x9fd4e8, {
    transparent: true, opacity: 0.6, emissive: 0x3a6a7a, emissiveIntensity: 0.4,
  });
  g.add(put(glass, 0, 1.5, 1.32));
  for (let i = -2; i <= 2; i++) g.add(put(box(0.08, 1.0, 0.12, 0x8a8278), i * 0.55, 1.5, 1.34));
  // односкатная крыша
  const roof = box(3.6, 0.18, 3.0, 0xa8a094);
  roof.rotation.x = -0.22;
  g.add(put(roof, 0, 2.45, 0));
  g.add(put(box(1.0, 1.5, 0.12, 0x6e6558), -1.0, 0.75, 1.32));
  // статуя в работе на поворотном столе
  const stand = new THREE.Group();
  stand.add(put(cyl(0.5, 0.6, 0.3, 12, 0x8a8278), 0, 0.15, 0));
  const fig = new THREE.Group();
  fig.add(put(cyl(0.26, 0.34, 1.0, 10, 0xe0d8c8), 0, 0.5, 0));
  fig.add(put(sph(0.24, 0xe8e0d0), 0, 1.15, 0));
  for (const s of [-1, 1]) {
    const arm = cyl(0.09, 0.09, 0.6, 8, 0xe0d8c8);
    arm.rotation.z = s * 0.9;
    fig.add(put(arm, s * 0.3, 0.75, 0));
  }
  fig.position.y = 0.3;
  stand.add(fig);
  stand.position.set(2.2, 0, 1.0);
  g.add(stand);
  store.sculptStand = stand;
  // инструменты
  g.add(put(box(1.0, 0.1, 0.5, 0x8a6a45), 2.2, 0.6, -0.8));
  for (let i = 0; i < 3; i++) {
    g.add(put(cyl(0.04, 0.04, 0.34, 6, 0x9aa2ac), 1.9 + i * 0.3, 0.75, -0.8));
  }
  return g;
}

/* фонтан-мобиль */
export function kineticSculpture(store) {
  const g = new THREE.Group();
  g.add(put(cyl(1.0, 1.2, 0.34, 14, 0x9a9284), 0, 0.17, 0));
  g.add(put(cyl(0.14, 0.16, 3.0, 10, 0x6e757c), 0, 1.7, 0));
  // подвижные кольца
  const rings = [];
  [[1.3, 0xd94f4f], [1.0, 0x4f8fc4], [0.7, 0xf2c144]].forEach(([r, col], i) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.09, 8, 22), mat(col));
    ring.rotation.x = Math.PI / 2 + i * 0.5;
    const holder = new THREE.Group();
    holder.add(ring);
    holder.position.y = 2.2 + i * 0.4;
    g.add(holder);
    rings.push(holder);
  });
  store.kineticRings = [...(store.kineticRings || []), ...rings];
  g.add(put(sph(0.22, 0xc9a23c, { emissive: 0xc9a23c, emissiveIntensity: 0.4 }), 0, 3.5, 0));
  return g;
}
