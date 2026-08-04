import * as THREE from "three";
import { C, box, cone, cyl, mat, put, sph } from "../../core/geometry";


/* ============================================================
   ПОСТРОЙКИ: АЭРОПОРТ
   ============================================================ */

/* взлётная полоса с разметкой и огнями */
export function runway(store) {
  const g = new THREE.Group();
  const strip = box(6.2, 0.24, 26, 0x4a4f55);
  g.add(put(strip, 0, 0.16, 0));
  // осевая пунктирная разметка
  for (let z = -11.5; z <= 11.5; z += 2.6) {
    g.add(put(box(0.3, 0.06, 1.5, 0xf2ede0), 0, 0.29, z));
  }
  // боковые линии
  for (const x of [-2.7, 2.7]) g.add(put(box(0.2, 0.06, 26, 0xf2ede0), x, 0.29, 0));
  // пороговые полосы
  for (const zz of [-12.2, 12.2]) {
    for (let i = -3; i <= 3; i++) {
      g.add(put(box(0.34, 0.06, 2.2, 0xf2ede0), i * 0.7, 0.29, zz));
    }
  }
  // рулёжки по бокам
  for (const x of [-4.6, 4.6]) g.add(put(box(2.2, 0.22, 22, 0x585d63), x, 0.15, 0));

  // посадочные огни
  const lights = [];
  for (let z = -12; z <= 12; z += 3) {
    for (const x of [-3.3, 3.3]) {
      const l = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.13, 0),
        new THREE.MeshStandardMaterial({
          color: 0xfff0c0, emissive: z > 10 ? 0x40ff70 : 0xffb545,
          emissiveIntensity: 1.1, flatShading: true,
        })
      );
      l.position.set(x, 0.34, z);
      g.add(l);
      lights.push(l);
    }
  }
  store.runwayLights = lights;
  return g;
}

/* терминал со стеклянным фасадом */
export function terminal() {
  const g = new THREE.Group();
  g.add(put(box(8.0, 3.2, 3.6, 0xe8e4da), 0, 1.6, 0));
  // волнистая крыша
  for (let i = -3; i <= 3; i++) {
    const seg = cyl(0.55, 0.55, 3.9, 12, 0xb8bec4, {});
    seg.rotation.x = Math.PI / 2;
    g.add(put(seg, i * 1.15, 3.4, 0));
  }
  // сплошное остекление
  for (let i = -3; i <= 3; i++) {
    g.add(put(box(1.0, 2.2, 0.12, 0x9fd0e6, { transparent: true, opacity: 0.6, emissive: 0x2a5a70, emissiveIntensity: 0.3 }), i * 1.12, 1.5, 1.83));
  }
  // вход
  g.add(put(box(1.8, 1.9, 0.16, 0x6fa8c8, { transparent: true, opacity: 0.75 }), 0, 0.95, 1.9));
  const canopy = box(3.2, 0.18, 1.4, 0xb8bec4);
  g.add(put(canopy, 0, 2.5, 2.4));
  for (const x of [-1.3, 1.3]) g.add(put(cyl(0.1, 0.1, 2.4, 8, 0xb8bec4), x, 1.2, 2.9));
  // башенка указателя
  g.add(put(cyl(0.14, 0.14, 3.0, 8, 0xd6cdbb), 4.4, 1.5, 1.6));
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.6, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x2f6fa8, emissive: 0x2f6fa8, emissiveIntensity: 0.6, flatShading: true })
  );
  sign.position.set(4.4, 3.2, 1.6);
  g.add(sign);
  return g;
}

/* диспетчерская вышка */
export function controlTower(store) {
  const g = new THREE.Group();
  g.add(put(cyl(0.85, 1.25, 6.5, 10, 0xe4e0d6), 0, 3.25, 0));
  // рёбра
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.add(put(box(0.12, 6.4, 0.12, 0xc4bfb2), Math.cos(a) * 1.0, 3.25, Math.sin(a) * 1.0));
  }
  // площадка и стеклянная кабина с наклоном
  g.add(put(cyl(1.9, 1.9, 0.24, 12, 0xb8bec4), 0, 6.7, 0));
  const cabin = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.75, 1.5, 12),
    mat(0x8fd0e6, { transparent: true, opacity: 0.62, emissive: 0x2a5a70, emissiveIntensity: 0.4, flatShading: false })
  );
  g.add(put(cabin, 0, 7.6, 0));
  g.add(put(cyl(1.6, 1.6, 0.22, 12, 0x6b7075), 0, 8.45, 0));
  // антенна с маяком
  g.add(put(cyl(0.07, 0.07, 1.6, 6, 0x8d949a), 0, 9.3, 0));
  const beacon = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.18, 0),
    new THREE.MeshStandardMaterial({ color: 0xff6b5a, emissive: 0xff3b2f, emissiveIntensity: 1.5, flatShading: true })
  );
  beacon.position.set(0, 10.2, 0);
  g.add(beacon);
  store.beacons = [...(store.beacons || []), beacon];
  return g;
}

