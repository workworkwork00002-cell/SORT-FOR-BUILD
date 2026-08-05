import * as THREE from "three";
import { box, cone, cyl, mat, put, sph } from "../core/geometry";
import { palm } from "../world/builders/resort";


/* ============================================================
   3D-МОДЕЛИ МАТЕРИАЛОВ
   Низкополигональные предметы вместо смайликов: у каждого
   свой силуэт, поэтому они различимы даже боковым зрением.

   Гранёная сфера sph() из мира отлично смотрится на валунах,
   но круглые предметы (лампа, капля, ягоды, пуговицы) с ней
   выглядят как обточенный самоцвет — острые грани и блики
   рвут форму. Для них берём гладкую сферу с мягким шейдингом.
   ============================================================ */

function sphSmooth(r, color, opts = {}) {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(r, 18, 14),
    new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0.05, flatShading: false, ...opts })
  );
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/* Предметы должны быть сочнее построек. Примешивание белого, как
   было раньше, поднимало яркость, но роняло насыщенность — цвета
   выходили бледнее, а не ярче. Поэтому работаем в HSL: насыщенность
   поднимаем, светлоту подтягиваем к комфортной середине. */
function brighten(hex) {
  const n = hexToNum(hex);
  let r = ((n >> 16) & 255) / 255;
  let g = ((n >> 8) & 255) / 255;
  let b = (n & 255) / 255;

  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  let h = 0;
  let sl = 0;
  const l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn;
    sl = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (mx === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }

  // серое оставляем серым, цветное делаем заметно насыщеннее
  const s2 = sl < 0.12 ? sl : Math.min(0.95, sl * 1.55 + 0.12);
  const l2 = Math.min(0.66, Math.max(0.46, l * 1.06));

  const hue = (p, q, t) => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  if (s2 === 0) {
    r = g = b = l2;
  } else {
    const q = l2 < 0.5 ? l2 * (1 + s2) : l2 + s2 - l2 * s2;
    const p = 2 * l2 - q;
    r = hue(p, q, h + 1 / 3);
    g = hue(p, q, h);
    b = hue(p, q, h - 1 / 3);
  }
  return (
    (Math.round(r * 255) << 16) | (Math.round(g * 255) << 8) | Math.round(b * 255)
  );
}

