import * as THREE from "three";

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";

/* ============================================================
   ПАЛИТРА
   ============================================================ */
export const C = {
  grass: 0x7ed957,
  grassDark: 0x54bf33,
  soil: 0xa8632f,
  soilDark: 0x854a22,
  wood: 0xc9803f,
  woodDark: 0x9c5f2c,
  stone: 0xbcc4cc,
  cream: 0xfff2dc,
  roof: 0xe8452f,
  roofDark: 0xc42d1c,
  glass: 0xa8ecf7,
  water: 0x2fc0e8,
  leaf: 0x3fbf3a,
  leafLight: 0x86e550,
  gold: 0xffc633,
  white: 0xfffdf6,
};
export const UI = {
  bg: "#e9f0e2",
  panel: "#fdfaf3",
  ink: "#2f3a2c",
  deep: "#3f6244",
  accent: "#d0703f",
  crate: "#a06a41",
  crateDark: "#7f5232",
};

/* ============================================================
   ХЕЛПЕРЫ ГЕОМЕТРИИ
   ============================================================ */
export const mat = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.0, flatShading: true, ...opts });

export function box(w, h, d, color, opts) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
export function cyl(rt, rb, h, seg, color, opts) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(color, opts));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
export function cone(r, h, seg, color, opts) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat(color, opts));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
export function sph(r, color, opts) {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), mat(color, opts));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
export const put = (mesh, x, y, z) => {
  mesh.position.set(x, y, z);
  return mesh;
};

/* ============================================================
   ПОСТРОЙКИ УЧАСТКА
   ============================================================ */

export function buildFence() {
  const g = new THREE.Group();
  const half = 7.2;
  const step = 1.8;
  for (let i = -half; i <= half; i += step) {
    for (const [x, z] of [
      [i, -half],
      [i, half],
      [-half, i],
      [half, i],
    ]) {
      if (Math.abs(x) < 1.4 && z === half) continue; // проём для калитки
      const post = box(0.22, 1.1, 0.22, C.wood);
      g.add(put(post, x, 0.55, z));
    }
  }
  for (const [w, d, x, z] of [
    [half * 2, 0.14, 0, -half],
    [half * 2, 0.14, 0, half],
    [0.14, half * 2, -half, 0],
    [0.14, half * 2, half, 0],
  ]) {
    const rail = box(w, 0.12, d, C.woodDark);
    g.add(put(rail, x, 0.78, z));
    const rail2 = rail.clone();
    g.add(put(rail2, x, 0.42, z));
  }
  return g;
}

export function buildGreenhouse() {
  const g = new THREE.Group();
  const glassMat = { transparent: true, opacity: 0.4, roughness: 0.15, flatShading: false };

  const base = box(4.4, 0.35, 3.2, C.woodDark);
  g.add(put(base, 0, 0.18, 0));

  const walls = new THREE.Mesh(new THREE.BoxGeometry(4.1, 2.1, 2.9), mat(C.glass, glassMat));
  g.add(put(walls, 0, 1.4, 0));

  // каркас
  for (const x of [-2.05, 2.05]) {
    for (const z of [-1.45, 1.45]) {
      g.add(put(box(0.16, 2.2, 0.16, C.wood), x, 1.4, z));
    }
  }
  for (const x of [-2.05, 2.05]) g.add(put(box(0.12, 0.12, 2.9, C.wood), x, 2.45, 0));
  for (const z of [-1.45, 1.45]) g.add(put(box(4.1, 0.12, 0.12, C.wood), 0, 2.45, z));

  // двускатная крыша из стекла
  for (const s of [-1, 1]) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.1, 3.0), mat(C.glass, glassMat));
    panel.position.set(s * 1.05, 2.86, 0);
    panel.rotation.z = s * -0.55;
    panel.castShadow = true;
    g.add(panel);
  }
  const ridge = box(0.16, 0.16, 3.1, C.wood);
  g.add(put(ridge, 0, 3.3, 0));

  // растения внутри
  const rowZ = [-0.8, 0, 0.8];
  rowZ.forEach((z, i) => {
    const bed = box(3.4, 0.25, 0.5, C.soilDark);
    g.add(put(bed, 0, 0.5, z));
    for (let j = -1; j <= 1; j++) {
      const p = sph(0.26, i % 2 ? C.leafLight : C.leaf);
      g.add(put(p, j * 1.1, 0.82, z));
      const fruit = sph(0.12, i === 0 ? 0xe4573f : i === 1 ? 0xf2b544 : 0xa96bd4);
      g.add(put(fruit, j * 1.1 + 0.15, 0.98, z + 0.12));
    }
  });
  return g;
}