/* ангар с арочной крышей */
export function hangar() {
  const g = new THREE.Group();
  const arch = new THREE.Mesh(
    new THREE.CylinderGeometry(3.0, 3.0, 5.6, 14, 1, false, 0, Math.PI),
    mat(0xb0b6bb)
  );
  arch.rotation.z = Math.PI / 2;
  arch.rotation.y = Math.PI / 2;
  arch.castShadow = true;
  g.add(put(arch, 0, 0.1, 0));
  // задняя стенка
  const back = new THREE.Mesh(
    new THREE.CircleGeometry(3.0, 14, 0, Math.PI),
    mat(0xc9cdd2, { side: THREE.DoubleSide })
  );
  g.add(put(back, 0, 0.1, -2.8));
  // ворота
  for (const s of [-1, 1]) {
    g.add(put(box(1.45, 2.6, 0.16, 0x8d949a), s * 0.76, 1.3, 2.8));
  }
  g.add(put(box(3.1, 0.2, 0.2, 0xd94f4f), 0, 2.75, 2.85));
  // рёбра арки
  for (const z of [-2.7, 0, 2.7]) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(3.02, 0.09, 6, 14, Math.PI), mat(0x8d949a));
    g.add(put(rib, 0, 0.1, z));
  }
  return g;
}

/* самолёт */
function airplane(color = 0xf4f2ec) {
  const g = new THREE.Group();
  // фюзеляж
  const body = cyl(0.55, 0.62, 6.0, 12, color);
  body.rotation.x = Math.PI / 2;
  g.add(put(body, 0, 1.5, 0));
  const nose = cone(0.55, 1.1, 12, color);
  nose.rotation.x = Math.PI / 2;
  g.add(put(nose, 0, 1.5, 3.4));
  const tailCone = cone(0.5, 1.2, 12, color);
  tailCone.rotation.x = -Math.PI / 2;
  g.add(put(tailCone, 0, 1.7, -3.4));
  // крылья
  for (const s of [-1, 1]) {
    const wing = box(3.6, 0.14, 1.3, color);
    wing.rotation.y = s * 0.22;
    g.add(put(wing, s * 2.0, 1.35, -0.2));
    const eng = cyl(0.32, 0.32, 0.9, 10, 0x8d949a);
    eng.rotation.x = Math.PI / 2;
    g.add(put(eng, s * 1.9, 1.05, 0.3));
  }
  // хвост
  const fin = box(0.14, 1.7, 1.3, 0x2f6fa8);
  g.add(put(fin, 0, 2.6, -3.0));
  for (const s of [-1, 1]) {
    const stab = box(1.3, 0.1, 0.6, color);
    g.add(put(stab, s * 0.7, 1.95, -3.2));
  }
  // иллюминаторы
  for (let i = -4; i <= 4; i++) {
    g.add(put(sph(0.09, 0x6fa8c8, { emissive: 0x2a5a70, emissiveIntensity: 0.4 }), 0.5, 1.62, i * 0.6));
  }
  // шасси
  for (const [x, z] of [[0, 2.4], [-0.8, -0.6], [0.8, -0.6]]) {
    g.add(put(cyl(0.07, 0.07, 0.9, 6, 0x55595e), x, 0.55, z));
    const wheel = cyl(0.24, 0.24, 0.16, 8, 0x2e3236);
    wheel.rotation.z = Math.PI / 2;
    g.add(put(wheel, x, 0.24, z));
  }
  return g;
}