const ITEM_BUILDERS = {
  /* доска */
  "🪵": (c) => {
    const g = new THREE.Group();
    // бревно с торцевыми кольцами: ни с чем не спутать
    const log = cyl(0.3, 0.3, 1.05, 12, c);
    log.rotation.z = Math.PI / 2;
    g.add(log);
    for (const s2 of [-1, 1]) {
      const face = cyl(0.31, 0.31, 0.04, 12, mixHexNum(c, 0xffe0b0, 0.55));
      face.rotation.z = Math.PI / 2;
      g.add(put(face, s2 * 0.53, 0, 0));
      for (let r = 1; r <= 2; r++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 0.1, 0.018, 4, 12), mat(mixHexNum(c, 0x000000, 0.3)));
        ring.rotation.y = Math.PI / 2;
        g.add(put(ring, s2 * 0.56, 0, 0));
      }
    }
    // кора полосами
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      g.add(put(box(0.9, 0.04, 0.07, mixHexNum(c, 0x000000, 0.25)), 0, Math.sin(a) * 0.28, Math.cos(a) * 0.28));
    }
    return g;
  },

  /* кирпич */
  "🧱": (c) => {
    const g = new THREE.Group();
    g.add(box(0.95, 0.42, 0.46, c));
    g.add(put(box(0.97, 0.05, 0.48, 0xf0ece0), 0, 0.21, 0));
    for (const s of [-1, 1]) g.add(put(box(0.05, 0.44, 0.48, mixHexNum(c, 0x000000, 0.28)), s * 0.3, 0, 0));
    return g;
  },
  /* камень */
  "🪨": (c) => {
    const g = new THREE.Group();
    const core = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 0), mat(c));
    core.scale.set(1.15, 0.9, 1);
    g.add(core);
    // светлые сколы сверху и тёмная выемка — читается как камень
    const chip = new THREE.Mesh(new THREE.TetrahedronGeometry(0.2), mat(mixHexNum(c, 0xffffff, 0.3)));
    g.add(put(chip, 0.16, 0.24, 0.1));
    const chip2 = new THREE.Mesh(new THREE.TetrahedronGeometry(0.15), mat(mixHexNum(c, 0x000000, 0.28)));
    g.add(put(chip2, -0.24, 0.05, -0.14));
    return g;
  },

  /* болт */
  "🔩": (c) => {
    const g = new THREE.Group();
    const head = cyl(0.3, 0.3, 0.2, 6, c);
    g.add(put(head, 0, 0.28, 0));
    g.add(put(cyl(0.15, 0.15, 0.62, 16, mixHexNum(c, 0xffffff, 0.12)), 0, -0.1, 0));
    for (let i = 0; i < 5; i++) {
      g.add(put(cyl(0.17, 0.17, 0.035, 10, mixHexNum(c, 0x000000, 0.3)), 0, -0.32 + i * 0.11, 0));
    }
    return g;
  },
  /* стекло */
  "🪟": (c) => {
    const g = new THREE.Group();
    const pane = new THREE.Mesh(
      new THREE.BoxGeometry(0.86, 0.86, 0.07),
      mat(c, { transparent: true, opacity: 0.55, roughness: 0.05, metalness: 0.2, flatShading: false })
    );
    g.add(pane);
    const fr = mixHexNum(c, 0x000000, 0.45);
    for (const s of [-1, 1]) {
      g.add(put(box(0.94, 0.08, 0.11, fr), 0, s * 0.45, 0));
      g.add(put(box(0.08, 0.94, 0.11, fr), s * 0.45, 0, 0));
    }
    g.add(put(box(0.86, 0.05, 0.09, fr), 0, 0, 0));
    return g;
  },
  /* краска */
  "🎨": (c) => {
    const g = new THREE.Group();
    g.add(cyl(0.34, 0.3, 0.66, 12, mixHexNum(c, 0xffffff, 0.55)));
    g.add(put(cyl(0.36, 0.36, 0.08, 12, c), 0, 0.35, 0));
    g.add(put(box(0.5, 0.28, 0.02, c), 0, -0.05, 0.31));
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 5, 12, Math.PI), mat(0x8d949a));
    g.add(put(handle, 0, 0.4, 0));
    return g;
  },
  /* капля воды */
  "💧": (c) => {
    const g = new THREE.Group();
    const body = sphSmooth(0.36, c, { roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.9 });
    body.scale.set(1, 1.05, 1);
    g.add(put(body, 0, -0.08, 0));
    const tip = cone(0.28, 0.5, 10, c, { roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.9, flatShading: false });
    g.add(put(tip, 0, 0.32, 0));
    g.add(put(sphSmooth(0.09, 0xffffff, { roughness: 0.1 }), -0.13, 0.02, 0.24));
    return g;
  },
  /* росток */
  "🌱": (c) => {
    const g = new THREE.Group();
    g.add(put(cyl(0.05, 0.07, 0.5, 10, mixHexNum(c, 0x000000, 0.25)), 0, -0.15, 0));
    for (const s of [-1, 1]) {
      const leaf = sph(0.26, c);
      leaf.scale.set(1.5, 0.35, 0.9);
      leaf.rotation.z = s * 0.5;
      g.add(put(leaf, s * 0.24, 0.18, 0));
    }
    g.add(put(cyl(0.3, 0.34, 0.24, 16, 0xa8632f), 0, -0.36, 0));
    return g;
  },
  /* шестерня */
  "⚙️": (c) => {
    const g = new THREE.Group();
    const ring = cyl(0.34, 0.34, 0.16, 12, c);
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const tooth = box(0.14, 0.14, 0.16, c);
      tooth.position.set(Math.cos(a) * 0.4, Math.sin(a) * 0.4, 0);
      tooth.rotation.z = a;
      g.add(tooth);
    }
    const hole = cyl(0.12, 0.12, 0.19, 10, mixHexNum(c, 0x000000, 0.45));
    hole.rotation.x = Math.PI / 2;
    g.add(hole);
    return g;
  },
  /* ключ */
  "🔑": (c) => {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.07, 6, 14), mat(c));
    ring.rotation.y = Math.PI / 2;
    g.add(put(ring, 0, 0.3, 0));
    g.add(put(cyl(0.06, 0.06, 0.62, 12, c), 0, -0.12, 0));
    g.add(put(box(0.2, 0.09, 0.1, c), 0.11, -0.34, 0));
    g.add(put(box(0.15, 0.09, 0.1, c), 0.09, -0.2, 0));
    return g;
  },
  /* звезда-джокер */
  "⭐": (c) => {
    const g = new THREE.Group();
    const shape = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? 0.48 : 0.2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y);
    }
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.16, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 1 });
    geo.center();
    const m = new THREE.Mesh(geo, mat(c, { emissive: c, emissiveIntensity: 0.35 }));
    m.castShadow = true;
    g.add(m);
    return g;
  },
  /* подарок-загадка */
  "🎁": (c) => {
    const g = new THREE.Group();
    g.add(box(0.72, 0.6, 0.72, c));
    const rb = mixHexNum(c, 0xffffff, 0.6);
    g.add(put(box(0.16, 0.62, 0.74, rb), 0, 0, 0));
    g.add(put(box(0.74, 0.62, 0.16, rb), 0, 0, 0));
    for (const s of [-1, 1]) {
      const loop = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.05, 5, 10), mat(rb));
      loop.rotation.y = Math.PI / 2;
      g.add(put(loop, s * 0.12, 0.36, 0));
    }
    return g;
  },
  /* ведро */
  "🪣": (c) => {
    const g = new THREE.Group();
    g.add(cyl(0.38, 0.24, 0.66, 12, c));
    g.add(put(cyl(0.4, 0.4, 0.08, 12, mixHexNum(c, 0xffffff, 0.3)), 0, 0.34, 0));
    g.add(put(cyl(0.32, 0.32, 0.05, 12, mixHexNum(c, 0x000000, 0.25)), 0, 0.3, 0));
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.03, 5, 12, Math.PI), mat(0x8d949a));
    g.add(put(handle, 0, 0.34, 0));
    return g;
  },
  /* молоток */
  "🔨": (c) => {
    const g = new THREE.Group();
    g.add(put(cyl(0.07, 0.08, 0.72, 12, 0xa5713f), 0, -0.1, 0));
    g.add(put(box(0.5, 0.22, 0.22, mixHexNum(c, 0x000000, 0.15)), 0, 0.3, 0));
    g.add(put(box(0.14, 0.26, 0.24, c), -0.28, 0.3, 0));
    return g;
  },
  /* верёвка */
  "🧵": (c) => {
    const g = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const t = new THREE.Mesh(new THREE.TorusGeometry(0.3 - i * 0.02, 0.09, 6, 14), mat(c));
      t.rotation.x = Math.PI / 2 + i * 0.2;
      g.add(put(t, 0, -0.16 + i * 0.16, 0));
    }
    return g;
  },
  /* лампа */
  "💡": (c) => {
    const g = new THREE.Group();
    const bulb = sphSmooth(0.32, c, { emissive: c, emissiveIntensity: 0.7, transparent: true, opacity: 0.9 });
    g.add(put(bulb, 0, 0.1, 0));
    g.add(put(cyl(0.16, 0.18, 0.26, 10, 0x9aa2a8), 0, -0.24, 0));
    for (let i = 0; i < 3; i++) g.add(put(cyl(0.185, 0.185, 0.03, 10, 0x7f868c), 0, -0.18 - i * 0.08, 0));
    return g;
  },
  /* бочка цемента */
  "🛢️": (c) => {
    const g = new THREE.Group();
    g.add(cyl(0.33, 0.33, 0.72, 14, c));
    for (const y of [-0.2, 0.2]) g.add(put(cyl(0.35, 0.35, 0.07, 14, mixHexNum(c, 0x000000, 0.3)), 0, y, 0));
    g.add(put(cyl(0.34, 0.34, 0.04, 14, mixHexNum(c, 0xffffff, 0.3)), 0, 0.37, 0));
    return g;
  },
  /* дверь */
  "🚪": (c) => {
    const g = new THREE.Group();
    g.add(box(0.6, 0.95, 0.12, c));
    g.add(put(box(0.42, 0.34, 0.04, mixHexNum(c, 0x000000, 0.22)), 0, 0.22, 0.07));
    g.add(put(box(0.42, 0.28, 0.04, mixHexNum(c, 0x000000, 0.22)), 0, -0.2, 0.07));
    g.add(put(sphSmooth(0.06, 0xe0b545), 0.2, 0, 0.1));
    return g;
  },
  /* перчатка */
  "🧤": (c) => {
    const g = new THREE.Group();
    const palm = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), mat(c));
    palm.scale.set(1, 1.25, 0.55);
    g.add(put(palm, 0, 0.06, 0));
    // большой палец сбоку — главный узнаваемый признак
    const thumb = sphSmooth(0.14, c);
    thumb.scale.set(1, 1.5, 0.6);
    thumb.rotation.z = 0.9;
    g.add(put(thumb, -0.3, 0.02, 0));
    // манжета
    g.add(put(cyl(0.26, 0.28, 0.22, 10, mixHexNum(c, 0xffffff, 0.45)), 0, -0.36, 0));
    return g;
  },

  /* провод */
  "🔌": (c) => {
    const g = new THREE.Group();
    g.add(box(0.34, 0.34, 0.24, c));
    for (const s of [-1, 1]) g.add(put(cyl(0.05, 0.05, 0.26, 8, 0xc9cdd2), s * 0.09, 0.28, 0));
    const wire = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.05, 6, 14, Math.PI * 1.4), mat(mixHexNum(c, 0x000000, 0.3)));
    wire.rotation.x = Math.PI / 2;
    g.add(put(wire, 0, -0.24, 0));
    return g;
  },
  /* стремянка */
  "🪜": (c) => {
    const g = new THREE.Group();
    for (const s of [-1, 1]) g.add(put(box(0.07, 0.95, 0.07, c), s * 0.22, 0, 0));
    for (let i = -1; i <= 1; i++) g.add(put(box(0.5, 0.06, 0.06, mixHexNum(c, 0xffffff, 0.2)), 0, i * 0.3, 0));
    return g;
  },
  /* сумка */
  "🛍️": (c) => {
    const g = new THREE.Group();
    g.add(box(0.56, 0.56, 0.3, c));
    for (const s of [-1, 1]) {
      const h = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 5, 10, Math.PI), mat(mixHexNum(c, 0x000000, 0.3)));
      g.add(put(h, s * 0.15, 0.3, 0));
    }
    g.add(put(box(0.58, 0.08, 0.32, mixHexNum(c, 0xffffff, 0.3)), 0, 0.22, 0));
    return g;
  },
  /* кран */
  "🏗️": (c) => {
    const g = new THREE.Group();
    g.add(put(cyl(0.06, 0.08, 0.8, 6, c), 0, -0.05, 0));
    g.add(put(box(0.8, 0.07, 0.07, c), 0.16, 0.36, 0));
    g.add(put(cyl(0.02, 0.02, 0.3, 4, 0x55595e), 0.5, 0.2, 0));
    g.add(put(box(0.12, 0.1, 0.12, 0x44484c), 0.5, 0.03, 0));
    g.add(put(box(0.24, 0.05, 0.24, mixHexNum(c, 0x000000, 0.2)), 0, -0.44, 0));
    return g;
  },
  /* стул */
  "🪑": (c) => {
    const g = new THREE.Group();
    g.add(put(box(0.46, 0.07, 0.46, c), 0, 0.04, 0));
    g.add(put(box(0.46, 0.44, 0.07, c), 0, 0.26, -0.2));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      g.add(put(box(0.06, 0.42, 0.06, mixHexNum(c, 0x000000, 0.2)), sx * 0.18, -0.2, sz * 0.18));
    }
    return g;
  },
  /* линейка */
  "📏": (c) => {
    const g = new THREE.Group();
    g.add(box(0.95, 0.14, 0.06, c));
    for (let i = -3; i <= 3; i++) {
      g.add(put(box(0.02, 0.07, 0.02, mixHexNum(c, 0x000000, 0.5)), i * 0.12, 0.03, 0.035));
    }
    return g;
  },
  /* чертёж */
  "📐": (c) => {
    const g = new THREE.Group();
    const tri = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 3), mat(c, { transparent: true, opacity: 0.75 }));
    tri.rotation.x = Math.PI / 2;
    g.add(tri);
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 3), mat(0xffffff, { transparent: true, opacity: 0.5 }));
    inner.rotation.x = Math.PI / 2;
    g.add(inner);
    return g;
  },
  /* ножницы */
  "✂️": (c) => {
    const g = new THREE.Group();
    for (const s of [-1, 1]) {
      const blade = box(0.5, 0.07, 0.05, 0xc9cdd2);
      blade.rotation.z = s * 0.22;
      g.add(put(blade, 0.18, s * 0.08, 0));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.035, 5, 10), mat(c));
      ring.rotation.y = Math.PI / 2;
      g.add(put(ring, -0.3, s * 0.16, 0));
    }
    g.add(put(sphSmooth(0.05, 0x8d949a), 0.02, 0, 0));
    return g;
  },
  /* искра */
  "✨": (c) => {
    const g = new THREE.Group();
    const m = mat(c, { emissive: c, emissiveIntensity: 0.8 });
    for (const [rx, rz] of [[0, 0], [Math.PI / 2, 0], [0, Math.PI / 2]]) {
      const sp = new THREE.Mesh(new THREE.OctahedronGeometry(0.36, 0), m);
      sp.scale.set(1, 0.22, 0.22);
      sp.rotation.set(rx, 0, rz);
      g.add(sp);
    }
    return g;
  },
  /* фонарь */
  "🔦": (c) => {
    const g = new THREE.Group();
    g.add(put(cyl(0.16, 0.13, 0.6, 10, c), 0, -0.1, 0));
    g.add(put(cone(0.26, 0.28, 10, mixHexNum(c, 0x000000, 0.2)), 0, 0.32, 0));
    g.add(put(cyl(0.22, 0.22, 0.05, 10, 0xfff0c4, { emissive: 0xffc46b, emissiveIntensity: 0.9 }), 0, 0.45, 0));
    return g;
  },
  /* сноп */
  "🌾": (c) => {
    const g = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const stalk = cyl(0.025, 0.03, 0.8, 5, mixHexNum(c, 0x000000, 0.15));
      stalk.rotation.z = Math.cos(a) * 0.16;
      stalk.rotation.x = Math.sin(a) * 0.16;
      g.add(put(stalk, Math.cos(a) * 0.08, 0, Math.sin(a) * 0.08));
      const ear = sph(0.1, c);
      ear.scale.set(0.7, 1.6, 0.7);
      g.add(put(ear, Math.cos(a) * 0.14, 0.42, Math.sin(a) * 0.14));
    }
    g.add(put(cyl(0.14, 0.14, 0.08, 8, 0xa5713f), 0, -0.16, 0));
    return g;
  },
  /* кружка */
  "☕": (c) => {
    const g = new THREE.Group();
    g.add(cyl(0.28, 0.24, 0.5, 12, mixHexNum(c, 0xffffff, 0.6)));
    g.add(put(cyl(0.25, 0.25, 0.05, 12, c), 0, 0.22, 0));
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.035, 5, 10), mat(mixHexNum(c, 0xffffff, 0.6)));
    h.rotation.y = Math.PI / 2;
    g.add(put(h, 0.3, 0, 0));
    return g;
  },
  /* светофор */
  "🚦": (c) => {
    const g = new THREE.Group();
    g.add(box(0.3, 0.72, 0.24, 0x33373a));
    [0xff4d3d, 0xf2c144, 0x5ad06a].forEach((col, i) => {
      g.add(put(sphSmooth(0.09, col, { emissive: col, emissiveIntensity: 0.7 }), 0, 0.22 - i * 0.22, 0.14));
    });
    g.add(put(cyl(0.05, 0.05, 0.3, 10, 0x55595e), 0, -0.5, 0));
    return g;
  },
  /* лифт */
  "🛗": (c) => {
    const g = new THREE.Group();
    g.add(box(0.62, 0.72, 0.3, c));
    for (const s of [-1, 1]) g.add(put(box(0.27, 0.62, 0.05, mixHexNum(c, 0xffffff, 0.45)), s * 0.15, 0, 0.17));
    g.add(put(box(0.62, 0.09, 0.32, mixHexNum(c, 0x000000, 0.3)), 0, 0.4, 0));
    return g;
  },
  /* труба */
  "🚰": (c) => {
    const g = new THREE.Group();
    g.add(put(cyl(0.13, 0.13, 0.7, 10, c), 0, -0.1, 0));
    const bend = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.13, 6, 10, Math.PI / 2), mat(c));
    bend.rotation.y = Math.PI;
    g.add(put(bend, -0.2, 0.25, 0));
    g.add(put(cyl(0.16, 0.16, 0.07, 10, mixHexNum(c, 0xffffff, 0.3)), 0, -0.42, 0));
    return g;
  },
  /* корзина/тележка */
  "🛒": (c) => {
    const g = new THREE.Group();
    const b = box(0.6, 0.36, 0.4, c);
    g.add(put(b, 0, 0.1, 0));
    for (let i = -2; i <= 2; i++) g.add(put(box(0.03, 0.34, 0.03, mixHexNum(c, 0x000000, 0.3)), i * 0.13, 0.1, 0.2));
    g.add(put(box(0.05, 0.4, 0.05, mixHexNum(c, 0x000000, 0.2)), -0.32, 0.32, 0));
    for (const s of [-1, 1]) g.add(put(cyl(0.08, 0.08, 0.05, 8, 0x33373a), s * 0.2, -0.14, 0.14));
    return g;
  },
  /* ракушка */
  "🐚": (c) => {
    const g = new THREE.Group();
    const body = sphSmooth(0.4, c);
    body.scale.set(1, 0.62, 0.85);
    g.add(body);
    // рёбра веером — ни с чем не спутать
    for (let i = -3; i <= 3; i++) {
      const rib = box(0.05, 0.16, 0.72, mixHexNum(c, 0xffffff, 0.4));
      rib.rotation.y = i * 0.19;
      g.add(put(rib, 0, 0.14, 0.05));
    }
    g.add(put(cyl(0.1, 0.14, 0.12, 10, mixHexNum(c, 0x000000, 0.2)), 0, -0.08, -0.34));
    return g;
  },
  /* автобус */
  "🚌": (c) => {
    const g = new THREE.Group();
    g.add(box(1.0, 0.5, 0.46, c));
    g.add(put(box(1.02, 0.14, 0.48, mixHexNum(c, 0xffffff, 0.45)), 0, 0.18, 0));
    // окна вдоль борта
    for (let i = -1; i <= 1; i++) {
      g.add(put(box(0.22, 0.18, 0.05, 0xcfe9f5), i * 0.28, 0.06, 0.24));
    }
    g.add(put(box(0.2, 0.22, 0.05, 0xcfe9f5), 0.44, 0.04, 0.24));
    for (const x of [-0.3, 0.3]) {
      const w = cyl(0.13, 0.13, 0.1, 12, 0x33373a);
      w.rotation.z = Math.PI / 2;
      g.add(put(w, x, -0.27, 0.22));
      g.add(put(w.clone(), x, -0.27, -0.22));
    }
    return g;
  },
  /* мешок */
  "🧺": (c) => {
    const g = new THREE.Group();
    const b = cyl(0.36, 0.26, 0.48, 10, c);
    g.add(put(b, 0, -0.08, 0));
    g.add(put(cyl(0.38, 0.38, 0.06, 10, mixHexNum(c, 0x000000, 0.2)), 0, 0.18, 0));
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 5, 12, Math.PI), mat(mixHexNum(c, 0x000000, 0.2)));
    g.add(put(handle, 0, 0.2, 0));
    return g;
  },
};

