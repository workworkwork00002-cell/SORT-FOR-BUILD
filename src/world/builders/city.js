import * as THREE from "three";
import { C, box, cone, cyl, mat, put, sph } from "../../core/geometry";
import { ASPHALT, ASPHALT_LIGHT, CONCRETE } from "./town";


/* ============================================================
   ПОСТРОЙКИ: ГОРОД
   ============================================================ */

/* универсальная высотка с сеткой окон */
export function highrise({ floors = 8, w = 3.0, d = 3.0, color = 0xc9cdd2, glass = 0x6fa8c8, setback = 0 }) {
  const g = new THREE.Group();
  const fh = 1.0;
  let curW = w, curD = d, y = 0;
  const sections = setback ? 3 : 1;
  const perSection = Math.ceil(floors / sections);

  for (let s = 0; s < sections; s++) {
    const h = perSection * fh;
    const body = box(curW, h, curD, color);
    g.add(put(body, 0, y + h / 2, 0));

    // ленты окон
    for (let f = 0; f < perSection; f++) {
      const wy = y + f * fh + fh * 0.55;
      for (const [ax, az, ww, dd] of [
        [0, curD / 2 + 0.02, curW * 0.82, 0.06],
        [0, -curD / 2 - 0.02, curW * 0.82, 0.06],
      ]) {
        g.add(put(box(ww, 0.42, dd, glass, { emissive: 0x24414f, emissiveIntensity: 0.35 }), ax, wy, az));
      }
      for (const sx of [curW / 2 + 0.02, -curW / 2 - 0.02]) {
        g.add(put(box(0.06, 0.42, curD * 0.82, glass, { emissive: 0x24414f, emissiveIntensity: 0.35 }), sx, wy, 0));
      }
    }
    // карниз
    g.add(put(box(curW + 0.18, 0.16, curD + 0.18, 0xb0b6bb), 0, y + h, 0));
    y += h;
    curW *= 1 - setback;
    curD *= 1 - setback;
  }

  // крышное оборудование
  g.add(put(box(curW * 0.4, 0.5, curD * 0.4, 0x9aa2a8), 0, y + 0.25, 0));
  g.add(put(cyl(0.09, 0.09, 1.6, 6, 0x8d949a), curW * 0.22, y + 1.0, 0));
  const beacon = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.13, 0),
    new THREE.MeshStandardMaterial({ color: 0xff6b5a, emissive: 0xff3b2f, emissiveIntensity: 1.4, flatShading: true })
  );
  beacon.position.set(curW * 0.22, y + 1.85, 0);
  g.add(beacon);
  g.userData.beacon = beacon;
  return g;
}

/* проспект: широкая дорога с разделителем */
export function buildAvenue() {
  const g = new THREE.Group();
  const road = box(8.0, 0.24, 22, ASPHALT);
  g.add(put(road, 0, 0.16, 0));
  // разделительная полоса с газоном
  g.add(put(box(0.9, 0.3, 22, 0x7aa85f), 0, 0.24, 0));
  for (let z = -9; z <= 9; z += 3) {
    g.add(put(cone(0.28, 0.8, 6, C.leaf), 0, 0.6, z));
  }
  // разметка полос
  for (const x of [-2.0, 2.0]) {
    for (let z = -10; z <= 10; z += 2.2) {
      g.add(put(box(0.16, 0.05, 1.1, 0xf0e6cf), x, 0.3, z));
    }
  }
  for (const x of [-3.9, 3.9]) g.add(put(box(0.18, 0.05, 22, 0xf0e6cf), x, 0.3, 0));
  for (const x of [-4.4, 4.4]) g.add(put(box(0.5, 0.4, 22, CONCRETE), x, 0.22, 0));
  return g;
}

/* перекрёсток со светофорами и зеброй */
export function buildCrossroad(store) {
  const g = new THREE.Group();
  const cross = box(9.0, 0.26, 9.0, ASPHALT_LIGHT);
  g.add(put(cross, 0, 0.17, 0));
  // зебра
  for (const [rot, off] of [[0, 4.0], [0, -4.0]]) {
    for (let i = -3; i <= 3; i++) {
      g.add(put(box(0.5, 0.05, 2.2, 0xf0e6cf), i * 0.85, 0.31, off));
    }
  }
  for (const off of [4.0, -4.0]) {
    for (let i = -3; i <= 3; i++) {
      g.add(put(box(2.2, 0.05, 0.5, 0xf0e6cf), off, 0.31, i * 0.85));
    }
  }

  const lights = [];
  for (const [x, z, ry] of [[4.6, 4.6, 0], [-4.6, -4.6, Math.PI]]) {
    const tl = new THREE.Group();
    tl.add(put(cyl(0.1, 0.12, 3.2, 6, 0x44484c), 0, 1.6, 0));
    const boxL = box(0.42, 1.1, 0.32, 0x33373a);
    tl.add(put(boxL, 0, 3.4, 0));
    const colors = [0xff4d3d, 0xf2c144, 0x5ad06a];
    colors.forEach((col, i) => {
      const l = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.12, 0),
        new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.35, flatShading: true })
      );
      l.position.set(0, 3.78 - i * 0.36, 0.19);
      tl.add(l);
      lights.push(l);
    });
    tl.position.set(x, 0, z);
    tl.rotation.y = ry;
    g.add(tl);
  }
  store.trafficLights = lights;
  return g;
}