export function parkedPlanes(store) {
  const g = new THREE.Group();
  const a = airplane(0xf4f2ec);
  a.position.set(0, 0, 0);
  a.rotation.y = 0.35;
  const b = airplane(0xe8dcc8);
  b.scale.setScalar(0.72);
  b.position.set(5.2, 0, -1.6);
  b.rotation.y = -0.5;
  g.add(a, b);
  return g;
}

/* радар с вращающейся антенной */
export function radar(store) {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2 + 0.78;
    const leg = box(0.16, 3.4, 0.16, 0x8d949a);
    leg.position.set(Math.cos(ang) * 0.85, 1.7, Math.sin(ang) * 0.85);
    leg.rotation.x = Math.sin(ang) * 0.14;
    leg.rotation.z = -Math.cos(ang) * 0.14;
    g.add(leg);
  }
  g.add(put(box(1.9, 0.18, 1.9, 0x8d949a), 0, 3.45, 0));
  const dish = new THREE.Group();
  const plate = new THREE.Mesh(
    new THREE.SphereGeometry(1.3, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2.6),
    mat(0xdfe3e6, { side: THREE.DoubleSide })
  );
  plate.rotation.x = -1.1;
  dish.add(put(plate, 0, 0.9, 0));
  dish.add(put(cyl(0.09, 0.09, 1.0, 6, 0x8d949a), 0, 0.6, 0.5));
  dish.position.set(0, 3.6, 0);
  g.add(dish);
  store.radarDish = dish;
  return g;
}

/* топливозаправщик */
export function fuelTruck() {
  const g = new THREE.Group();
  const tank = cyl(0.75, 0.75, 3.0, 12, 0xe8b23c);
  tank.rotation.x = Math.PI / 2;
  g.add(put(tank, 0, 1.0, -0.4));
  g.add(put(cyl(0.78, 0.78, 0.1, 12, 0xc99a2c), 0, 1.0, 1.05));
  // кабина
  g.add(put(box(1.5, 1.1, 1.2, 0xdfe3e6), 0, 0.85, 2.0));
  g.add(put(box(1.3, 0.55, 0.1, 0xcfe4ec, { transparent: true, opacity: 0.75 }), 0, 1.15, 2.58));
  // колёса
  for (const [wx, wz] of [[-0.72, 1.6], [0.72, 1.6], [-0.72, -0.6], [0.72, -0.6], [-0.72, -1.5], [0.72, -1.5]]) {
    const pv = new THREE.Group();
    pv.position.set(wx, 0.32, wz);
    pv.rotation.z = Math.PI / 2;
    pv.add(cyl(0.32, 0.32, 0.2, 8, 0x2e3236));
    g.add(pv);
  }
  // шланг и маячок
  g.add(put(cyl(0.06, 0.06, 1.2, 6, 0x44484c), 0.85, 0.7, -1.4));
  const bl = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.14, 0),
    new THREE.MeshStandardMaterial({ color: 0xffb545, emissive: 0xff8a20, emissiveIntensity: 1.2, flatShading: true })
  );
  bl.position.set(0, 1.5, 2.0);
  g.add(bl);
  return g;
}

/* багажная зона */
export function baggage() {
  const g = new THREE.Group();
  // лента
  g.add(put(box(4.4, 0.5, 1.3, 0x55595e), 0, 0.45, 0));
  g.add(put(box(4.2, 0.12, 1.1, 0x33373a), 0, 0.74, 0));
  for (let i = -3; i <= 3; i++) g.add(put(box(0.1, 0.14, 1.1, 0x6b7075), i * 0.6, 0.8, 0));
  // чемоданы
  const cols = [0xd94f4f, 0x4f7f9e, 0x6aa85a, 0xc9a05a];
  [[-1.4, 0], [0.2, 0.1], [1.5, -0.1]].forEach(([x, z], i) => {
    g.add(put(box(0.65, 0.45, 0.4, cols[i % 4]), x, 1.05, z));
    g.add(put(box(0.12, 0.14, 0.06, 0x33373a), x, 1.32, z));
  });
  // тележки
  for (const [x, z] of [[-2.8, 1.8], [2.6, 1.9]]) {
    g.add(put(box(1.5, 0.16, 0.9, 0x8d949a), x, 0.5, z));
    for (const [wx, wz] of [[-0.6, 0.35], [0.6, 0.35], [-0.6, -0.35], [0.6, -0.35]]) {
      g.add(put(cyl(0.16, 0.16, 0.1, 8, 0x2e3236), x + wx, 0.16, z + wz));
    }
    g.add(put(box(0.6, 0.4, 0.5, cols[(x > 0 ? 1 : 2)]), x, 0.78, z));
  }
  return g;
}