/* смешивание чисел-цветов */
export function mixHexNum(a, b, k) {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const r = Math.round(ar + (br - ar) * k);
  const g = Math.round(ag + (bg - ag) * k);
  const bl = Math.round(ab + (bb - ab) * k);
  return (r << 16) | (g << 8) | bl;
}

const hexToNum = (h) => {
  const s = String(h).replace("#", "");
  const v = s.length === 3 ? s.split("").map((c) => c + c).join("") : s;
  const n = parseInt(v, 16);
  return Number.isFinite(n) ? n : 0xaaaaaa;
};

/* Запасная модель для материалов без своей формы.

   Раньше все они рисовались одним кубиком и отличались только
   цветом — а у десяти групп совпадали и цвета, так что предметы
   было не различить. Теперь форма выбирается по самому символу
   материала: одинаковые материалы всегда выглядят одинаково,
   разные — по-разному. */
const FALLBACK_SHAPES = 9;

function shapeIndex(emoji) {
  let h = 0;
  for (let i = 0; i < emoji.length; i++) h = (h * 31 + emoji.charCodeAt(i)) >>> 0;
  return h % FALLBACK_SHAPES;
}

function genericItem(color, emoji = "") {
  const g = new THREE.Group();
  const dark = mixHexNum(color, 0x000000, 0.28);
  const light = mixHexNum(color, 0xffffff, 0.35);

  switch (shapeIndex(emoji)) {
    case 0: { // кубик с фаской
      g.add(box(0.72, 0.72, 0.72, color));
      g.add(put(box(0.76, 0.07, 0.76, light), 0, 0.35, 0));
      break;
    }
    case 1: { // бочонок
      g.add(cyl(0.36, 0.36, 0.74, 14, color));
      for (const y of [-0.2, 0.2]) g.add(put(cyl(0.38, 0.38, 0.07, 14, dark), 0, y, 0));
      break;
    }
    case 2: { // шар
      g.add(sphSmooth(0.4, color));
      g.add(put(sphSmooth(0.11, light), -0.14, 0.18, 0.28));
      break;
    }
    case 3: { // конус
      g.add(put(cone(0.42, 0.8, 12, color), 0, 0.05, 0));
      g.add(put(cyl(0.44, 0.44, 0.08, 12, dark), 0, -0.34, 0));
      break;
    }
    case 4: { // кольцо
      const t = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.14, 10, 18), mat(color, { flatShading: false }));
      t.rotation.x = Math.PI / 2;
      g.add(t);
      break;
    }
    case 5: { // брусок стопкой
      g.add(put(box(0.8, 0.24, 0.5, color), 0, -0.16, 0));
      g.add(put(box(0.66, 0.22, 0.44, light), 0, 0.1, 0));
      g.add(put(box(0.5, 0.2, 0.38, color), 0, 0.34, 0));
      break;
    }
    case 6: { // гранёный кристалл
      const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.46, 0), mat(color));
      m.scale.set(1, 1.25, 1);
      g.add(m);
      break;
    }
    case 7: { // капсула
      g.add(cyl(0.28, 0.28, 0.46, 14, color));
      g.add(put(sphSmooth(0.28, color), 0, 0.23, 0));
      g.add(put(sphSmooth(0.28, color), 0, -0.23, 0));
      g.add(put(cyl(0.3, 0.3, 0.06, 14, light), 0, 0, 0));
      break;
    }
    default: { // шестигранная шайба
      g.add(cyl(0.42, 0.42, 0.34, 6, color));
      g.add(put(cyl(0.28, 0.28, 0.37, 6, light), 0, 0, 0));
      break;
    }
  }
  return g;
}

