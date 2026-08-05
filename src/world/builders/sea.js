import * as THREE from "three";
import { mixHexNum } from "../../board/models";
import { box, cone, cyl, mat, put, sph } from "../../core/geometry";


/* ============================================================
   ПОСТРОЙКИ: ПОДВОДНЫЙ ГОРОД
   ============================================================ */

const CORAL_P = 0xe8749a;
const CORAL_O = 0xf2913c;
const DEEP_GLASS = 0x7fd8e8;

/* купольный дом под водой */
export function seaDome(store) {
  const g = new THREE.Group();
  // основание с иллюминаторами
  g.add(put(cyl(1.5, 1.7, 1.4, 14, 0xc4ccd4), 0, 0.7, 0));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const port = cyl(0.24, 0.24, 0.12, 12, DEEP_GLASS, {
      transparent: true, opacity: 0.75, emissive: 0x2a6a7a, emissiveIntensity: 0.5,
    });
    port.rotation.x = Math.PI / 2;
    port.rotation.z = -a;
    g.add(put(port, Math.cos(a) * 1.55, 0.8, Math.sin(a) * 1.55));
  }
  // стеклянный купол
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    mat(DEEP_GLASS, { transparent: true, opacity: 0.4, roughness: 0.05, metalness: 0.3, flatShading: false })
  );
  g.add(put(dome, 0, 1.4, 0));
  // рёбра купола
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI;
    const rib = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.05, 6, 20, Math.PI), mat(0x9aa2ac));
    rib.rotation.y = a;
    g.add(put(rib, 0, 1.4, 0));
  }
  g.add(put(cyl(1.65, 1.65, 0.12, 18, 0x8a92a0), 0, 1.4, 0));
  // шлюз
  g.add(put(cyl(0.42, 0.42, 0.9, 12, 0x8a92a0), 1.7, 0.5, 0)).rotation.z = Math.PI / 2;
  // пузырьки поднимаются
  const bubbles = [];
  for (let i = 0; i < 6; i++) {
    const b = sph(0.09 + Math.random() * 0.07, 0xdff5ff, { transparent: true, opacity: 0.55 });
    b.userData.y0 = Math.random() * 3;
    b.position.set(1.2 + Math.random() * 0.6, b.userData.y0, (Math.random() - 0.5) * 1.2);
    g.add(b);
    bubbles.push(b);
  }
  store.bubbles = [...(store.bubbles || []), ...bubbles];
  return g;
}

/* коралловый сад */
export function coralGarden(store) {
  const g = new THREE.Group();
  g.add(put(cyl(2.8, 2.9, 0.2, 18, 0xe0d4b4), 0, 0.1, 0));
  const waves = [];
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 2.3;
    const col = [CORAL_P, CORAL_O, 0xa87fd4, 0x5fd4c4][i % 4];
    const c = new THREE.Group();
    if (i % 3 === 0) {
      // ветвистый
      c.add(put(cyl(0.1, 0.14, 0.6, 7, col), 0, 0.3, 0));
      for (let k = 0; k < 4; k++) {
        const ang = (k / 4) * Math.PI * 2;
        const br = cyl(0.06, 0.08, 0.5, 6, col);
        br.rotation.z = Math.cos(ang) * 0.6;
        br.rotation.x = Math.sin(ang) * 0.6;
        c.add(put(br, Math.cos(ang) * 0.2, 0.75, Math.sin(ang) * 0.2));
      }
    } else if (i % 3 === 1) {
      // веер
      const fan = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 12, 8, 0, Math.PI, 0, Math.PI / 2),
        mat(col, { side: THREE.DoubleSide, flatShading: false })
      );
      fan.scale.set(1, 1.3, 0.14);
      c.add(put(fan, 0, 0.45, 0));
      c.add(put(cyl(0.07, 0.09, 0.3, 6, mixHexNum(col, 0x000000, 0.25)), 0, 0.15, 0));
    } else {
      // трубчатый
      for (let k = 0; k < 3; k++) {
        const h = 0.4 + Math.random() * 0.4;
        c.add(put(cyl(0.11, 0.13, h, 8, col), (k - 1) * 0.18, h / 2, 0));
      }
    }
    c.position.set(Math.cos(a) * r, 0.2, Math.sin(a) * r);
    g.add(c);
    waves.push(c);
  }
  store.corals = [...(store.corals || []), ...waves];
  return g;
}