/* ============================================================
   ПОСТРОЙКИ: ПУСТЫНЯ
   ============================================================ */

const CLAY = 0xf0b878;
const CLAY_DARK = 0xc9853f;

/* глинобитный дом с плоской крышей */
export function adobe(o = {}) {
  const { w = 3.0, d = 2.8, floors = 1, color = CLAY } = o;
  const g = new THREE.Group();
  const H = floors * 1.9;
  g.add(put(box(w, H, d, color), 0, H / 2, 0));
  // парапет
  g.add(put(box(w + 0.2, 0.32, d + 0.2, CLAY_DARK), 0, H + 0.16, 0));
  for (const s of [-1, 1]) {
    g.add(put(box(0.22, 0.5, 0.22, CLAY_DARK), s * (w / 2 - 0.1), H + 0.4, d / 2 - 0.1));
    g.add(put(box(0.22, 0.5, 0.22, CLAY_DARK), s * (w / 2 - 0.1), H + 0.4, -d / 2 + 0.1));
  }
  // торчащие балки
  for (let i = -1; i <= 1; i++) {
    const beam291 = cyl(0.09, 0.09, d + 0.9, 6, 0x8a6a4a);
    beam291.rotation.x = Math.PI / 2;
    g.add(put(beam291, i * (w / 3), H - 0.25, 0));
  }
  // маленькие окна и арочная дверь
  for (let f = 0; f < floors; f++) {
    for (const x of [-w / 4, w / 4]) {
      g.add(put(box(0.42, 0.5, 0.1, 0x5a4632), x, f * 1.9 + 1.2, d / 2 + 0.03));
    }
  }
  g.add(put(box(0.75, 1.35, 0.12, 0x6b4a34), 0, 0.68, d / 2 + 0.04));
  const arch300 = cyl(0.38, 0.38, 0.12, 10, 0x6b4a34);
  arch300.rotation.x = Math.PI / 2;
  g.add(put(arch300, 0, 1.35, d / 2 + 0.04));
  // наружная лестница
  for (let i = 0; i < 4; i++) {
    g.add(put(box(0.7, 0.18, 0.5, CLAY_DARK), w / 2 + 0.35, 0.2 + i * 0.45, -d / 2 + 0.4 + i * 0.42));
  }
  // навес из ткани
  const cloth = box(1.6, 0.08, 1.2, 0xc26a4a);
  cloth.rotation.x = -0.12;
  g.add(put(cloth, 0, H * 0.62, d / 2 + 0.7));
  for (const s of [-1, 1]) g.add(put(cyl(0.06, 0.06, 1.5, 5, 0x8a6a4a), s * 0.7, H * 0.4, d / 2 + 1.2));
  return g;
}

/* караван-сарай с аркадой */
export function caravanserai() {
  const g = new THREE.Group();
  g.add(put(box(6.4, 3.0, 4.0, CLAY), 0, 1.5, 0));
  g.add(put(box(6.7, 0.36, 4.3, CLAY_DARK), 0, 3.18, 0));
  // зубчатый парапет
  for (let i = -4; i <= 4; i++) {
    g.add(put(box(0.34, 0.42, 0.34, CLAY_DARK), i * 0.72, 3.55, 2.0));
  }
  // арочный вход
  g.add(put(box(2.0, 2.2, 0.3, 0x8a6a4a), 0, 1.1, 2.05));
  const archTop = cyl(1.0, 1.0, 0.3, 12, 0x8a6a4a, {});
  archTop.rotation.x = Math.PI / 2;
  g.add(put(archTop, 0, 2.2, 2.05));
  // боковые арки
  for (const s of [-1, 1]) {
    for (const off of [1.6, 2.7]) {
      g.add(put(box(0.7, 1.4, 0.16, 0x7a5a3c), s * off, 0.9, 2.06));
      const a = cyl(0.35, 0.35, 0.16, 10, 0x7a5a3c);
      a.rotation.x = Math.PI / 2;
      g.add(put(a, s * off, 1.6, 2.06));
    }
  }
  // купола
  for (const s of [-1, 1]) {
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1.0, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xc26a4a));
    dome.castShadow = true;
    g.add(put(dome, s * 2.1, 3.36, 0));
    g.add(put(sph(0.16, C.gold), s * 2.1, 4.45, 0));
  }
  // флажки
  for (const s of [-1, 1]) {
    g.add(put(cyl(0.05, 0.05, 1.2, 5, 0x8a6a4a), s * 3.1, 4.0, 1.9));
    g.add(put(box(0.5, 0.3, 0.04, 0x5a8f6a), s * 3.35, 4.45, 1.9));
  }
  return g;
}