export function buildHouse() {
  const g = new THREE.Group();

  const body = box(3.6, 2.4, 3.0, C.cream);
  g.add(put(body, 0, 1.2, 0));

  // крыша
  for (const s of [-1, 1]) {
    const slope = box(2.25, 0.22, 3.4, C.roof);
    slope.position.set(s * 0.95, 2.95, 0);
    slope.rotation.z = s * -0.62;
    g.add(slope);
  }
  const ridge = box(0.3, 0.22, 3.5, C.roofDark);
  g.add(put(ridge, 0, 3.52, 0));
  // фронтоны
  for (const z of [-1.5, 1.5]) {
    const gable = new THREE.Mesh(new THREE.ConeGeometry(2.0, 1.35, 3), mat(C.cream));
    gable.rotation.y = Math.PI / 2;
    gable.rotation.x = Math.PI / 2 * 0;
    gable.position.set(0, 3.05, z);
    gable.scale.set(1, 1, 0.06);
    gable.castShadow = true;
    g.add(gable);
  }

  const door = box(0.85, 1.45, 0.14, C.woodDark);
  g.add(put(door, -0.7, 0.72, 1.52));
  const knob = sph(0.07, C.gold);
  g.add(put(knob, -0.35, 0.75, 1.62));

  for (const [x, z, ry] of [
    [0.9, 1.53, 0],
    [1.83, 0.7, Math.PI / 2],
    [1.83, -0.7, Math.PI / 2],
  ]) {
    const win = box(0.9, 0.9, 0.12, 0x9fd7e6, { emissive: 0x2a4d5a, emissiveIntensity: 0.25 });
    win.rotation.y = ry;
    g.add(put(win, x, 1.5, z));
    const frame = box(1.02, 1.02, 0.06, C.woodDark);
    frame.rotation.y = ry;
    g.add(put(frame, x - (ry ? 0.04 : 0), 1.5, z + (ry ? 0 : -0.03)));
  }

  const chimney = box(0.5, 1.3, 0.5, C.stone);
  g.add(put(chimney, 1.1, 3.4, -0.8));

  // крылечко
  const porch = box(1.6, 0.2, 0.9, C.wood);
  g.add(put(porch, -0.7, 0.1, 1.95));
  return g;
}

export function buildBeds() {
  const g = new THREE.Group();
  const veg = [0xe4573f, 0xf2b544, 0xa96bd4, 0x6bbf59];
  for (let r = 0; r < 3; r++) {
    const frame = box(3.6, 0.4, 0.9, C.wood);
    g.add(put(frame, 0, 0.2, r * 1.2 - 1.2));
    const soil = box(3.35, 0.42, 0.68, C.soil);
    g.add(put(soil, 0, 0.24, r * 1.2 - 1.2));
    for (let i = -2; i <= 2; i++) {
      const leaf = cone(0.22, 0.55, 5, C.leaf);
      g.add(put(leaf, i * 0.65, 0.68, r * 1.2 - 1.2));
      const fruit = sph(0.13, veg[(r + i + 4) % veg.length]);
      g.add(put(fruit, i * 0.65 + 0.12, 0.62, r * 1.2 - 1.2 + 0.2));
    }
  }
  return g;
}

