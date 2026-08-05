import * as THREE from "three";
import React, { useEffect, useRef } from "react";
import { cone, mat, put, sph } from "../core/geometry";
import { trapeze } from "./builders/circus";
import { carousel } from "./builders/park";
import { makeMoon, makeSnow, makeStars } from "./builders/seasonal";
import { DOOR_KEYS, LIFE_CFG, makeBird, makeCar, makePerson, makeSmoke } from "./life";
import { WORLDS } from "./worlds";


/* ============================================================
   3D СЦЕНА
   ============================================================ */
export function Plot({ world, unlocked, apiRef }) {
  const mountRef = useRef(null);
  const stateRef = useRef({});

  useEffect(() => {
    const mount = mountRef.current;
    const S = stateRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(WORLDS[0].sky);
    scene.fog = new THREE.Fog(WORLDS[0].sky, 70, 150);

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 300);
    const FRONT = Math.PI / 2;
    S.theta = FRONT; S.tTheta = FRONT;
    S.phi = 1.34;    S.tPhi = 1.34;
    S.MIN_PHI = 0.5;
    S.MAX_PHI = 1.48;
    S.CENTER = new THREE.Vector3(0, -1.2, 0);
    S.BOUND_R = 13.4;
    S.radius = 34; S.tRadius = 34;
    S.MIN_R = 16;
    S.MAX_R = 70;
    S.fitted = false;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    // ACES заметно приглушает и обесцвечивает картинку — для стилизованной
    // low-poly графики выгоднее без тонмаппинга: цвета остаются сочными
    renderer.toneMapping = THREE.NoToneMapping;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.style.cursor = "grab";

    // свет
    const hemi = new THREE.HemisphereLight(0xdff0ff, 0x6f8a5a, 0.32);
    scene.add(hemi);
    S.hemi = hemi;
    const sun = new THREE.DirectionalLight(0xfff6e2, 0.7);
    S.sun = sun;
    sun.position.set(9, 16, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const d = 18;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 70;
    sun.shadow.bias = -0.0006;
    scene.add(sun);
    const amb = new THREE.AmbientLight(0xffffff, 0.12);
    scene.add(amb);
    S.amb = amb;

    // облака
    const clouds = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const c = new THREE.Group();
      const s = 0.8 + Math.random() * 0.7;
      c.add(put(sph(1.1, 0xffffff, { roughness: 1 }), 0, 0, 0));
      c.add(put(sph(0.8, 0xffffff, { roughness: 1 }), 1.1, -0.2, 0.2));
      c.add(put(sph(0.9, 0xfdfdff, { roughness: 1 }), -1.0, -0.15, -0.2));
      c.scale.setScalar(s);
      const a = (i / 5) * Math.PI * 2;
      c.position.set(Math.cos(a) * 38, 7 + Math.random() * 4, Math.sin(a) * 38);
      c.userData.a = a;
      c.userData.r = 38;
      clouds.add(c);
    }
    scene.add(clouds);

    S.scene = scene;
    S.camera = camera;
    S.renderer = renderer;
    S.clouds = clouds;
    S.built = [];
    S.pending = [];
    S.builtCount = 0;
    S.island = null;

    /* --- остров под конкретный мир --- */
    S.makeIsland = (cfg) => {
      S.ISLAND_R = cfg.radius || 11.5;
      if (S.island) {
        scene.remove(S.island);
        S.island.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) o.material.dispose();
        });
      }
      const R = cfg.radius || 11.5;
      const island = new THREE.Group();
      const top = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 1.0, 30), mat(cfg.top));
      top.receiveShadow = true;
      island.add(put(top, 0, -0.5, 0));
      const under = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.56, R * 0.39, 30), mat(cfg.side));
      under.receiveShadow = true;
      island.add(put(under, 0, -1.0 - R * 0.195, 0));
      const tip = cone(R * 0.56, R * 0.35, 30, cfg.tip);
      tip.rotation.x = Math.PI;
      island.add(put(tip, 0, -1.0 - R * 0.39 - R * 0.175, 0));
      for (let i = 0; i < 30; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = R * 0.72 + Math.random() * R * 0.24;
        island.add(put(cone(0.22, 0.5, 5, cfg.tuft), Math.cos(a) * r, 0.2, Math.sin(a) * r));
      }
      scene.add(island);
      S.island = island;
      if (S.rebuildBounds) S.rebuildBounds();
    };

    /* --- атмосфера мира: свет, небо, осадки ---
       Важно: тонмаппинг выключен, поэтому сумма интенсивностей
       (solnce + hemi + ambient) не должна превышать ~1.15 —
       иначе насыщенные цвета вроде травы обрезаются в белый. */
    S.applyAtmosphere = (w) => {
      const L = w.light || {};
      S.sun.color.setHex(L.sunColor ?? 0xfff6e2);
      S.sun.intensity = L.sun ?? 0.7;
      S.hemi.color.setHex(L.hemiSky ?? 0xdff0ff);
      S.hemi.groundColor.setHex(L.hemiGround ?? 0x6f8a5a);
      S.hemi.intensity = L.hemi ?? 0.32;
      S.amb.intensity = L.ambient ?? 0.12;
      S.sun.position.set(...(L.sunPos || [9, 16, 8]));

      scene.background = new THREE.Color(w.sky);
      scene.fog = new THREE.Fog(w.sky, w.night ? 70 : 90, w.night ? 150 : 190);
      clouds.visible = !w.night;

      // снег
      if (S.snow) { scene.remove(S.snow); S.snow.geometry.dispose(); S.snow.material.dispose(); S.snow = null; }
      if (w.snow) { S.snow = makeSnow(w.radius + 3); scene.add(S.snow); }
      // лепестки сакуры — та же система, только розовые и крупнее
      if (w.petals) { S.snow = makeSnow(w.radius + 3, 200, 0xffb7d5, 0.34); scene.add(S.snow); }

      // звёзды и луна
      if (S.stars) { scene.remove(S.stars); S.stars.geometry.dispose(); S.stars.material.dispose(); S.stars = null; }
      if (S.moon) { scene.remove(S.moon); S.moon = null; }
      if (w.night) {
        S.stars = makeStars(Math.max(90, w.radius * 6));
        scene.add(S.stars);
        S.moon = makeMoon();
        scene.add(S.moon);
      }
      S.isNight = !!w.night;
    };

    /* --- живность: создание популяции под мир и прогресс --- */
    S.life = null;
    S.makeLife = (worldIdx, unlockedCount) => {
      if (S.life) {
        scene.remove(S.life.root);
        S.life.root.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) o.material.dispose();
        });
      }
      const cfg = LIFE_CFG[WORLDS[worldIdx].key];
      const walkR = WORLDS[worldIdx].walkR || cfg.walkR;
      const stages = WORLDS[worldIdx].stages;
      const root = new THREE.Group();

      // двери уже построенных зданий
      const doors = [];
      stages.forEach((st, i) => {
        if (i < unlockedCount && DOOR_KEYS.has(st.key)) {
          doors.push({ x: st.pos[0], z: st.pos[1], a: Math.atan2(st.pos[1], st.pos[0]) });
        }
      });

      // пешеходы появляются вместе с дорожкой и прибывают по мере стройки
      const peopleCount = unlockedCount === 0 ? 0 : Math.min(cfg.people, 2 + Math.ceil(unlockedCount * 0.8));
      const people = [];
      for (let i = 0; i < peopleCount; i++) {
        const p = makePerson();
        p.userData.a = (i / peopleCount) * Math.PI * 2 + Math.random() * 0.4;
        p.userData.r = walkR + (Math.random() - 0.5) * 1.4;
        p.userData.speed = (0.10 + Math.random() * 0.07) * (Math.random() < 0.5 ? 1 : -1);
        p.userData.state = "walk";
        p.userData.timer = 2 + Math.random() * 8;
        p.userData.prog = 0;
        p.userData.door = null;
        root.add(p);
        people.push(p);
      }

      // транспорт — только когда проложена дорога (первая стадия мира)
      const cars = [];
      if (unlockedCount >= 1 && cfg.lanes.length) {
        cfg.lanes.forEach(([lx, dir], i) => {
          const n = unlockedCount >= 4 ? 2 : 1;
          for (let k = 0; k < n; k++) {
            const c = makeCar();
            c.userData.lane = lx;
            c.userData.dir = dir;
            c.userData.p = (k / n + i * 0.31 + Math.random() * 0.2) % 1;
            c.userData.speed = 0.08 + Math.random() * 0.05;
            root.add(c);
            cars.push(c);
          }
        });
      }

      // птицы летают всегда
      const birds = [];
      for (let i = 0; i < cfg.birds; i++) {
        const b = makeBird(cfg.birdColor);
        b.userData.a = Math.random() * Math.PI * 2;
        b.userData.r = walkR * 0.9 + Math.random() * walkR * 0.7;
        b.userData.y = 7.5 + Math.random() * 4;
        b.userData.speed = 0.18 + Math.random() * 0.14;
        root.add(b);
        birds.push(b);
      }

      // дым из труб — если дом уже построен
      const smokes = [];
      cfg.smoke.forEach(([x, y, z]) => {
        const houseIdx = stages.findIndex((s) => s.key === "house");
        if (houseIdx >= 0 && houseIdx < unlockedCount) {
          const sm = makeSmoke(x, y, z);
          root.add(sm);
          smokes.push(sm);
        }
      });

      scene.add(root);
      S.life = { root, people, cars, birds, smokes, doors, cfg };
    };

    /* --- подгонка кадра --- */
    let FIT_PTS = [];
    S.rebuildBounds = () => {
      const R = S.ISLAND_R || 11.5;
      const pts = [];
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
        pts.push(new THREE.Vector3(Math.cos(a) * R, 0, Math.sin(a) * R));
        // верхушки построек на внешнем кольце
        pts.push(new THREE.Vector3(Math.cos(a) * R * 0.78, 6.0, Math.sin(a) * R * 0.78));
      }
      // самая высокая точка мира — небоскрёб
      pts.push(new THREE.Vector3(R * 0.5, 20.0, -R * 0.3));
      pts.push(new THREE.Vector3(0, -1.0 - R * 0.39 - R * 0.35, 0));
      FIT_PTS = pts;
      S.CENTER.set(0, R * -0.1, 0);
      S.BOUND_R = R * 1.12;
    };
    S.rebuildBounds();

    // первичная инициализация мира — после того, как объявлены все системы
    S.makeIsland({ ...WORLDS[0].ground, radius: WORLDS[0].radius });
    S.applyAtmosphere(WORLDS[0]);

    const UPV = new THREE.Vector3(0, 1, 0);
    const _cam = new THREE.Vector3();
    const _fwd = new THREE.Vector3();
    const _rgt = new THREE.Vector3();
    const _up = new THREE.Vector3();
    const _dv = new THREE.Vector3();
    const FILL = 0.92;

    S.fitFor = (theta, phi) => {
      const vFov = (camera.fov * Math.PI) / 180;
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
      const tanV = Math.tan(vFov / 2);
      const tanH = Math.tan(hFov / 2);
      let dist = S.BOUND_R / Math.sin(Math.min(vFov, hFov) / 2);

      for (let iter = 0; iter < 4; iter++) {
        _cam.set(
          S.CENTER.x + Math.cos(theta) * Math.sin(phi) * dist,
          S.CENTER.y + Math.cos(phi) * dist,
          S.CENTER.z + Math.sin(theta) * Math.sin(phi) * dist
        );
        _fwd.copy(S.CENTER).sub(_cam).normalize();
        _rgt.copy(_fwd).cross(UPV).normalize();
        _up.copy(_rgt).cross(_fwd).normalize();

        let fill = 0;
        for (const p of FIT_PTS) {
          _dv.copy(p).sub(_cam);
          const fz = _dv.dot(_fwd);
          if (fz <= 0.1) continue;
          fill = Math.max(fill, Math.abs(_dv.dot(_rgt) / fz) / tanH);
          fill = Math.max(fill, Math.abs(_dv.dot(_up) / fz) / tanV);
        }
        if (fill <= 0) break;
        dist *= fill / FILL;
      }
      return dist;
    };

    /* --- управление камерой --- */
    const pointers = new Map();
    let lastX = 0, lastY = 0, lastPinch = 0;

    const onDown = (e) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        lastX = e.clientX;
        lastY = e.clientY;
        renderer.domElement.style.cursor = "grabbing";
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        lastPinch = Math.hypot(a.x - b.x, a.y - b.y);
      }
      renderer.domElement.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        S.tTheta -= (e.clientX - lastX) * 0.008;
        S.tPhi = Math.max(S.MIN_PHI, Math.min(S.MAX_PHI, S.tPhi - (e.clientY - lastY) * 0.005));
        lastX = e.clientX;
        lastY = e.clientY;
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (lastPinch) S.tRadius = Math.max(S.MIN_R, Math.min(S.MAX_R, S.tRadius * (lastPinch / dist)));
        lastPinch = dist;
      }
    };
    const onUp = (e) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) lastPinch = 0;
      if (pointers.size === 0) renderer.domElement.style.cursor = "grab";
      renderer.domElement.releasePointerCapture?.(e.pointerId);
    };
    const onWheel = (e) => {
      e.preventDefault();
      S.tRadius = Math.max(S.MIN_R, Math.min(S.MAX_R, S.tRadius * (1 + e.deltaY * 0.0012)));
    };

    renderer.domElement.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    S.setView = (theta, phi, zoom) => {
      const cur = S.tTheta;
      let target = theta;
      while (target - cur > Math.PI) target -= Math.PI * 2;
      while (target - cur < -Math.PI) target += Math.PI * 2;
      S.tTheta = target;
      S.tPhi = Math.max(S.MIN_PHI, Math.min(S.MAX_PHI, phi));
      const fit = S.fitFor(S.tTheta, S.tPhi);
      S.MIN_R = fit * 0.4;
      S.MAX_R = fit * 2.4;
      S.tRadius = Math.max(S.MIN_R, Math.min(S.MAX_R, fit * (zoom || 1)));
    };
    S.zoomBy = (delta) => {
      S.tRadius = Math.max(S.MIN_R, Math.min(S.MAX_R, S.tRadius * (1 + delta * 0.18)));
    };
    if (apiRef) apiRef.current = { setView: (...a) => S.setView(...a), zoomBy: (x) => S.zoomBy(x) };

    /* --- ресайз --- */
    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";

      const fit = S.fitFor(S.tTheta, S.tPhi);
      S.MIN_R = fit * 0.4;
      S.MAX_R = fit * 2.4;
      if (!S.fitted) {
        S.radius = fit;
        S.tRadius = fit;
        S.fitted = true;
      } else {
        S.tRadius = Math.max(S.MIN_R, Math.min(S.MAX_R, S.tRadius));
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    /* --- цикл --- */
    const clock = new THREE.Clock();
    let raf;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);
      S.time = (S.time || 0) + dt;
      const t = S.time;

      const k = 1 - Math.pow(0.001, dt);
      S.theta += (S.tTheta - S.theta) * k;
      S.phi += (S.tPhi - S.phi) * k;
      S.radius += (S.tRadius - S.radius) * k;

      camera.position.set(
        S.CENTER.x + Math.cos(S.theta) * Math.sin(S.phi) * S.radius,
        S.CENTER.y + Math.cos(S.phi) * S.radius,
        S.CENTER.z + Math.sin(S.theta) * Math.sin(S.phi) * S.radius
      );
      camera.lookAt(S.CENTER);

      if (S.island) S.island.position.y = Math.sin(t * 0.7) * 0.12;

      clouds.children.forEach((c, i) => {
        c.userData.a += dt * 0.035 * (i % 2 ? 1 : -1);
        c.position.x = Math.cos(c.userData.a) * c.userData.r;
        c.position.z = Math.sin(c.userData.a) * c.userData.r;
      });

      // анимация живых элементов
      if (S.windmillBlades) S.windmillBlades.rotation.z += dt * 0.9;
      if (S.pondWater) {
        S.pondWater.scale.x = 1 + Math.sin(t * 1.6) * 0.012;
        S.pondWater.scale.z = 1 + Math.cos(t * 1.4) * 0.012;
      }
      if (S.poolWater) S.poolWater.scale.x = 1 + Math.sin(t * 2.0) * 0.008;
      if (S.surf) {
        S.surf.position.z = 0.5 + Math.sin(t * 0.9) * 0.35;
        S.surf.material.opacity = 0.6 + Math.sin(t * 0.9) * 0.15;
      }
      if (S.lanternBulbs) {
        S.lanternBulbs.forEach((b, i) => {
          b.material.emissiveIntensity = 0.85 + Math.sin(t * 2 + i) * 0.35;
        });
      }
      if (S.fountainJets) {
        S.fountainJets.forEach((j, i) => {
          j.scale.y = 0.8 + Math.sin(t * 3 + i * 0.7) * 0.25;
        });
      }
      if (S.beacons) {
        S.beacons.forEach((b, i) => {
          if (b) b.material.emissiveIntensity = 0.6 + Math.abs(Math.sin(t * 1.6 + i)) * 1.4;
        });
      }
      if (S.trafficLights) {
        const phase = Math.floor(t / 2.2) % 3;
        S.trafficLights.forEach((l, i) => {
          l.material.emissiveIntensity = i % 3 === phase ? 1.6 : 0.15;
        });
      }
      if (S.beaconLight) {
        const pulse = 0.6 + Math.abs(Math.sin(t * 1.1)) * 1.2;
        S.beaconLight.material.emissiveIntensity = pulse;
        if (S.beaconPointLight) S.beaconPointLight.intensity = pulse * 0.7;
      }
      if (S.boats) {
        S.boats.forEach((b) => {
          b.position.y = 0.1 + Math.sin(t * 1.3 + b.userData.phase) * 0.09;
          b.rotation.z = Math.sin(t * 0.9 + b.userData.phase) * 0.05;
        });
      }

      /* ---------- живой мир ---------- */
      if (S.life) {
        const L = S.life;

        // пешеходы
        for (const p of L.people) {
          const u = p.userData;

          if (u.state === "walk") {
            u.a += dt * u.speed * (u.speed > 0 ? 1 : 1);
            u.timer -= dt;
            // решаем зайти в ближайшее здание
            if (u.timer <= 0 && L.doors.length) {
              const d = L.doors[(Math.random() * L.doors.length) | 0];
              let diff = Math.atan2(Math.sin(d.a - u.a), Math.cos(d.a - u.a));
              if (Math.abs(diff) < 0.5) {
                u.door = d;
                u.state = "toDoor";
                u.prog = 0;
              }
              u.timer = 4 + Math.random() * 9;
            }
          } else if (u.state === "toDoor") {
            u.prog += dt * 0.8;
            if (u.prog >= 1) {
              u.state = "inside";
              u.timer = 1.5 + Math.random() * 4;
            }
          } else if (u.state === "inside") {
            u.timer -= dt;
            if (u.timer <= 0) {
              u.state = "fromDoor";
              u.prog = 1;
            }
          } else if (u.state === "fromDoor") {
            u.prog -= dt * 0.8;
            if (u.prog <= 0) {
              u.state = "walk";
              u.door = null;
              u.timer = 6 + Math.random() * 10;
            }
          }

          // позиция: точка на кольце, при визите — интерполяция к двери
          const rx = Math.cos(u.a) * u.r;
          const rz = Math.sin(u.a) * u.r;
          let x = rx, z = rz;
          if (u.door) {
            const e = u.prog * u.prog * (3 - 2 * u.prog); // сглаживание
            x = rx + (u.door.x - rx) * e;
            z = rz + (u.door.z - rz) * e;
          }
          p.position.set(x, 0, z);

          const moving = u.state !== "inside";
          // разворот по направлению движения
          const heading = u.door && u.prog > 0.02
            ? Math.atan2(u.door.x - rx, u.door.z - rz) * (u.state === "fromDoor" ? 1 : 1)
            : Math.atan2(-Math.sin(u.a) * Math.sign(u.speed), Math.cos(u.a) * Math.sign(u.speed));
          p.rotation.y += Math.atan2(Math.sin(heading - p.rotation.y), Math.cos(heading - p.rotation.y)) * Math.min(1, dt * 6);

          // походка
          if (moving) {
            u.phase += dt * 9;
            const sw = Math.sin(u.phase) * 0.55;
            u.hips[0].rotation.x = sw;
            u.hips[1].rotation.x = -sw;
            u.arms[0].rotation.x = -sw * 0.7;
            u.arms[1].rotation.x = sw * 0.7;
            p.position.y = Math.abs(Math.sin(u.phase)) * 0.035;
          }
          // масштаб: заходя в дверь — исчезает
          const vis = u.state === "inside" ? 0 : u.state === "toDoor" ? 1 - u.prog * 0.85 : u.state === "fromDoor" ? 1 - u.prog * 0.85 : 1;
          p.scale.setScalar(Math.max(0.001, vis));
        }

        // транспорт
        for (const c of L.cars) {
          const u = c.userData;
          u.p += dt * u.speed;
          if (u.p > 1) u.p -= 1;
          const RR = (S.ISLAND_R || 11.5) - 0.5;
          const z = u.dir > 0 ? -RR + 2 * RR * u.p : RR - 2 * RR * u.p;
          c.position.set(u.lane, 0.2, z);
          c.rotation.y = u.dir > 0 ? 0 : Math.PI;
          // плавно появляется и исчезает у края острова
          const edge = Math.min(u.p, 1 - u.p) / 0.09;
          c.scale.setScalar(Math.max(0.001, Math.min(1, edge)));
          u.wheels.forEach((w) => (w.rotation.y -= dt * u.speed * 90));
        }

        // птицы
        for (const b of L.birds) {
          const u = b.userData;
          u.a += dt * u.speed;
          const y = u.y + Math.sin(t * 0.8 + u.phase) * 0.7;
          b.position.set(Math.cos(u.a) * u.r, y, Math.sin(u.a) * u.r);
          b.rotation.y = -u.a - Math.PI / 2;
          b.rotation.z = Math.sin(t * 0.8 + u.phase) * 0.15;
          const flap = Math.sin(t * 11 + u.phase) * 0.65;
          u.wings.forEach((w) => (w.pivot.rotation.z = -w.side * flap));
        }

        // дым
        for (const sm of L.smokes) {
          sm.userData.puffs.forEach((pf) => {
            pf.life += dt * 0.35;
            if (pf.life > 1) pf.life -= 1;
            const l = pf.life;
            pf.mesh.position.set(Math.sin(l * 4 + pf.life) * 0.3 * l, l * 2.4, Math.cos(l * 3) * 0.2 * l);
            pf.mesh.scale.setScalar(0.35 + l * 1.1);
            pf.mesh.material.opacity = Math.max(0, 0.45 * (1 - l));
          });
        }
      }

      // снег падает и закручивается
      if (S.snow) {
        const arr = S.snow.geometry.attributes.position.array;
        const u = S.snow.userData;
        for (let i = 0; i < u.count; i++) {
          arr[i * 3 + 1] -= dt * u.spd[i];
          arr[i * 3] += Math.sin(t * 0.8 + i) * dt * 0.28;
          if (arr[i * 3 + 1] < -1) {
            arr[i * 3 + 1] = 15 + Math.random() * 3;
            const a = Math.random() * Math.PI * 2;
            const r = Math.random() * u.radius;
            arr[i * 3] = Math.cos(a) * r;
            arr[i * 3 + 2] = Math.sin(a) * r;
          }
        }
        S.snow.geometry.attributes.position.needsUpdate = true;
      }
      if (S.stars) S.stars.rotation.y += dt * 0.006;

      // неон пульсирует, прожекторы шарят по небу
      if (S.neons) {
        S.neons.forEach((n, i) => {
          const flick = i % 5 === 0 ? (Math.sin(t * 14 + i) > -0.85 ? 1 : 0.25) : 1;
          n.material.emissiveIntensity = (1.2 + Math.sin(t * 2 + i * 0.9) * 0.35) * flick;
        });
      }
      if (S.clubBeams) {
        S.clubBeams.forEach((b, i) => {
          b.mesh.rotation.z = b.side * (0.3 + Math.sin(t * 0.7 + i) * 0.45);
          b.mesh.rotation.x = Math.cos(t * 0.5 + i) * 0.3;
        });
      }
      if (S.rinkBulbs) {
        S.rinkBulbs.forEach((b, i) => {
          b.material.emissiveIntensity = 0.9 + Math.sin(t * 2.4 + i * 1.1) * 0.5;
        });
      }

      // колесо обозрения: вращается, кабинки висят вертикально
      if (S.ferris) {
        S.ferris.rotation.z += dt * 0.22;
        S.ferris.children.forEach((c) => {
          if (c.userData && c.userData.pivot) c.rotation.z = -S.ferris.rotation.z;
        });
      }
      // карусель крутится, лошадки качаются вверх-вниз
      if (S.carousel) {
        S.carousel.rotation.y += dt * 0.55;
        S.carousel.children.forEach((c) => {
          if (c.userData && c.userData.bob !== undefined) {
            c.position.y = 1.35 + Math.sin(t * 2.4 + c.userData.bob) * 0.22;
          }
        });
      }
      if (S.carouselBulbs) {
        S.carouselBulbs.forEach((b, i) => {
          b.material.emissiveIntensity = Math.sin(t * 4 + i * 0.8) > 0 ? 1.5 : 0.35;
        });
      }
      // вагончики едут по рельсам
      if (S.coasterTrain && S.coasterCurve) {
        S.coasterT = ((S.coasterT || 0) + dt * 0.055) % 1;
        S.coasterTrain.children.forEach((car, i) => {
          const u = (S.coasterT - i * 0.012 + 1) % 1;
          const p = S.coasterCurve.getPointAt(u);
          const tan = S.coasterCurve.getTangentAt(u);
          car.position.copy(p);
          car.lookAt(p.clone().add(tan));
        });
      }
      // радар вращается
      if (S.radarDish) S.radarDish.rotation.y += dt * 0.9;
      // огни взлётной полосы бегут волной
      if (S.runwayLights) {
        S.runwayLights.forEach((l, i) => {
          l.material.emissiveIntensity = 0.6 + Math.abs(Math.sin(t * 2.2 - i * 0.35)) * 1.1;
        });
      }

      // карпы кружат в пруду
      if (S.koi) {
        S.koi.forEach((f, i) => {
          f.userData.a += dt * (0.35 + i * 0.08);
          const r = f.userData.r;
          f.position.x = Math.cos(f.userData.a) * r;
          f.position.z = Math.sin(f.userData.a) * r;
          f.rotation.y = -f.userData.a + Math.PI / 2;
          f.position.y = 0.34 + Math.sin(t * 2 + i) * 0.04;
        });
      }
      // суда покачиваются на волне
      if (S.ships) {
        S.ships.forEach((sh) => {
          sh.position.y = Math.sin(t * 0.8 + sh.userData.phase) * 0.12;
          sh.rotation.z = Math.sin(t * 0.6 + sh.userData.phase) * 0.025;
        });
      }
      if (S.buoys) {
        S.buoys.forEach((b) => {
          b.position.y = 0.1 + Math.sin(t * 1.6 + b.userData.phase) * 0.16;
          b.rotation.z = Math.sin(t * 1.2 + b.userData.phase) * 0.12;
        });
      }
      // портовый кран поворачивает стрелу
      if (S.craneJib) {
        S.craneJib.rotation.y = Math.sin(t * 0.22) * 0.8;
        if (S.craneHook) S.craneHook.position.y = -Math.abs(Math.sin(t * 0.45)) * 1.6;
      }
      // огонь в кузнице
      if (S.forgeFire) {
        S.forgeFire.forEach((f, i) => {
          f.scale.y = 0.85 + Math.sin(t * 7 + i) * 0.25;
          f.material.emissiveIntensity = 1.2 + Math.sin(t * 9 + i) * 0.4;
        });
      }

      // лава пульсирует и подсвечивает окрестности
      if (S.lavaFlows) {
        S.lavaFlows.forEach((f, i) => {
          f.material.emissiveIntensity = 1.0 + Math.sin(t * 1.6 + i * 0.8) * 0.45;
        });
      }
      if (S.lavaPool) {
        S.lavaPool.material.emissiveIntensity = 1.3 + Math.sin(t * 1.1) * 0.4;
        S.lavaPool.scale.x = 1 + Math.sin(t * 0.9) * 0.02;
        S.lavaPool.scale.z = 1 + Math.cos(t * 0.8) * 0.02;
      }
      if (S.lavaLight) S.lavaLight.intensity = 1.2 + Math.sin(t * 1.4) * 0.45;
      if (S.springWater) {
        S.springWater.scale.x = 1 + Math.sin(t * 1.3) * 0.015;
        S.springWater.scale.z = 1 + Math.cos(t * 1.1) * 0.015;
      }
      // поезд едет вдоль путей, колёса крутятся
      if (S.train) {
        S.trainZ = ((S.trainZ || -13) + dt * 1.9);
        if (S.trainZ > 15) S.trainZ = -15;
        S.train.position.z = S.trainZ;
        const lw = S.train.children[0];
        if (lw && lw.userData.wheels) lw.userData.wheels.forEach((w) => (w.rotation.y -= dt * 4.5));
      }

      // пузырьки всплывают и начинают путь заново
      if (S.bubbles) {
        S.bubbles.forEach((b) => {
          b.position.y += dt * 0.7;
          if (b.position.y > 3.6) b.position.y = 0;
          b.position.x += Math.sin(t * 2 + b.position.y) * dt * 0.15;
        });
      }
      // кораллы колышет течением
      if (S.corals) {
        S.corals.forEach((c, i) => {
          c.rotation.z = Math.sin(t * 0.8 + i * 0.7) * 0.11;
          c.rotation.x = Math.cos(t * 0.6 + i) * 0.07;
        });
      }
      // маяк на дне пульсирует
      if (S.seaLamp) {
        S.seaLamp.material.emissiveIntensity = 1.0 + Math.sin(t * 1.6) * 0.6;
      }
      // софиты сцены переливаются
      if (S.stageLights) {
        S.stageLights.forEach((l, i) => {
          l.material.emissiveIntensity = 0.7 + Math.sin(t * 2.4 + i * 0.8) * 0.4;
        });
      }
      // колокола карильона покачиваются
      if (S.bells) {
        S.bells.forEach((b, i) => {
          b.rotation.z = Math.sin(t * 1.5 + i * 1.1) * 0.16;
        });
      }
      // гончарный круг вращается
      if (S.potWheel) S.potWheel.rotation.y += dt * 2.2;

      // пчёлы кружат над ульем
      if (S.bees) {
        S.bees.forEach((b, i) => {
          b.userData.a += dt * (0.9 + i * 0.13);
          b.position.x = Math.cos(b.userData.a) * b.userData.r;
          b.position.z = Math.sin(b.userData.a) * b.userData.r;
          b.position.y = b.userData.y + Math.sin(t * 3 + i) * 0.18;
          b.rotation.y = -b.userData.a;
        });
      }
      // купол обсерватории медленно поворачивается
      if (S.dome) S.dome.rotation.y += dt * 0.12;
      // тарелка ведёт цель
      if (S.dish) {
        S.dish.rotation.y = Math.sin(t * 0.18) * 0.7;
        S.dish.rotation.x = -0.5 + Math.sin(t * 0.11) * 0.18;
      }
      // звёзды на карте мерцают
      if (S.chartStars) {
        S.chartStars.forEach((st2, i) => {
          st2.material.emissiveIntensity = 0.8 + Math.sin(t * 2.2 + i * 0.9) * 0.5;
        });
      }
      // поворотный стол скульптора
      if (S.sculptStand) S.sculptStand.rotation.y += dt * 0.25;
      // кольца мобиля вращаются в разные стороны
      if (S.kineticRings) {
        S.kineticRings.forEach((r, i) => {
          r.rotation.y += dt * (0.4 + i * 0.25) * (i % 2 ? -1 : 1);
        });
      }

      // кабинки подъёмника едут по тросу
      if (S.liftCabs) {
        S.liftCabs.forEach((c, i) => {
          const t2 = (t * 0.16 + i / S.liftCabs.length) % 1;
          c.position.x = -3.2 + t2 * 6.4;
          c.position.y = 4.6 + c.position.x * 0.19;
          c.rotation.z = Math.sin(t * 1.4 + i) * 0.07;
        });
      }
      // лёд катка бликует
      if (S.rinkIce) S.rinkIce.material.opacity = 0.88 + Math.sin(t * 1.2) * 0.06;
      // мельница чайной долины
      if (S.teaWheel) S.teaWheel.rotation.z += dt * 0.6;
      // стрелки часов идут
      if (S.clockHands) {
        S.clockHands.minute.rotation.z = -t * 0.5;
        S.clockHands.hour.rotation.z = -t * 0.5 / 12;
      }
      // трубки курантов покачиваются
      if (S.chimes) {
        S.chimes.forEach((c, i) => {
          c.rotation.z = Math.sin(t * 1.1 + i * 0.5) * 0.09;
        });
      }

      // флаги шапито полощутся
      if (S.circusFlags) {
        S.circusFlags.forEach((f, i) => {
          f.rotation.y = Math.sin(t * 2.2 + i * 0.6) * 0.35;
        });
      }
      // трапеция раскачивается
      if (S.trapeze) S.trapeze.rotation.x = Math.sin(t * 1.3) * 0.42;
      // паруса чуть надуваются
      if (S.sails) {
        S.sails.forEach((sl, i) => {
          sl.scale.x = 1 + Math.sin(t * 1.1 + i) * 0.04;
          sl.rotation.y = Math.sin(t * 0.8 + i) * 0.06;
        });
      }
      // светящиеся грибы дышат светом
      if (S.glowCaps) {
        S.glowCaps.forEach((c, i) => {
          c.material.emissiveIntensity = 0.7 + Math.sin(t * 1.6 + i * 0.7) * 0.35;
        });
      }
      // пыльца фей кружит
      if (S.motes) {
        S.motes.forEach((p, i) => {
          p.userData.a += dt * 0.6;
          p.position.x = Math.cos(p.userData.a) * 0.9;
          p.position.z = Math.sin(p.userData.a) * 0.9;
          p.position.y = 0.7 + Math.sin(t * 1.8 + i) * 0.3;
        });
      }
      // колесо подъёмника в шахте
      if (S.mineWheel) S.mineWheel.rotation.z += dt * 0.5;
      if (S.mineLamps) {
        S.mineLamps.forEach((l, i) => {
          l.material.emissiveIntensity = 1.0 + Math.sin(t * 3 + i) * 0.3;
        });
      }
      // ракета чуть подрагивает перед стартом
      if (S.rocket) S.rocket.position.y = 0.5 + Math.sin(t * 8) * 0.012;
      // струя водопада
      if (S.waterFall) {
        S.waterFall.material.opacity = 0.62 + Math.sin(t * 5) * 0.08;
        S.waterFall.scale.x = 1 + Math.sin(t * 4) * 0.03;
      }
      // лианы качаются
      if (S.vines) {
        S.vines.forEach((v, i) => {
          v.rotation.z = Math.sin(t * 0.9 + i) * 0.14;
        });
      }

      // появление построек
      for (let i = S.pending.length - 1; i >= 0; i--) {
        const p = S.pending[i];
        p.t += dt;
        const kk = Math.min(1, p.t / 0.65);
        const e = 1 + 2.2 * Math.pow(1 - kk, 3) * Math.sin(kk * Math.PI * 1.6);
        p.group.scale.setScalar(kk === 1 ? 1 : kk * e);
        p.group.rotation.y = p.baseRot + (1 - kk) * 0.6;
        if (kk === 1) S.pending.splice(i, 1);
      }

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("wheel", onWheel);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  /* смена мира: чистим постройки, перекрашиваем остров и небо */
  useEffect(() => {
    const S = stateRef.current;
    if (!S.scene) return;
    const cfg = WORLDS[world];

    S.built.forEach((g) => S.scene.remove(g));
    S.built = [];
    S.pending = [];
    S.builtCount = 0;
    S.windmillBlades = null;
    S.pondWater = null;
    S.poolWater = null;
    S.surf = null;
    S.lanternBulbs = null;
    S.fountainJets = null;
    S.beacons = null;
    S.trafficLights = null;
    S.beaconLight = null;
    S.beaconPointLight = null;
    S.boats = null;
    S.neons = null;
    S.clubBeams = null;
    S.rinkBulbs = null;
    S.rinkIce = null;
    S.ferris = null;
    S.carousel = null;
    S.carouselBulbs = null;
    S.coasterTrain = null;
    S.coasterCurve = null;
    S.radarDish = null;
    S.runwayLights = null;
    S.koi = null;
    S.ships = null;
    S.buoys = null;
    S.craneJib = null;
    S.craneHook = null;
    S.forgeFire = null;
    S.circusFlags = null;
    S.liftCabs = null;
    S.bees = null;
    S.bubbles = null;
    S.corals = null;
    S.seaLamp = null;
    S.stageLights = null;
    S.bells = null;
    S.potWheel = null;
    S.dome = null;
    S.dish = null;
    S.chartStars = null;
    S.sculptStand = null;
    S.kineticRings = null;
    S.rinkIce = null;
    S.teaWheel = null;
    S.clockHands = null;
    S.chimes = null;
    S.trapeze = null;
    S.sails = null;
    S.glowCaps = null;
    S.motes = null;
    S.mineWheel = null;
    S.mineLamps = null;
    S.rocket = null;
    S.waterFall = null;
    S.vines = null;
    S.lavaFlows = null;
    S.lavaPool = null;
    S.lavaLight = null;
    S.springWater = null;
    S.train = null;
    S.trainZ = null;

    S.makeIsland({ ...cfg.ground, radius: cfg.radius });
    if (S.applyAtmosphere) S.applyAtmosphere(cfg);
  }, [world]);

  /* добавление построек по мере прохождения */
  useEffect(() => {
    const S = stateRef.current;
    if (!S.scene) return;
    const stages = WORLDS[world].stages;
    while (S.builtCount < unlocked && S.builtCount < stages.length) {
      const st = stages[S.builtCount];
      const g = st.make(S);
      // Ночью здание превращается в неоновую вывеску: окна загораются
      // разноцветно, а всё, что светилось изначально, разгорается сильнее.
      if (WORLDS[world].night) {
        const NEON = [0x2ff5ff, 0xff2fa8, 0xffe23f, 0x8f4dff, 0x3fff9a, 0xff6b3f];
        // у каждого здания свой доминирующий оттенок — как разные вывески
        const base = NEON[(Math.random() * NEON.length) | 0];
        g.traverse((o) => {
          const m = o.material;
          if (!m || !m.emissive) return;
          if (m.emissiveIntensity > 0.05) {
            // уже светящееся — разгоняем и подкрашиваем в неон
            m.emissive.setHex(Math.random() < 0.6 ? base : NEON[(Math.random() * NEON.length) | 0]);
            m.emissiveIntensity = 1.1 + Math.random() * 0.6;
          } else if (m.color) {
            const r = Math.random();
            if (r < 0.55) {
              // тёплое окно жилого дома
              m.emissive.setHex(0xffc46b);
              m.emissiveIntensity = 0.55 + Math.random() * 0.6;
            } else if (r < 0.78) {
              // неоновая подсветка фасада
              m.emissive.setHex(Math.random() < 0.7 ? base : NEON[(Math.random() * NEON.length) | 0]);
              m.emissiveIntensity = 0.7 + Math.random() * 0.7;
            } else {
              // остальное просто не тонет в темноте
              m.emissive.setHex(0x2a3358);
              m.emissiveIntensity = 0.3;
            }
          }
        });
        // цветная подсветка вокруг здания
        const halo = new THREE.PointLight(base, 0.7, 11);
        halo.position.set(0, 2.5, 0);
        g.add(halo);
      }
      g.position.set(st.pos[0], 0, st.pos[1]);
      g.rotation.y = st.rot;
      g.scale.setScalar(0.001);
      S.scene.add(g);
      S.pending.push({ group: g, t: 0, baseRot: st.rot });
      S.built.push(g);
      S.builtCount++;
    }
    // живность обновляется вместе с застройкой
    if (S.makeLife) S.makeLife(world, unlocked);
  }, [unlocked, world]);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}