/* бедуинский шатёр */
export function tent() {
  const g = new THREE.Group();
  // полотнище на растяжках
  for (const s of [-1, 1]) {
    const panel = box(3.4, 0.1, 2.6, 0xb5735a);
    panel.rotation.z = s * 0.42;
    g.add(put(panel, s * 1.35, 1.7, 0));
  }
  g.add(put(box(0.14, 0.14, 2.8, 0x6b4a34), 0, 2.35, 0));
  for (const s of [-1, 1]) {
    g.add(put(cyl(0.09, 0.09, 2.4, 6, 0x6b4a34), 0, 1.2, s * 1.3));
    // растяжки
    const rope = cyl(0.03, 0.03, 2.2, 4, 0x8a7a5a);
    rope.rotation.z = s * 0.9;
    g.add(put(rope, s * 2.6, 0.9, 0));
    g.add(put(box(0.1, 0.3, 0.1, 0x6b4a34), s * 3.3, 0.15, 0));
  }
  // задняя стенка и ковры
  g.add(put(box(3.2, 1.4, 0.1, 0x9a5f4a), 0, 0.7, -1.3));
  g.add(put(box(2.4, 0.06, 1.8, 0xc2704a), 0, 0.05, 0.4));
  g.add(put(box(1.6, 0.06, 1.2, 0xa8523c), 0.4, 0.09, 0.6));
  // подушки и утварь
  for (const [x, z] of [[-0.7, 0.2], [0.6, 0.5], [0.0, -0.5]]) {
    const p = box(0.5, 0.22, 0.4, [0xe0a84a, 0x8f5aa8, 0x5a8f9e][Math.abs(Math.round(x * 3)) % 3]);
    g.add(put(p, x, 0.2, z));
  }
  g.add(put(cyl(0.28, 0.34, 0.4, 9, 0x8a6a4a), 1.2, 0.2, -0.6));
  // костровище
  g.add(put(cyl(0.5, 0.55, 0.14, 9, 0x8d949a), 2.4, 0.08, 1.4));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    g.add(put(sph(0.13, C.stone), 2.4 + Math.cos(a) * 0.5, 0.14, 1.4 + Math.sin(a) * 0.5));
  }
  const fire = new THREE.Mesh(
    new THREE.ConeGeometry(0.26, 0.6, 6),
    new THREE.MeshStandardMaterial({ color: 0xff9a3c, emissive: 0xff6a20, emissiveIntensity: 1.3, flatShading: true })
  );
  fire.position.set(2.4, 0.4, 1.4);
  g.add(fire);
  const fl = new THREE.PointLight(0xff8a3c, 0.6, 6);
  fl.position.set(2.4, 0.7, 1.4);
  g.add(fl);
  return g;
}

/* верблюды */
export function camels() {
  const g = new THREE.Group();
  [[0, 0, 0], [2.2, 1.0, 0.6], [-1.8, 1.2, -0.4]].forEach(([x, z, rot], i) => {
    const c = new THREE.Group();
    const body = sph(0.85, 0xc9a06a);
    body.scale.set(1.5, 0.9, 0.85);
    c.add(put(body, 0, 1.35, 0));
    // горбы
    c.add(put(sph(0.42, 0xb8905c), -0.25, 1.95, 0));
    c.add(put(sph(0.36, 0xb8905c), 0.35, 1.9, 0));
    // шея и голова
    const neck = cyl(0.2, 0.28, 1.2, 7, 0xc9a06a);
    neck.rotation.z = -0.5;
    c.add(put(neck, 1.15, 1.85, 0));
    const head = sph(0.3, 0xc9a06a);
    head.scale.set(1.3, 0.9, 0.9);
    c.add(put(head, 1.7, 2.35, 0));
    c.add(put(sph(0.07, 0x33373a), 1.85, 2.45, 0.18));
    c.add(put(sph(0.07, 0x33373a), 1.85, 2.45, -0.18));
    // ноги
    for (const [lx, lz] of [[-0.7, 0.35], [0.7, 0.35], [-0.7, -0.35], [0.7, -0.35]]) {
      c.add(put(cyl(0.11, 0.14, 1.35, 6, 0xb8905c), lx, 0.68, lz));
    }
    // хвост и попона
    c.add(put(cyl(0.06, 0.06, 0.6, 5, 0xb8905c), -1.25, 1.35, 0));
    c.add(put(box(0.9, 0.1, 0.9, 0xc2704a), -0.1, 1.85, 0));
    c.position.set(x, 0, z);
    c.rotation.y = rot;
    c.scale.setScalar(0.85);
    g.add(c);
  });
  return g;
}