export function makeItemMesh(emoji, colorHex) {
  // предметы в руках должны читаться ярче окружения
  const color = brighten(colorHex);
  const build = ITEM_BUILDERS[emoji];
  const g = build ? build(color) : genericItem(color, emoji);
  // предметы крупнее — на телефоне мелкий силуэт не прочитать
  g.scale.setScalar(1.22);
  g.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
      // чуть меньше шероховатости — сочнее блик, живее цвет
      if (o.material && o.material.roughness !== undefined && !o.userData.keepRoughness) {
        o.material.roughness = Math.min(o.material.roughness, 0.55);
      }
    }
  });
  return g;
}

/* ============================================================
   3D-ЯЩИК
   ============================================================ */
function makeCrateMesh(styleKey, depth) {
  const S = CRATE_3D[styleKey] || CRATE_3D.wood;
  const g = new THREE.Group();
  const W = 1.5;
  // высота под новый шаг стопки 0.98, иначе верхние предметы
  // торчали бы выше стенок
  const H = 0.5 + depth * 0.98;
  const D = 1.15;
  const t = 0.09;

  // дно
  g.add(put(box(W, t, D, S.dark), 0, t / 2, 0));
  // стенки
  const wallMat = (w, h, d, x, y, z, col) => {
    const m = box(w, h, d, col);
    g.add(put(m, x, y, z));
    return m;
  };
  wallMat(W, H, t, 0, H / 2, -D / 2 + t / 2, S.back);
  // Передняя стенка — тонкий бортик фиксированной высоты, а не доля
  // от H: раньше она росла вместе со стопкой и на глубоких ящиках
  // закрывала нижние предметы («загорождения снизу» на скриншоте).
  const sill = 0.16;
  wallMat(W, sill, t, 0, sill / 2, D / 2 - t / 2, S.front);
  wallMat(t, H, D, -W / 2 + t / 2, H / 2, 0, S.side);
  wallMat(t, H, D, W / 2 - t / 2, H / 2, 0, S.side);

  // доски — только по низкому бортику, иначе торчали во всю высоту
  for (let i = -1; i <= 1; i++) {
    g.add(put(box(0.035, sill * 0.8, 0.02, S.seam), i * 0.42, sill / 2, D / 2 + 0.005));
  }
  // верхний кант
  for (const [w, d, x, z] of [
    [W, t * 1.4, 0, -D / 2 + t / 2],
    [t * 1.4, D, -W / 2 + t / 2, 0],
    [t * 1.4, D, W / 2 - t / 2, 0],
  ]) {
    g.add(put(box(w, 0.07, d, S.rim), x, H + 0.03, z));
  }
  g.add(put(box(W, 0.07, t * 1.4, S.rim), 0, sill + 0.03, D / 2 - t / 2));

  // Кованые накладки. Раньше они шли на 90% высоты ящика и спереди
  // читались как решётка из прутьев. Теперь это короткие уголки
  // только по низу и по верху задних стоек — содержимое открыто.
  for (const sx of [-1, 1]) {
    // низ: короткая накладка на всех четырёх углах
    for (const sz of [-1, 1]) {
      g.add(put(box(0.13, 0.2, 0.13, S.metal), sx * (W / 2 - 0.05), 0.12, sz * (D / 2 - 0.05)));
      g.add(put(sphSmooth(0.04, S.rivet), sx * (W / 2 - 0.02), 0.14, sz * (D / 2 - 0.05)));
    }
    // верх: только задние стойки, чтобы не загораживать вид
    g.add(put(box(0.13, 0.22, 0.13, S.metal), sx * (W / 2 - 0.05), H - 0.12, -D / 2 + 0.05));
    g.add(put(sphSmooth(0.04, S.rivet), sx * (W / 2 - 0.02), H - 0.12, -D / 2 + 0.05));
  }
  return { group: g, height: H, width: W, depth: D };
}

export const CRATE_3D = {
  wood: { back: 0x9c6a35, front: 0xb37c42, side: 0xa4712e, dark: 0x6e4522, rim: 0xc48b52, seam: 0x5a3618, metal: 0x6e757c, rivet: 0x4a5057 },
  toolbox: { back: 0xa8382a, front: 0xc44a35, side: 0xb43f2f, dark: 0x7a2418, rim: 0xe0654a, seam: 0x66190f, metal: 0x98a0a8, rivet: 0x5f666d },
  basket: { back: 0xb8903f, front: 0xd4a94f, side: 0xc49a45, dark: 0x8a6428, rim: 0xe0bb78, seam: 0x6f5020, metal: 0xa8895a, rivet: 0x7a5a30 },
  container: { back: 0x35708f, front: 0x4189aa, side: 0x3a7d9c, dark: 0x234a5e, rim: 0x5ea0c0, seam: 0x1c3e4f, metal: 0x9fadb6, rivet: 0x5d6a72 },
  stone: { back: 0x8a8474, front: 0xa09a88, side: 0x958f7e, dark: 0x5e5a50, rim: 0xb8b2a4, seam: 0x514d44, metal: 0x7e858c, rivet: 0x565c62 },
};