export function buildWell() {
  const g = new THREE.Group();
  const base = cyl(1.0, 1.05, 0.9, 10, C.stone);
  g.add(put(base, 0, 0.45, 0));
  const rim = cyl(1.08, 1.08, 0.16, 10, 0x9aa2a8);
  g.add(put(rim, 0, 0.95, 0));
  const water = cyl(0.9, 0.9, 0.06, 10, C.water, { roughness: 0.2, flatShading: false });
  g.add(put(water, 0, 0.9, 0));
  for (const x of [-0.85, 0.85]) g.add(put(box(0.16, 1.5, 0.16, C.wood), x, 1.6, 0));
  for (const s of [-1, 1]) {
    const roof = box(1.15, 0.14, 1.5, C.roof);
    roof.position.set(s * 0.48, 2.5, 0);
    roof.rotation.z = s * -0.6;
    g.add(roof);
  }
  const bucket = cyl(0.22, 0.26, 0.34, 8, C.woodDark);
  g.add(put(bucket, 0, 1.55, 0));
  return g;
}

export function buildTree(scale = 1) {
  const g = new THREE.Group();
  const trunk = cyl(0.18, 0.28, 1.5, 7, C.woodDark);
  g.add(put(trunk, 0, 0.75, 0));
  const crown1 = sph(0.95, C.leaf);
  g.add(put(crown1, 0, 1.95, 0));
  const crown2 = sph(0.7, C.leafLight);
  g.add(put(crown2, 0.45, 2.45, 0.2));
  const crown3 = sph(0.55, C.leaf);
  g.add(put(crown3, -0.45, 2.3, -0.2));
  for (let i = 0; i < 3; i++) {
    const apple = sph(0.13, 0xe4573f);
    g.add(put(apple, Math.cos(i * 2) * 0.75, 2.0 + i * 0.25, Math.sin(i * 2) * 0.75));
  }
  g.scale.setScalar(scale);
  return g;
}

export function buildOrchard() {
  const g = new THREE.Group();
  const t1 = buildTree(1.0);
  t1.position.set(0, 0, 0);
  const t2 = buildTree(0.75);
  t2.position.set(1.9, 0, 1.4);
  const t3 = buildTree(0.85);
  t3.position.set(-1.7, 0, 1.6);
  g.add(t1, t2, t3);
  return g;
}

export function buildWindmill(store) {
  const g = new THREE.Group();
  const tower = cyl(0.75, 1.3, 4.0, 8, C.cream);
  g.add(put(tower, 0, 2.0, 0));
  const roof = cone(1.05, 1.1, 8, C.roof);
  g.add(put(roof, 0, 4.5, 0));
  const door = box(0.6, 1.1, 0.14, C.woodDark);
  g.add(put(door, 0, 0.55, 1.22));

  const blades = new THREE.Group();
  const hub = cyl(0.16, 0.16, 0.3, 8, C.woodDark);
  hub.rotation.x = Math.PI / 2;
  blades.add(hub);
  for (let i = 0; i < 4; i++) {
    const arm = box(0.16, 2.6, 0.1, C.wood);
    const sail = box(0.55, 2.0, 0.06, C.white);
    const a = new THREE.Group();
    a.add(put(arm, 0, 1.3, 0));
    a.add(put(sail, 0.34, 1.3, -0.06));
    a.rotation.z = (i * Math.PI) / 2;
    blades.add(a);
  }
  blades.position.set(0, 3.9, 1.1);
  g.add(blades);
  store.windmillBlades = blades;
  return g;
}