/* сторожевая башня */
export function watchtower() {
  const g = new THREE.Group();
  g.add(put(box(2.2, 5.0, 2.2, CLAY), 0, 2.5, 0));
  g.add(put(box(2.5, 0.3, 2.5, CLAY_DARK), 0, 5.15, 0));
  // зубцы
  for (let i = -1; i <= 1; i++) {
    for (const s of [-1, 1]) {
      g.add(put(box(0.4, 0.5, 0.4, CLAY_DARK), i * 0.85, 5.5, s * 1.05));
      g.add(put(box(0.4, 0.5, 0.4, CLAY_DARK), s * 1.05, 5.5, i * 0.85));
    }
  }
  // бойницы
  for (const s of [-1, 1]) {
    for (const y of [2.0, 3.4]) {
      g.add(put(box(0.3, 0.6, 0.1, 0x5a4632), s * 0.5, y, 1.13));
      g.add(put(box(0.1, 0.6, 0.3, 0x5a4632), 1.13, y, s * 0.5));
    }
  }
  g.add(put(box(0.8, 1.4, 0.12, 0x6b4a34), 0, 0.7, 1.13));
  // флаг
  g.add(put(cyl(0.06, 0.06, 1.6, 5, 0x8a6a4a), 0, 6.3, 0));
  g.add(put(box(0.7, 0.45, 0.04, 0xc2704a), 0.38, 6.85, 0));
  return g;
}

/* ============================================================
   ПОСТРОЙКИ: ПАРК АТТРАКЦИОНОВ
   ============================================================ */

/* колесо обозрения */
export function ferrisWheel(store) {
  const g = new THREE.Group();
  const R = 4.2;
  // опоры
  for (const s of [-1, 1]) {
    for (const zz of [-1.1, 1.1]) {
      const leg = box(0.24, 5.4, 0.24, 0xb8bec4);
      leg.rotation.z = s * 0.22;
      g.add(put(leg, s * 1.3, 2.7, zz));
    }
  }
  g.add(put(box(3.4, 0.24, 0.24, 0xb8bec4), 0, 5.2, 0));

  const wheel = new THREE.Group();
  // обода
  for (const zz of [-0.75, 0.75]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.11, 6, 28), mat(0xe8e2d6));
    g.add(rim);
    rim.position.z = zz;
    wheel.add(rim);
  }
  const hub = cyl(0.3, 0.3, 1.8, 10, 0x8d949a);
  hub.rotation.x = Math.PI / 2;
  wheel.add(put(hub, 0, 0, 0));
  // спицы и кабинки
  const cabColors = [0xd94f4f, 0xf2c144, 0x5aa85a, 0x4f8fc4, 0xa96bd4, 0xe8746a];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const spoke = box(R * 2, 0.07, 0.07, 0xd6cdbb);
    spoke.rotation.z = a;
    wheel.add(spoke);
    // кабинка на шарнире — всегда висит вертикально
    const cab = new THREE.Group();
    const body = box(0.85, 0.75, 1.0, cabColors[i % cabColors.length]);
    cab.add(put(body, 0, -0.4, 0));
    cab.add(put(box(0.95, 0.12, 1.1, 0xfaf3e4), 0, -0.05, 0));
    cab.add(put(cyl(0.05, 0.05, 0.3, 5, 0x8d949a), 0, 0.1, 0));
    cab.position.set(Math.cos(a) * R, Math.sin(a) * R, 0);
    cab.userData.pivot = true;
    wheel.add(cab);
  }
  g.add(wheel);
  store.ferris = wheel;
  // касса у подножия
  g.add(put(box(1.2, 1.1, 1.0, 0xe8746a), 3.4, 0.55, 1.4));
  g.add(put(cone(1.0, 0.5, 6, 0xfaf3e4), 3.4, 1.4, 1.4));
  return g;
}