/* затонувший корабль */
export function sunkenWreck() {
  const g = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 5.5), mat(0x5f7a6a));
  hull.rotation.z = 0.28;
  hull.rotation.x = -0.12;
  g.add(put(hull, 0, 0.9, 0));
  // сломанная мачта
  const mast = cyl(0.13, 0.16, 3.0, 8, 0x4a5f52);
  mast.rotation.z = 0.7;
  g.add(put(mast, -0.8, 2.0, 0.4));
  // водоросли на корпусе
  for (let i = 0; i < 7; i++) {
    const a = Math.random() * Math.PI * 2;
    const alg = box(0.1, 0.7, 0.05, 0x4a8f5a);
    alg.rotation.z = (Math.random() - 0.5) * 0.6;
    g.add(put(alg, Math.cos(a) * 0.9, 1.5, Math.sin(a) * 2.0));
  }
  // сундук рядом
  g.add(put(box(0.8, 0.5, 0.6, 0x6b4a2c), 1.7, 0.25, 1.6));
  g.add(put(box(0.85, 0.1, 0.65, 0xc9a23c), 1.7, 0.5, 1.6));
  return g;
}

/* маяк на дне */
export function seaBeacon(store) {
  const g = new THREE.Group();
  g.add(put(cyl(0.9, 1.1, 0.5, 12, 0x8a9298), 0, 0.25, 0));
  g.add(put(cyl(0.5, 0.7, 3.2, 12, 0xdfe4ea), 0, 2.1, 0));
  for (let i = 0; i < 3; i++) {
    g.add(put(cyl(0.62 - i * 0.05, 0.62 - i * 0.05, 0.2, 12, 0x4f8fc4), 0, 1.0 + i * 1.0, 0));
  }
  const lamp = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.4, 0),
    new THREE.MeshStandardMaterial({
      color: 0xaff0ff, emissive: 0x4fd4f0, emissiveIntensity: 1.4, flatShading: true,
    })
  );
  lamp.position.set(0, 4.0, 0);
  g.add(lamp);
  store.seaLamp = lamp;
  const l = new THREE.PointLight(0x4fd4f0, 0.9, 10);
  l.position.set(0, 4.0, 0);
  g.add(l);
  g.add(put(cone(0.6, 0.5, 12, 0x4f8fc4), 0, 4.4, 0));
  return g;
}

/* ============================================================
   ПОСТРОЙКИ: МУЗЫКАЛЬНЫЙ КВАРТАЛ
   ============================================================ */

const WOOD_WARM = 0xb5793c;

/* концертная ракушка */
export function bandShell(store) {
  const g = new THREE.Group();
  // сцена
  g.add(put(cyl(3.0, 3.2, 0.5, 16, 0x8a6a45), 0, 0.25, 0));
  g.add(put(cyl(2.8, 2.8, 0.1, 16, WOOD_WARM), 0, 0.53, 0));
  // раковина из дуг
  for (let i = 0; i < 5; i++) {
    const r = 2.9 - i * 0.28;
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.14, 8, 22, Math.PI),
      mat(i % 2 ? 0xf0e4cc : 0xd8c4a0)
    );
    arc.rotation.x = -Math.PI / 2;
    arc.rotation.z = Math.PI;
    g.add(put(arc, 0, 0.5 + i * 0.55, -0.4 - i * 0.1));
  }
  // задняя стенка
  const back = new THREE.Mesh(
    new THREE.SphereGeometry(3.0, 18, 10, 0, Math.PI, 0, Math.PI / 2),
    mat(0xe8dcc0, { side: THREE.DoubleSide, flatShading: false })
  );
  back.rotation.y = Math.PI;
  g.add(put(back, 0, 0.5, -0.6));
  // софиты
  const lights = [];
  for (let i = 0; i < 5; i++) {
    const lamp = sph(0.16, 0xfff0c0, { emissive: 0xffc46b, emissiveIntensity: 1.0 });
    lamp.position.set(-1.8 + i * 0.9, 2.6, 0.6);
    g.add(lamp);
    lights.push(lamp);
  }
  store.stageLights = [...(store.stageLights || []), ...lights];
  return g;
}