export function buildPond(store) {
  const g = new THREE.Group();
  const hole = cyl(2.3, 2.3, 0.3, 14, C.soilDark);
  g.add(put(hole, 0, 0.02, 0));
  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(2.15, 2.15, 0.22, 24),
    mat(C.water, { roughness: 0.1, metalness: 0.15, transparent: true, opacity: 0.9, flatShading: false })
  );
  water.receiveShadow = true;
  g.add(put(water, 0, 0.16, 0));
  store.pondWater = water;

  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const s = sph(0.22 + (i % 3) * 0.07, C.stone);
    g.add(put(s, Math.cos(a) * 2.35, 0.18, Math.sin(a) * 2.35));
  }
  for (const [x, z] of [
    [0.7, 0.4],
    [-0.9, -0.5],
    [0.2, -1.1],
  ]) {
    const pad = cyl(0.4, 0.4, 0.05, 8, C.leafLight);
    g.add(put(pad, x, 0.28, z));
  }
  const lotus = sph(0.16, 0xf08fb0);
  g.add(put(lotus, 0.7, 0.38, 0.4));
  return g;
}

export function buildCoop() {
  const g = new THREE.Group();
  const body = box(2.2, 1.4, 1.8, C.cream);
  g.add(put(body, 0, 0.85, 0));
  for (const s of [-1, 1]) {
    const slope = box(1.45, 0.18, 2.1, C.roofDark);
    slope.position.set(s * 0.58, 1.85, 0);
    slope.rotation.z = s * -0.6;
    g.add(slope);
  }
  const ramp = box(0.7, 0.1, 1.1, C.wood);
  ramp.rotation.x = 0.45;
  g.add(put(ramp, 0, 0.3, 1.25));
  const hole = box(0.55, 0.6, 0.1, C.woodDark);
  g.add(put(hole, 0, 0.55, 0.92));

  for (const [x, z] of [
    [1.7, 0.9],
    [-1.5, 1.2],
    [1.2, -1.4],
  ]) {
    const chick = new THREE.Group();
    const bodyC = sph(0.28, C.white);
    chick.add(put(bodyC, 0, 0.3, 0));
    const head = sph(0.17, C.white);
    chick.add(put(head, 0.18, 0.6, 0));
    const beak = cone(0.07, 0.16, 5, C.gold);
    beak.rotation.z = -Math.PI / 2;
    chick.add(put(beak, 0.36, 0.6, 0));
    const comb = sph(0.09, 0xe4573f);
    chick.add(put(comb, 0.18, 0.75, 0));
    chick.position.set(x, 0, z);
    chick.rotation.y = Math.random() * Math.PI * 2;
    g.add(chick);
  }
  return g;
}

export function buildLanterns(store) {
  const g = new THREE.Group();
  const bulbs = [];
  const path = [
    [-5.5, 5.5],
    [-2, 6.2],
    [2, 6.2],
    [5.5, 5.5],
    [6.2, 2],
    [6.2, -2],
  ];
  path.forEach(([x, z], i) => {
    const post = cyl(0.07, 0.09, 2.0, 6, C.woodDark);
    g.add(put(post, x, 1.0, z));
    const arm = box(0.5, 0.07, 0.07, C.woodDark);
    g.add(put(arm, x + 0.2, 2.0, z));
    const lamp = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.2, 0),
      new THREE.MeshStandardMaterial({ color: 0xffe6a8, emissive: 0xffb545, emissiveIntensity: 1.1, flatShading: true })
    );
    lamp.position.set(x + 0.42, 1.85, z);
    g.add(lamp);
    bulbs.push(lamp);
    const light = new THREE.PointLight(0xffb96b, 0.5, 6);
    light.position.set(x + 0.42, 1.85, z);
    g.add(light);
  });
  store.lanternBulbs = bulbs;
  return g;
}

export function buildPath() {
  const g = new THREE.Group();
  const stones = [
    [0, 6.6],
    [0, 5.4],
    [-0.2, 4.2],
    [-0.5, 3.0],
    [-0.7, 1.8],
  ];
  stones.forEach(([x, z], i) => {
    const s = cyl(0.55 - i * 0.02, 0.55, 0.16, 7, C.stone);
    s.rotation.y = i * 0.5;
    g.add(put(s, x, 0.36, z));
  });
  return g;
}