/* карусель */
export function carousel(store) {
  const g = new THREE.Group();
  g.add(put(cyl(3.0, 3.2, 0.4, 16, 0xd6cdbb), 0, 0.2, 0));

  const spin = new THREE.Group();
  spin.add(put(cyl(2.8, 2.8, 0.22, 16, 0xf0e6d2), 0, 0.5, 0));
  spin.add(put(cyl(0.3, 0.3, 3.4, 10, 0xc9a05a), 0, 2.0, 0));
  // лошадки на шестах
  const horseCols = [0xfaf3e4, 0xe8b04a, 0xd94f4f, 0x8fb4d8, 0xa96bd4, 0x6aa85a];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const x = Math.cos(a) * 2.0, z = Math.sin(a) * 2.0;
    spin.add(put(cyl(0.06, 0.06, 2.6, 6, 0xc9a05a), x, 1.8, z));
    const h = new THREE.Group();
    const body = sph(0.42, horseCols[i]);
    body.scale.set(1.4, 0.85, 0.7);
    h.add(put(body, 0, 0, 0));
    const neck = cyl(0.14, 0.18, 0.6, 6, horseCols[i]);
    neck.rotation.z = -0.6;
    h.add(put(neck, 0.42, 0.3, 0));
    h.add(put(sph(0.17, horseCols[i]), 0.72, 0.52, 0));
    for (const [lx, lz] of [[-0.28, 0.18], [0.28, 0.18], [-0.28, -0.18], [0.28, -0.18]]) {
      h.add(put(box(0.1, 0.5, 0.1, horseCols[i]), lx, -0.35, lz));
    }
    h.position.set(x, 1.35, z);
    h.rotation.y = -a + Math.PI / 2;
    h.userData.bob = i;
    spin.add(h);
  }
  // купол в полоску
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const seg = new THREE.Mesh(
      new THREE.ConeGeometry(3.1, 1.3, 12, 1, false, a, Math.PI / 6),
      mat(i % 2 ? 0xd94f4f : 0xfaf3e4)
    );
    seg.castShadow = true;
    spin.add(put(seg, 0, 4.0, 0));
  }
  spin.add(put(sph(0.28, C.gold), 0, 4.8, 0));
  // лампочки по краю купола
  const bulbs = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const b = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.13, 0),
      new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffc46b, emissiveIntensity: 1.2, flatShading: true })
    );
    b.position.set(Math.cos(a) * 2.95, 3.45, Math.sin(a) * 2.95);
    spin.add(b);
    bulbs.push(b);
  }
  g.add(spin);
  store.carousel = spin;
  store.carouselBulbs = bulbs;
  return g;
}

/* американские горки */
export function rollerCoaster(store) {
  const g = new THREE.Group();
  const pts = [];
  const N = 40;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const r = 3.6 + Math.sin(a * 2) * 0.9;
    const y = 1.4 + Math.sin(a * 3) * 1.5 + Math.sin(a) * 0.8;
    pts.push(new THREE.Vector3(Math.cos(a) * r, Math.max(0.7, y), Math.sin(a) * r));
  }
  const curve = new THREE.CatmullRomCurve3(pts, true);
  store.coasterCurve = curve;

  // рельсы
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 90, 0.1, 6, true), mat(0xd94f4f));
  tube.castShadow = true;
  g.add(tube);
  const tube2 = new THREE.Mesh(new THREE.TubeGeometry(curve, 90, 0.06, 5, true), mat(0xf2ede0));
  tube2.position.y = -0.22;
  g.add(tube2);

  // опоры
  for (let i = 0; i < N; i += 3) {
    const p = pts[i];
    const h = p.y;
    g.add(put(box(0.11, h, 0.11, 0xb8bec4), p.x, h / 2, p.z));
    if (i % 6 === 0) {
      const brace = box(0.08, 0.08, 1.2, 0xb8bec4);
      brace.rotation.y = Math.atan2(p.z, p.x);
      g.add(put(brace, p.x * 0.9, h * 0.55, p.z * 0.9));
    }
  }

  // вагончики
  const train = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const car = new THREE.Group();
    car.add(put(box(0.6, 0.42, 0.85, [0xf2c144, 0x4f8fc4, 0x6aa85a][i]), 0, 0, 0));
    car.add(put(box(0.66, 0.14, 0.9, 0xfaf3e4), 0, 0.26, 0));
    car.position.z = -i * 0.95;
    train.add(car);
  }
  g.add(train);
  store.coasterTrain = train;
  return g;
}