/* деловой квартал: два офисных здания */
export function buildOffices(store) {
  const g = new THREE.Group();
  const a = highrise({ floors: 7, w: 3.4, d: 3.0, color: 0xdfe3e6, glass: 0x6fa8c8 });
  a.position.set(0, 0, 0);
  const b = highrise({ floors: 5, w: 2.6, d: 2.6, color: 0xc7bfae, glass: 0x8fbfa8 });
  b.position.set(3.8, 0, 1.4);
  b.rotation.y = 0.3;
  g.add(a, b);
  store.beacons = [...(store.beacons || []), a.userData.beacon, b.userData.beacon];
  // входная группа
  g.add(put(box(2.2, 0.2, 1.4, CONCRETE), 0, 0.1, 2.1));
  g.add(put(box(1.6, 1.4, 0.12, 0x8fd0e6, { transparent: true, opacity: 0.7 }), 0, 0.7, 1.52));
  return g;
}

/* небоскрёб со ступенчатым силуэтом */
export function buildSkyscraper(store) {
  const g = new THREE.Group();
  const t = highrise({ floors: 15, w: 3.8, d: 3.8, color: 0xb9c6cf, glass: 0x5f9ec4, setback: 0.22 });
  g.add(t);
  store.beacons = [...(store.beacons || []), t.userData.beacon];
  // подиум
  g.add(put(box(5.2, 0.9, 5.2, 0xa8b0b6), 0, 0.45, 0));
  g.add(put(box(5.4, 0.16, 5.4, CONCRETE), 0, 0.95, 0));
  return g;
}

/* торговый центр */
export function buildMall() {
  const g = new THREE.Group();
  const body = box(6.4, 3.2, 4.6, 0xe3dcd0);
  g.add(put(body, 0, 1.6, 0));
  g.add(put(box(6.7, 0.3, 4.9, 0xb0a695), 0, 3.35, 0));
  // стеклянный атриум
  const atrium = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 1.6, 12),
    mat(0x9fd7e6, { transparent: true, opacity: 0.5, flatShading: false })
  );
  g.add(put(atrium, 0, 4.0, 0));
  g.add(put(cone(1.65, 0.8, 12, 0x5d7f8e), 0, 5.2, 0));
  // витрины по фасаду
  for (let i = -2; i <= 2; i++) {
    g.add(put(box(1.0, 1.6, 0.12, 0x8fd0e6, { transparent: true, opacity: 0.65 }), i * 1.2, 1.2, 2.36));
  }
  // вывеска
  g.add(put(box(3.4, 0.6, 0.14, 0xd94f4f), 0, 3.0, 2.4));
  // тележки
  for (const [x, z] of [[3.6, 2.6], [4.1, 2.9]]) {
    g.add(put(box(0.4, 0.35, 0.55, 0xb9bcc0), x, 0.3, z));
  }
  return g;
}

/* городской фонтан */
export function buildCityFountain(store) {
  const g = new THREE.Group();
  const plaza = cyl(3.4, 3.4, 0.16, 20, 0xd9d3c6);
  g.add(put(plaza, 0, 0.12, 0));
  const basin = cyl(2.2, 2.3, 0.7, 18, CONCRETE);
  g.add(put(basin, 0, 0.45, 0));
  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(2.0, 2.0, 0.5, 18),
    mat(C.water, { roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.85, flatShading: false })
  );
  g.add(put(water, 0, 0.55, 0));
  store.pondWater = water;
  // ярусы
  g.add(put(cyl(0.35, 0.5, 1.0, 10, CONCRETE), 0, 1.2, 0));
  g.add(put(cyl(1.0, 1.0, 0.16, 14, CONCRETE), 0, 1.75, 0));
  g.add(put(cyl(0.22, 0.3, 0.8, 8, CONCRETE), 0, 2.2, 0));
  g.add(put(sph(0.3, 0xc9d6dc), 0, 2.75, 0));
  // струи
  const jets = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const jet = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.02, 1.2, 6),
      mat(0xbfe6ef, { transparent: true, opacity: 0.65, flatShading: false })
    );
    jet.position.set(Math.cos(a) * 0.75, 2.2, Math.sin(a) * 0.75);
    jet.rotation.z = -Math.cos(a) * 0.4;
    jet.rotation.x = Math.sin(a) * 0.4;
    g.add(jet);
    jets.push(jet);
  }
  store.fountainJets = jets;
  return g;
}