/* рояль под навесом */
export function streetPiano() {
  const g = new THREE.Group();
  // корпус в форме крыла
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.4, 1.3), mat(0x2a2622));
  g.add(put(body, 0, 0.85, 0));
  const wing = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.4, 14, 1, false, 0, Math.PI), mat(0x2a2622));
  g.add(put(wing, 0.5, 0.85, -0.3));
  // крышка приоткрыта
  const lid = box(1.9, 0.07, 1.3, 0x3a352e);
  lid.rotation.z = -0.32;
  g.add(put(lid, -0.15, 1.25, 0));
  g.add(put(cyl(0.03, 0.03, 0.6, 5, 0x8d949a), 0.5, 1.2, -0.4));
  // клавиши
  g.add(put(box(1.5, 0.1, 0.34, 0xf5f0e4), -0.1, 0.65, 0.72));
  for (let i = -6; i <= 6; i++) {
    if (i % 3 === 0) continue;
    g.add(put(box(0.06, 0.06, 0.2, 0x2a2622), -0.1 + i * 0.1, 0.72, 0.66));
  }
  // ножки
  for (const [x, z] of [[-0.75, 0.5], [0.75, 0.5], [0, -0.5]]) {
    g.add(put(cyl(0.08, 0.09, 0.65, 8, 0x2a2622), x, 0.33, z));
  }
  // банкетка
  g.add(put(box(0.8, 0.1, 0.4, WOOD_WARM), 0, 0.5, 1.5));
  for (const [x, z] of [[-0.3, 1.35], [0.3, 1.35], [-0.3, 1.65], [0.3, 1.65]]) {
    g.add(put(cyl(0.05, 0.05, 0.45, 6, 0x6b4a2c), x, 0.23, z));
  }
  return g;
}

/* лавка музыкальных инструментов */
export function musicShop() {
  const g = new THREE.Group();
  g.add(put(box(3.2, 2.4, 2.4, 0xd8c9a8), 0, 1.2, 0));
  // витрина с гитарами
  g.add(put(box(2.2, 1.2, 0.1, 0x9fd4e8, {
    transparent: true, opacity: 0.55, emissive: 0x3a6a7a, emissiveIntensity: 0.35,
  }), -0.3, 1.3, 1.22));
  for (let i = 0; i < 3; i++) {
    const gt = new THREE.Group();
    const bodyG = sph(0.22, [0xd94f4f, 0xe8a83c, 0x4f8fc4][i]);
    bodyG.scale.set(1, 1.15, 0.4);
    gt.add(put(bodyG, 0, 0, 0));
    gt.add(put(box(0.07, 0.6, 0.05, 0x6b4a2c), 0, 0.42, 0));
    gt.add(put(box(0.11, 0.14, 0.06, 0x3a352e), 0, 0.78, 0));
    gt.position.set(-0.95 + i * 0.65, 1.3, 1.16);
    g.add(gt);
  }
  g.add(put(box(0.9, 1.6, 0.12, 0x6b4a2c), 1.15, 0.8, 1.22));
  // вывеска-нота
  const note = new THREE.Group();
  note.add(put(sph(0.2, 0x2a2622), 0, 0, 0));
  note.add(put(box(0.06, 0.6, 0.06, 0x2a2622), 0.17, 0.32, 0));
  note.add(put(box(0.24, 0.1, 0.06, 0x2a2622), 0.28, 0.58, 0));
  note.position.set(1.8, 2.2, 0.9);
  g.add(note);
  // крыша
  for (const s of [-1, 1]) {
    const slope = box(2.2, 0.18, 2.6, 0x8a5f3a);
    slope.position.set(s * 0.9, 2.85, 0);
    slope.rotation.z = s * -0.48;
    g.add(slope);
  }
  return g;
}