/* билетная касса */
export function ticketBooth() {
  const g = new THREE.Group();
  g.add(put(cyl(1.05, 1.15, 1.9, 8, 0xfaf3e4), 0, 0.95, 0));
  // полосатая крыша
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const seg = new THREE.Mesh(
      new THREE.ConeGeometry(1.5, 0.9, 8, 1, false, a, Math.PI / 4),
      mat(i % 2 ? 0x4f8fc4 : 0xfaf3e4)
    );
    seg.castShadow = true;
    g.add(put(seg, 0, 2.3, 0));
  }
  g.add(put(sph(0.16, C.gold), 0, 2.85, 0));
  // окошко
  g.add(put(box(0.9, 0.7, 0.12, 0x8fd0e6, { transparent: true, opacity: 0.7 }), 0, 1.25, 1.05));
  g.add(put(box(1.0, 0.14, 0.16, 0xc9a05a), 0, 0.85, 1.1));
  // вывеска
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.45, 0.1),
    new THREE.MeshStandardMaterial({ color: 0xff5ac4, emissive: 0xff3fa4, emissiveIntensity: 0.9, flatShading: true })
  );
  sign.position.set(0, 1.85, 1.1);
  g.add(sign);
  // ограждение-очередь
  for (const s of [-1, 1]) {
    g.add(put(cyl(0.08, 0.1, 0.85, 8, 0xc9a05a), s * 1.5, 0.42, 1.9));
    g.add(put(sph(0.1, C.gold), s * 1.5, 0.9, 1.9));
  }
  g.add(put(box(2.9, 0.05, 0.05, 0x8a2a4a), 0, 0.82, 1.9));
  return g;
}

/* автодром */
export function bumperCars() {
  const g = new THREE.Group();
  g.add(put(box(6.0, 0.3, 4.4, 0x3a3f46), 0, 0.2, 0));
  g.add(put(box(5.6, 0.06, 4.0, 0x55606b), 0, 0.37, 0));
  // бортики
  for (const s of [-1, 1]) {
    g.add(put(box(6.2, 0.5, 0.28, 0xd94f4f), 0, 0.5, s * 2.2));
    g.add(put(box(0.28, 0.5, 4.6, 0x4f8fc4), s * 3.1, 0.5, 0));
  }
  // машинки
  const cols = [0xf2c144, 0x6aa85a, 0xa96bd4, 0xe8746a];
  [[-1.6, -0.8, 0.4], [0.9, 0.6, -1.1], [2.0, -1.2, 2.2]].forEach(([x, z, rot], i) => {
    const c = new THREE.Group();
    const body = sph(0.55, cols[i % 4]);
    body.scale.set(1.1, 0.5, 1.3);
    c.add(put(body, 0, 0.35, 0));
    c.add(put(cyl(0.62, 0.68, 0.18, 10, 0x33373a), 0, 0.2, 0));
    c.add(put(box(0.5, 0.35, 0.1, 0x2e3236), 0, 0.62, -0.35));
    c.add(put(cyl(0.05, 0.05, 1.3, 5, 0x8d949a), 0, 1.1, -0.2));
    c.add(put(sph(0.12, cols[i % 4]), 0, 1.75, -0.2));
    c.position.set(x, 0.37, z);
    c.rotation.y = rot;
    g.add(c);
  });
  // навес на столбах
  for (const [x, z] of [[-2.9, -2.0], [2.9, -2.0], [-2.9, 2.0], [2.9, 2.0]]) {
    g.add(put(cyl(0.11, 0.13, 2.8, 8, 0xb8bec4), x, 1.4, z));
  }
  g.add(put(box(6.4, 0.16, 4.8, 0xe8b04a), 0, 2.85, 0));
  return g;
}