/* парковка с машинами */
export function buildParking() {
  const g = new THREE.Group();
  const lot = box(6.5, 0.2, 5.0, ASPHALT_LIGHT);
  g.add(put(lot, 0, 0.14, 0));
  for (let i = -2; i <= 2; i++) {
    g.add(put(box(0.1, 0.05, 4.2, 0xf0e6cf), i * 1.25, 0.26, 0));
  }
  const carColors = [0xd94f4f, 0x4f7f9e, 0xf2c144, 0x6aa85a];
  [[-1.85, -0.6], [-0.6, 0.4], [1.85, -0.5]].forEach(([x, z], i) => {
    const car = new THREE.Group();
    car.add(put(box(1.0, 0.5, 2.2, carColors[i % 4]), 0, 0.5, 0));
    car.add(put(box(0.85, 0.45, 1.1, 0xd8e4ea, { transparent: true, opacity: 0.8 }), 0, 0.95, -0.1));
    for (const [wx, wz] of [[-0.5, 0.7], [0.5, 0.7], [-0.5, -0.7], [0.5, -0.7]]) {
      const wheel = cyl(0.22, 0.22, 0.16, 8, 0x33373a);
      wheel.rotation.z = Math.PI / 2;
      car.add(put(wheel, wx, 0.24, wz));
    }
    car.position.set(x, 0.2, z);
    g.add(car);
  });
  return g;
}

/* рекламный билборд */
export function buildBillboard(store) {
  const g = new THREE.Group();
  for (const x of [-1.4, 1.4]) g.add(put(cyl(0.14, 0.18, 3.4, 8, 0x6b7075), x, 1.7, 0));
  const panel = box(4.4, 2.4, 0.2, 0xf6ead6);
  g.add(put(panel, 0, 4.4, 0));
  const face = new THREE.Mesh(
    new THREE.BoxGeometry(4.0, 2.0, 0.08),
    new THREE.MeshStandardMaterial({ color: 0xd0703f, emissive: 0xd0703f, emissiveIntensity: 0.5, flatShading: true })
  );
  face.position.set(0, 4.4, 0.16);
  g.add(face);
  store.billboardFace = face;
  // полосы «текста»
  for (let i = 0; i < 3; i++) {
    g.add(put(box(2.6 - i * 0.5, 0.22, 0.05, 0xf6ead6), -0.3 + i * 0.15, 4.9 - i * 0.55, 0.22));
  }
  // подсветка
  for (const x of [-1.2, 1.2]) {
    g.add(put(box(0.4, 0.16, 0.5, 0x55595e), x, 3.1, 0.4));
    const l = new THREE.PointLight(0xffd9a0, 0.4, 5);
    l.position.set(x, 3.3, 0.6);
    g.add(l);
  }
  return g;
}

/* вход в метро */
export function buildMetro() {
  const g = new THREE.Group();
  const base = box(3.0, 0.35, 2.4, CONCRETE);
  g.add(put(base, 0, 0.2, 0));
  // лестничный проём
  const hole = box(1.8, 0.3, 1.6, 0x3a3f43);
  g.add(put(hole, 0, 0.25, 0.2));
  for (let i = 0; i < 4; i++) {
    g.add(put(box(1.7, 0.1, 0.3, 0x9aa2a8), 0, 0.28 - i * 0.05, 0.75 - i * 0.32));
  }
  // перила
  for (const x of [-0.95, 0.95]) {
    g.add(put(box(0.08, 0.9, 2.0, 0x8d949a), x, 0.75, 0.1));
  }
  // навес
  for (const x of [-1.2, 1.2]) g.add(put(cyl(0.09, 0.09, 2.4, 6, 0x6b7075), x, 1.2, -1.0));
  const canopy = box(3.2, 0.16, 1.4, 0x4f7f9e);
  g.add(put(canopy, 0, 2.4, -0.6));
  // буква-указатель
  const sign = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 0.14, 12),
    new THREE.MeshStandardMaterial({ color: 0xd94f4f, emissive: 0xd94f4f, emissiveIntensity: 0.6, flatShading: true })
  );
  sign.rotation.x = Math.PI / 2;
  g.add(put(sign, 0, 3.1, -0.6));
  g.add(put(cyl(0.1, 0.1, 1.4, 6, 0x6b7075), 0, 2.75, -0.6));
  return g;
}
