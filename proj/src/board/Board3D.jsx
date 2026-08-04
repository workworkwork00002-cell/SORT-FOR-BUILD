import * as THREE from "three";
import React, { useState, useEffect, useRef } from "react";
import { CRATE_3D, makeItemMesh } from "./models";
import { WORLD_CRATE } from "../core/economy";
import { C, box, put } from "../core/geometry";
import { SHELF_SLOTS } from "../core/shelves";
import { it } from "../world/builders/resort";


/* ============================================================
   3D-ПОЛЕ: ПОЛКИ
   Полки стоят сеткой — по две в ряду, ряды уходят вниз и вглубь.
   Предмет тащишь пальцем: он поднимается над полкой и летит за
   курсором, свободные места подсвечиваются.

   Предметы из глубины видны позади витрины полупрозрачными
   силуэтами и выезжают вперёд, только когда витрина опустеет
   целиком — ничего не появляется из ниоткуда.
   ============================================================ */
export function Board3D({
  board, cfg, justMatched, blockedAt, worldKey, onDrop,
}) {
  const mountRef = useRef(null);
  const S = useRef({});
  const propsRef = useRef({});
  const [projected, setProjected] = useState([]);
  propsRef.current = { board, onDrop };

  useEffect(() => {
    const mount = mountRef.current;
    const st = S.current;

    const scene = new THREE.Scene();
    scene.background = null;
    /* Ортографическая камера, а не перспективная.

       При перспективе нижние полки оказывались дальше от камеры
       и выглядели на 10% мельче верхних — читалось как перекос.
       В ортографии все полки одного размера независимо от высоты,
       а объём всё равно виден по геометрии полок, свету и теням. */
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.NoToneMapping;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.touchAction = "none";

    // сумма источников под единицей, иначе цвета выцветают
    scene.add(new THREE.HemisphereLight(0xffffff, 0xd8cdbb, 0.34));
    const key = new THREE.DirectionalLight(0xfff4e2, 0.55);
    key.position.set(3.5, 9, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    const d = 11;
    key.shadow.camera.left = -d;
    key.shadow.camera.right = d;
    key.shadow.camera.top = d;
    key.shadow.camera.bottom = -d;
    key.shadow.bias = -0.0012;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xdce8ff, 0.14);
    fill.position.set(-4, 3, -3);
    scene.add(fill);
    scene.add(new THREE.AmbientLight(0xffffff, 0.08));

    Object.assign(st, {
      scene, camera, renderer,
      items: new Map(), ghosts: new Map(), shelves: [], slotMarks: [], dropZones: [], bursts: [],
      raycaster: new THREE.Raycaster(), pointer: new THREE.Vector2(),
      time: 0, drag: null,
    });

    /* --- перетаскивание --- */
    const setPointer = (e) => {
      const r = renderer.domElement.getBoundingClientRect();
      st.pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      st.pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    };
    /* Цель броска — вся полка целиком, а не отдельная площадка.

       Раньше целями были плоские площадки свободных мест. Камера
       смотрит на полки почти горизонтально, поэтому горизонтальная
       площадка видна с ребра и лучом в неё почти не попасть —
       предмет было не поставить. Теперь у каждой полки есть
       невидимый объёмный блок: в него луч попадает под любым углом,
       и бросить можно на любое место полки, как в плоском режиме. */
    const pickShelf = () => {
      st.raycaster.setFromCamera(st.pointer, camera);
      const hit = st.raycaster.intersectObjects(st.dropZones, false)[0];
      if (!hit) return null;
      const si = hit.object.userData.shelfIndex;
      /* Определяем не только полку, но и место на ней: по точке
         попадания луча выбираем ближайшее гнездо. Без этого нельзя
         было подвинуть предмет внутри полки. */
      const sh = st.shelves[si];
      let slot = 0;
      let best = Infinity;
      for (let k = 0; k < SHELF_SLOTS; k++) {
        const x = sh.x + (k - 1) * (st.SP || 0.92);
        const d = Math.abs(hit.point.x - x);
        if (d < best) { best = d; slot = k; }
      }
      return { si, slot };
    };
    const pickItem = () => {
      st.raycaster.setFromCamera(st.pointer, camera);
      const objs = [];
      st.items.forEach((it) => objs.push(it.group));
      const hit = st.raycaster.intersectObjects(objs, true)[0];
      if (!hit) return null;
      let o = hit.object;
      while (o && o.userData.slotRef === undefined) o = o.parent;
      return o ? o.userData.slotRef : null;
    };

    const onDown = (e) => {
      setPointer(e);
      const ref = pickItem();
      if (!ref) return;
      const sh = propsRef.current.board[ref.si];
      if (!sh || sh.locked || !sh.front[ref.slot]) return;
      if (sh.front[ref.slot].pinned) return; // 📌 приклеен к месту
      st.drag = { ...ref, id: sh.front[ref.slot].id };
      renderer.domElement.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e) => {
      if (!st.drag) return;
      setPointer(e);
      // тащим по плоскости перед полками
      st.raycaster.setFromCamera(st.pointer, camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -1.4);
      const hit = new THREE.Vector3();
      if (st.raycaster.ray.intersectPlane(plane, hit)) st.drag.pos = hit;
      st.drag.over = pickShelf();
    };
    const onUp = () => {
      if (!st.drag) return;
      const target = st.drag.over;
      const from = st.drag;
      st.drag = null;
      if (target !== null && target !== undefined) {
        propsRef.current.onDrop(from.si, from.slot, target.si, target.slot);
      }
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      const need = st.frustum || { w: 8, h: 6 };
      const aspect = w / h;
      // вписываем поле целиком: берём больший из двух масштабов
      const half = Math.max(need.h / 2, need.w / 2 / aspect);
      camera.top = half;
      camera.bottom = -half;
      camera.left = -half * aspect;
      camera.right = half * aspect;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
    };
    st.resize = resize;
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const clock = new THREE.Clock();
    let raf;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);
      st.time += dt;
      const t = st.time;

      st.items.forEach((it, id) => {
        const g = it.group;
        const dragging = st.drag && st.drag.id === id;
        if (dragging && st.drag.pos) {
          g.position.lerp(st.drag.pos, 1 - Math.pow(0.001, dt));
          g.rotation.y += dt * 2.2;
          g.scale.setScalar(1.18);
        } else {
          if (it.flight) {
            it.flight.t += dt / it.flight.dur;
            const p = Math.min(1, it.flight.t);
            const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
            g.position.lerpVectors(it.flight.from, it.flight.to, e);
            g.position.y += Math.sin(p * Math.PI) * 0.8;
            if (p >= 1) it.flight = null;
          } else {
            g.position.lerp(it.target, 1 - Math.pow(0.002, dt));
            g.rotation.y = it.baseRotY + Math.sin(t * 1.1 + it.phase) * 0.06;
          }
          if (it.scaleIn < 1) {
            it.scaleIn = Math.min(1, it.scaleIn + dt * 4);
            g.scale.setScalar(it.scaleIn * (1 + 0.25 * Math.sin(it.scaleIn * Math.PI)));
          } else g.scale.setScalar(1);
        }
        if (it.shakeT > 0) {
          it.shakeT -= dt;
          g.position.x += Math.sin(it.shakeT * 60) * 0.06;
        }
      });

      // силуэты в глубине чуть дышат, чтобы читались как объекты
      // силуэты слегка покачиваются, чтобы читались как предметы
      let gi = 0;
      st.ghosts.forEach((gh) => {
        gh.rotation.y = Math.sin(t * 0.7 + gi) * 0.12;
        gi++;
      });

      st.slotMarks.forEach((m, i) => {
        const hot = st.drag && st.drag.over && st.drag.over.si === m.userData.slotRef.si;
        m.material.opacity = m.visible
          ? (hot ? 0.75 : 0.3 + Math.sin(t * 2.2 + i) * 0.1)
          : 0;
      });

      for (let i = st.bursts.length - 1; i >= 0; i--) {
        const b = st.bursts[i];
        b.t += dt;
        const p = b.t / b.dur;
        b.parts.forEach((q) => {
          q.position.addScaledVector(q.userData.v, dt);
          q.userData.v.y -= dt * 4.5;
          q.rotation.x += dt * 6;
          q.material.opacity = Math.max(0, 1 - p);
        });
        if (p >= 1) {
          b.parts.forEach((q) => {
            scene.remove(q);
            q.geometry.dispose();
            q.material.dispose();
          });
          st.bursts.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  /* ---------- сетка полок ---------- */
  useEffect(() => {
    const st = S.current;
    if (!st.scene) return;
    const n = board.length;
    const PER_ROW = 2;
    const rows = Math.ceil(n / PER_ROW);

    st.shelves.forEach((sh) => {
      st.scene.remove(sh.group);
      sh.group.traverse((o) => {
        if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); }
      });
    });
    st.shelves = [];
    st.slotMarks.forEach((m) => {
      st.scene.remove(m);
      m.geometry.dispose();
      m.material.dispose();
    });
    st.slotMarks = [];
    st.dropZones.forEach((z) => {
      st.scene.remove(z);
      z.geometry.dispose();
      z.material.dispose();
    });
    st.dropZones = [];

    /* Смена уровня: предметы прошлого поля больше не нужны.
       Без этого при переходе между уровнями старые меши
       оставались в памяти навсегда. */
    st.items.forEach((it) => {
      st.scene.remove(it.group);
      it.group.traverse((o) => {
        if (!o.isMesh) return;
        o.geometry.dispose();
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
        else o.material.dispose();
      });
    });
    st.items.clear();

    const SP = 0.92;                 // шаг между местами
    const SHELF_W = SP * 3 + 0.45;
    const GX = SHELF_W + 0.5;        // шаг между полками в ряду
    const GY = 1.5;                  // ярусы вниз
    // Все полки на одной глубине. Раньше каждый нижний ряд
    // отодвигался назад, из-за чего нижние полки казались
    // дальше и мельче — читалось как перекос, а не глубина.
    const startY = ((rows - 1) * GY) / 2;

    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / PER_ROW);
      const c = i % PER_ROW;
      const inRow = Math.min(PER_ROW, n - r * PER_ROW);
      const rowStart = -((inRow - 1) * GX) / 2;
      const { group } = makeShelfMesh(WORLD_CRATE[worldKey], SP);
      group.position.set(rowStart + c * GX, startY - r * GY, 0);
      group.traverse((o) => {
        if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
      });
      st.scene.add(group);
      st.shelves.push({ group, x: group.position.x, y: group.position.y, z: group.position.z });

      for (let k = 0; k < SHELF_SLOTS; k++) {
        const mark = new THREE.Mesh(
          new THREE.PlaneGeometry(0.76, 0.76),
          new THREE.MeshBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 0.3, side: THREE.DoubleSide,
            depthWrite: false,
          })
        );
        mark.rotation.x = -Math.PI / 2.6; // наклон к зрителю: плашка плашмя почти не видна
        mark.position.set(
          group.position.x + (k - 1) * SP,
          group.position.y + 0.17,
          group.position.z + 0.05
        );
        mark.userData.slotRef = { si: i, slot: k };
        st.scene.add(mark);
        st.slotMarks.push(mark);
      }

      // невидимый блок-цель на всю полку
      const zone = new THREE.Mesh(
        new THREE.BoxGeometry(SHELF_W + 0.2, 1.05, 1.3),
        new THREE.MeshBasicMaterial({
          transparent: true, opacity: 0, depthWrite: false, colorWrite: false,
        })
      );
      zone.position.set(group.position.x, group.position.y + 0.45, group.position.z);
      zone.userData.shelfIndex = i;
      st.scene.add(zone);
      st.dropZones.push(zone);
    }

    const spanX = PER_ROW * GX + 0.8;
    const spanY = rows * GY + 1.8;
    st.frustum = { w: spanX, h: spanY };

    // Камера стоит под небольшим углом сверху: наклон даёт объём,
    // а ортография не даёт нижним полкам «уезжать» вдаль.
    const D = 20;
    st.camera.position.set(0, D * 0.38, D * 0.92);
    st.camera.lookAt(0, 0, 0);
    if (st.resize) st.resize();

    st.SP = SP;
  }, [board.length, worldKey]);

  /* ---------- предметы и силуэты ---------- */
  useEffect(() => {
    const st = S.current;
    if (!st.scene || !st.shelves.length) return;
    const SP = st.SP || 0.92;

    const posAt = (si, slot) => {
      const sh = st.shelves[si] || st.shelves[0];
      return new THREE.Vector3(sh.x + (slot - 1) * SP, sh.y + 0.58, sh.z + 0.05);
    };
    const ghostPos = (si, slot) => {
      const sh = st.shelves[si] || st.shelves[0];
      return new THREE.Vector3(sh.x + (slot - 1) * SP, sh.y + 0.5, sh.z - 0.42);
    };

    const alive = new Set();
    board.forEach((sh, si) => {
      sh.front.forEach((item, slot) => {
        if (!item) return;
        alive.add(item.id);
        let it = st.items.get(item.id);
        if (!it) {
          const group = makeItemMesh(item.e, item.c);
          const p = posAt(si, slot);
          group.position.copy(p);
          group.scale.setScalar(0.01);
          st.scene.add(group);
          it = {
            group, target: p.clone(), flight: null, scaleIn: 0, shakeT: 0,
            baseRotY: (Math.random() - 0.5) * 0.4, phase: Math.random() * 6.28,
          };
          st.items.set(item.id, it);
        }
        it.group.userData.slotRef = { si, slot };
        const to = posAt(si, slot);
        if (!it.flight && it.target.distanceTo(to) > 0.25) {
          it.flight = { t: 0, dur: 0.32, from: it.group.position.clone(), to: to.clone() };
        }
        it.target.copy(to);
        if (blockedAt === item.id) it.shakeT = 0.3;
      });
    });

    st.items.forEach((it, id) => {
      if (alive.has(id)) return;
      const p = it.group.position.clone();
      const col = new THREE.Color(0xffffff);
      it.group.traverse((o) => {
        if (o.isMesh && o.material.color) col.copy(o.material.color);
      });
      const parts = [];
      for (let k = 0; k < 8; k++) {
        const q = new THREE.Mesh(
          new THREE.TetrahedronGeometry(0.1),
          new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 1 })
        );
        q.position.copy(p);
        q.userData.v = new THREE.Vector3(
          (Math.random() - 0.5) * 3, 1.8 + Math.random() * 2, (Math.random() - 0.5) * 3
        );
        st.scene.add(q);
        parts.push(q);
      }
      st.bursts.push({ t: 0, dur: 0.7, parts });
      /* Освобождаем геометрию и материалы, а не только убираем
         объект со сцены. Иначе за сотни собранных троек и смен
         уровня в памяти видеокарты копится мусор. */
      st.scene.remove(it.group);
      it.group.traverse((o) => {
        if (!o.isMesh) return;
        o.geometry.dispose();
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
        else o.material.dispose();
      });
      st.items.delete(id);
    });

    /* Силуэты тех, кто ждёт в глубине.

       Раньше это были тёмные полупрозрачные кубики на фоне тёмной
       задней стенки — их попросту не было видно, и игрок не знал,
       что в полке есть что-то ещё. Из-за этого уровень казался
       непроходимым: на виду два предмета, третий спрятан.

       Теперь силуэт — настоящая модель предмета, обесцвеченная и
       полупрозрачная: видно, что именно стоит сзади. */
    const wantGhosts = new Set();
    board.forEach((sh, si) => {
      sh.queue.slice(0, SHELF_SLOTS).forEach((q, k) => {
        const gk = `${si}:${k}:${q.mystery ? "?" : q.e}`;
        wantGhosts.add(gk);
        let gh = st.ghosts.get(gk);
        if (!gh) {
          gh = makeItemMesh(q.mystery ? "🎁" : q.e, q.mystery ? "#b08a5a" : q.c);
          gh.scale.setScalar(0.62);
          gh.traverse((o) => {
            if (!o.isMesh) return;
            o.castShadow = false;
            o.receiveShadow = false;
            o.material = o.material.clone();
            o.material.transparent = true;
            o.material.opacity = 0.42;
            o.material.depthWrite = false;
            // обесцвечиваем и высветляем — силуэт, а не полноценный предмет
            if (o.material.color) {
              const c = o.material.color;
              const l = (c.r + c.g + c.b) / 3;
              c.setRGB(
                l * 0.45 + c.r * 0.25 + 0.32,
                l * 0.45 + c.g * 0.25 + 0.32,
                l * 0.45 + c.b * 0.25 + 0.34
              );
            }
            if (o.material.emissive) o.material.emissiveIntensity = 0;
          });
          st.scene.add(gh);
          st.ghosts.set(gk, gh);
        }
        gh.position.copy(ghostPos(si, k));
        gh.visible = true;
      });
    });
    st.ghosts.forEach((gh, k) => {
      if (wantGhosts.has(k)) return;
      st.scene.remove(gh);
      gh.traverse((o) => {
        if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); }
      });
      st.ghosts.delete(k);
    });

    st.slotMarks.forEach((m) => {
      const { si, slot } = m.userData.slotRef;
      const sh = board[si];
      const frozenHere = sh && sh.frozen && sh.frozen[slot];
      m.visible = !!(sh && !sh.locked && sh.front[slot] === null && !frozenHere);
    });
  }, [board, blockedAt]);

  /* Обучению нужна экранная позиция предмета. В 3D нет DOM-узлов,
     поэтому проецируем координаты предмета в пиксели и кладём их
     в невидимые метки — обучение читает их так же, как в 2D. */
  useEffect(() => {
    const st = S.current;
    if (!st.camera || !mountRef.current) return;
    const el = mountRef.current;
    const project = () => {
      const r = el.getBoundingClientRect();
      const out = [];
      board.forEach((sh, si) => {
        sh.front.forEach((item, slot) => {
          if (!item) return;
          const it = st.items.get(item.id);
          if (!it) return;
          const v = it.group.position.clone().project(st.camera);
          out.push({
            key: `${si}:${slot}`,
            x: r.left + ((v.x + 1) / 2) * r.width,
            y: r.top + ((1 - v.y) / 2) * r.height,
          });
        });
      });
      setProjected(out);
    };
    project();
    const id = setInterval(project, 500);
    return () => clearInterval(id);
  }, [board]);

  return (
    <div ref={mountRef} style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* невидимые метки для обучения */}
      {projected.map((p) => (
        <span
          key={p.key}
          data-slot={p.key}
          style={{
            position: "fixed", left: p.x, top: p.y,
            width: 1, height: 1, pointerEvents: "none", opacity: 0,
          }}
        />
      ))}
    </div>
  );
}

/* модель полки: доска, боковины, задняя стенка */
function makeShelfMesh(styleKey, SP) {
  const C = CRATE_3D[styleKey] || CRATE_3D.wood;
  const g = new THREE.Group();
  const W = SP * 3 + 0.45;

  g.add(put(box(W, 0.15, 1.15, C.front), 0, 0, 0));
  g.add(put(box(W, 0.06, 1.2, C.rim), 0, 0.1, 0.02));
  g.add(put(box(W, 0.72, 0.08, C.back), 0, 0.36, -0.58));
  for (const s of [-1, 1]) {
    g.add(put(box(0.1, 0.8, 1.15, C.side), s * (W / 2 - 0.05), 0.4, 0));
  }
  for (const s of [-1, 1]) {
    g.add(put(box(0.09, 0.13, 0.09, C.metal), s * (W / 2 - 0.05), 0.04, 0.5));
  }
  return { group: g };
}