/* карильон — башня с колоколами */
export function carillon(store) {
  const g = new THREE.Group();
  g.add(put(box(1.8, 4.0, 1.8, 0xc4b8a4), 0, 2.0, 0));
  for (const y of [1.2, 2.6]) g.add(put(box(2.0, 0.16, 2.0, 0xa89880), 0, y, 0));
  // арки звонницы
  g.add(put(box(1.9, 1.2, 0.14, 0x8a8278), 0, 3.5, 0.85));
  const arch = cyl(0.55, 0.55, 0.16, 14, 0x8a8278);
  arch.rotation.x = Math.PI / 2;
  g.add(put(arch, 0, 4.1, 0.85));
  // колокола
  const bells = [];
  [[-0.45, 0.4], [0.45, 0.34], [0, 0.28]].forEach(([x, r], i) => {
    const b = new THREE.Group();
    const bell = new THREE.Mesh(
      new THREE.CylinderGeometry(r * 0.55, r, r * 1.5, 12, 1, true),
      mat(0xc9a23c, { side: THREE.DoubleSide })
    );
    b.add(put(bell, 0, -r * 0.75, 0));
    b.add(put(cyl(r * 0.55, r * 0.55, 0.06, 12, 0xa8862c), 0, 0, 0));
    b.add(put(sph(r * 0.22, 0x8a6f26), 0, -r * 1.4, 0));
    b.position.set(x, 4.0, i === 2 ? -0.3 : 0.3);
    g.add(b);
    bells.push(b);
  });
  store.bells = [...(store.bells || []), ...bells];
  // крыша
  g.add(put(cone(1.5, 1.3, 4, 0x7a5a3a), 0, 5.2, 0)).rotation.y = Math.PI / 4;
  return g;
}

/* ============================================================
   ПОСТРОЙКИ: ГОНЧАРНАЯ СЛОБОДА
   ============================================================ */

const POT_CLAY = 0xc4703c;
const POT_CLAY_D = 0x94512a;

/* гончарный круг под навесом */
export function potteryWheel(store) {
  const g = new THREE.Group();
  // навес
  for (const [x, z] of [[-1.3, -1.1], [1.3, -1.1], [-1.3, 1.1], [1.3, 1.1]]) {
    g.add(put(cyl(0.1, 0.12, 2.2, 8, 0x8a6a45), x, 1.1, z));
  }
  for (const s of [-1, 1]) {
    const slope = box(1.8, 0.14, 2.6, 0xb08f5a);
    slope.position.set(s * 0.75, 2.45, 0);
    slope.rotation.z = s * -0.42;
    g.add(slope);
  }
  // станок
  g.add(put(cyl(0.42, 0.5, 0.7, 12, 0x6b4a2c), 0, 0.35, 0));
  const wheel = new THREE.Group();
  wheel.add(put(cyl(0.55, 0.55, 0.09, 16, 0x8a8278), 0, 0, 0));
  // заготовка на круге
  const pot = cyl(0.2, 0.3, 0.45, 12, POT_CLAY);
  wheel.add(put(pot, 0, 0.27, 0));
  wheel.position.y = 0.75;
  g.add(wheel);
  store.potWheel = wheel;
  // готовые изделия на полке
  g.add(put(box(2.4, 0.1, 0.5, 0x8a6a45), 0, 1.5, -1.0));
  for (let i = 0; i < 4; i++) {
    const h = 0.24 + Math.random() * 0.18;
    g.add(put(cyl(0.13, 0.16, h, 10, i % 2 ? POT_CLAY : POT_CLAY_D), -0.9 + i * 0.6, 1.55 + h / 2, -1.0));
  }
  return g;
}

/* обжиговая печь */
export function kiln(store) {
  const g = new THREE.Group();
  // купольная печь
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    mat(0xa8846a)
  );
  dome.scale.y = 1.15;
  dome.castShadow = true;
  g.add(put(dome, 0, 0.3, 0));
  g.add(put(cyl(1.6, 1.7, 0.5, 16, 0x8a6a52), 0, 0.25, 0));
  // кирпичная кладка поясами
  for (const y of [0.9, 1.4]) {
    g.add(put(cyl(1.4 - (y - 0.9) * 0.6, 1.4 - (y - 0.9) * 0.6, 0.12, 16, 0x94694f), 0, y, 0));
  }
  // топка с огнём
  g.add(put(box(0.8, 0.7, 0.2, 0x4a3a2c), 0, 0.6, 1.45));
  const fire = new THREE.Mesh(
    new THREE.ConeGeometry(0.3, 0.7, 7),
    new THREE.MeshStandardMaterial({
      color: 0xff9a3c, emissive: 0xff5a10, emissiveIntensity: 1.5, flatShading: true,
    })
  );
  fire.position.set(0, 0.6, 1.4);
  g.add(fire);
  store.forgeFire = [...(store.forgeFire || []), fire];
  const l = new THREE.PointLight(0xff7a2f, 0.8, 8);
  l.position.set(0, 0.9, 1.8);
  g.add(l);
  // труба
  g.add(put(cyl(0.28, 0.32, 1.2, 10, 0x8a6a52), 0, 2.3, 0));
  return g;
}

/* сушильные полки с горшками */
export function potteryRacks() {
  const g = new THREE.Group();
  for (const x of [-1.4, 1.4]) {
    g.add(put(box(0.14, 2.4, 0.14, 0x8a6a45), x, 1.2, -0.5));
    g.add(put(box(0.14, 2.4, 0.14, 0x8a6a45), x, 1.2, 0.5));
  }
  for (let i = 0; i < 4; i++) {
    const y = 0.5 + i * 0.55;
    g.add(put(box(3.0, 0.09, 1.2, 0xb08f5a), 0, y, 0));
    // изделия разных форм
    for (let k = 0; k < 5; k++) {
      const x = -1.15 + k * 0.58;
      const z = k % 2 ? 0.28 : -0.28;
      const kind = (i + k) % 3;
      if (kind === 0) {
        g.add(put(cyl(0.14, 0.19, 0.32, 10, POT_CLAY), x, y + 0.2, z));
      } else if (kind === 1) {
        const bowl = sph(0.2, POT_CLAY_D);
        bowl.scale.y = 0.55;
        g.add(put(bowl, x, y + 0.13, z));
      } else {
        g.add(put(cyl(0.1, 0.16, 0.4, 10, mixHexNum(POT_CLAY, 0xffffff, 0.25)), x, y + 0.24, z));
        g.add(put(cyl(0.13, 0.13, 0.05, 10, POT_CLAY_D), x, y + 0.45, z));
      }
    }
  }
  g.add(put(box(3.2, 0.14, 1.4, 0x8a6a45), 0, 2.5, 0));
  return g;
}

/* глиняный карьер */
export function clayPit() {
  const g = new THREE.Group();
  // яма уступами
  for (let i = 0; i < 3; i++) {
    const r = 2.8 - i * 0.65;
    g.add(put(cyl(r, r + 0.15, 0.4, 16, i % 2 ? POT_CLAY : POT_CLAY_D), 0, -i * 0.35, 0));
  }
  // лужа воды на дне
  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(1.0, 1.0, 0.1, 14),
    mat(0x8a7a5a, { roughness: 0.1, metalness: 0.25, transparent: true, opacity: 0.85, flatShading: false })
  );
  g.add(put(water, 0, -0.85, 0));
  // тачка и лопаты
  g.add(put(box(0.7, 0.36, 0.5, 0x8d949a), 2.4, 0.5, 1.0));
  const w = cyl(0.2, 0.2, 0.1, 10, 0x33373a);
  w.rotation.z = Math.PI / 2;
  g.add(put(w, 2.1, 0.2, 1.0));
  for (const [x, z, r] of [[2.9, 0.2, 0.3], [3.1, -0.4, -0.2]]) {
    const sh = cyl(0.04, 0.04, 1.2, 6, 0xa5713f);
    sh.rotation.z = r;
    g.add(put(sh, x, 0.6, z));
    g.add(put(box(0.22, 0.28, 0.05, 0x8d949a), x + r * 0.6, 0.05, z));
  }
  // кучи глины
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    g.add(put(cone(0.6, 0.7, 8, POT_CLAY), Math.cos(a) * 3.2, 0.35, Math.sin(a) * 3.2));
  }
  return g;
}
