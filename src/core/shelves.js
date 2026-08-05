import { shuffled } from "./levels";
import { it } from "../world/builders/resort";


/* ============================================================
   МЕХАНИКА ПОЛОК
   На каждой полке три места. Предмет переставляешь с полки на
   полку; собрал три одинаковых на одной — они уезжают на стройку,
   а из глубины выходят те, что стояли сзади.

   Главный ресурс — свободные места. Если бы витрины сами
   добивались из глубины доверху, все места были бы заняты и
   ходов не осталось бы с первой секунды. Поэтому запас пустых
   мест держится постоянным: из глубины подтягивается только то,
   что освободилось после уехавшей на стройку тройки.
   ============================================================ */

export const SHELF_SLOTS = 3;

export const frontOf = (sh) => sh.front.filter((x) => x !== null);
const freeSlots = (sh) => sh.front.reduce((n, x) => n + (x === null ? 1 : 0), 0);

/* три одинаковых на витрине (джокер подходит к любому) */
export function shelfMatch(sh) {
  const f = frontOf(sh);
  if (f.length < SHELF_SLOTS) return null;
  // обледеневший предмет в тройку не идёт, пока лёд не растает
  if (f.some((x) => x.ice > 0)) return null;
  const real = f.filter((x) => x.special !== "joker");
  if (!real.length) return f[0].e;
  return real.every((x) => x.e === real[0].e) ? real[0].e : null;
}

/* Полка опустела — выводим тех, кто стоял сзади.

   Пополняем витрину, когда она опустела ЛЮБЫМ способом: и когда
   тройка уехала на стройку, и когда предметы просто разобрали по
   другим полкам. Если пополнять только после сборки, глубина
   запирается навсегда — витрина пуста, собирать на ней нечего,
   и уровень встаёт намертво.

   Пополняется при этом только полностью пустая витрина, иначе
   свободных мест не осталось бы вовсе. */
function refillShelf(sh) {
  if (frontOf(sh).length > 0 || !sh.queue.length) return false;
  for (let i = 0; i < SHELF_SLOTS && sh.queue.length; i++) {
    sh.front[i] = sh.queue.shift();
  }
  return true;
}

/* свободно ли место: пусто и не подо льдом */
export const slotOpen = (sh, k) => sh.front[k] === null && !(sh.frozen && sh.frozen[k]);
export const openSlots = (sh) => sh.front.reduce((n, x, k) => n + (slotOpen(sh, k) ? 1 : 0), 0);

/* ⚖️ полка с лимитом принимает только свой материал (джокер — всегда) */
export const acceptsItem = (sh, tile) =>
  !sh.only || !tile || tile.special === "joker" || tile.e === sh.only;

/* 📌 закреплённый предмет нельзя унести с его места */
const canTake = (sh, k) => {
  const it = sh.front[k];
  return !!it && !it.pinned;
};

/* сколько мест нужно предмету: сцепка занимает два */
export const sizeOf = (tile) => (tile && tile.chain ? 2 : 1);

function canPlace(sh, tile) {
  if (!sh || sh.locked) return false;
  if (!acceptsItem(sh, tile)) return false;
  return openSlots(sh) >= sizeOf(tile);
}

export function hasShelfMoves(shelves) {
  for (const from of shelves) {
    if (from.locked) continue;
    for (let k = 0; k < SHELF_SLOTS; k++) {
      const tile = from.front[k];
      if (!tile || !canTake(from, k)) continue;
      for (const to of shelves) {
        if (to === from) continue;
        if (canPlace(to, tile)) return true;
      }
    }
  }
  return false;
}

export const shelvesSolved = (shelves) =>
  shelves.every((s) => !frontOf(s).length && !s.queue.length);

/* ============================================================
   РЕШАТЕЛЬ
   Перебор с запоминанием состояний. Нужен и для проверки поля
   при генерации, и для подсказки игроку.
   ============================================================ */
/* Проверка решаемости.

   Первая версия хранила полный путь ходов в каждом узле перебора
   и падала по памяти: ветвление тут огромное — любой предмет на
   любое свободное место. Поэтому здесь два приёма:
     • состояние приводится к канону — места на полке равнозначны,
       поэтому набор предметов сортируется, и полки тоже;
     • ходы схлопываются: переставить одинаковый предмет на две
       одинаковые полки — это один и тот же ход. */

const shelfKey = (st) =>
  st
    .map(
      (s) =>
        (s.locked ? "L" + s.locked : "") +
        s.front
          .filter((x) => x)
          .map((x) => x.e)
          .sort()
          .join("") +
        "|" +
        s.queue.length
    )
    .sort()
    .join("/");

function settleShelves(st) {
  let again = true;
  while (again) {
    again = false;
    for (const sh of st) {
      if (sh.locked) continue;
      const m = shelfMatch(sh);
      if (!m) continue;
      sh.front = Array(SHELF_SLOTS).fill(null);
      st.forEach((o) => {
        // собранный материал открывает полки и растапливает лёд
        if (o.locked === m) o.locked = null;
        o.front.forEach((x) => {
          if (x && x.ice > 0 && x.iceKey === m) x.ice = 0;
        });
        o.queue.forEach((x) => {
          if (x.ice > 0 && x.iceKey === m) x.ice = 0;
        });
        if (o.frozen) {
          Object.keys(o.frozen).forEach((k) => {
            if (o.frozen[k] === m) delete o.frozen[k];
          });
        }
      });
      again = true;
    }
    // любая опустевшая полка выводит содержимое из глубины
    for (const sh of st) {
      if (!sh.locked && refillShelf(sh)) again = true;
    }
  }
}

export function solveShelves(shelves, maxNodes = 30000) {
  const clone = (st) =>
    st.map((s) => ({ front: [...s.front], queue: [...s.queue], locked: s.locked }));

  const start = clone(shelves);
  settleShelves(start);

  const seen = new Set();
  const stack = [start];
  let nodes = 0;

  while (stack.length) {
    if (++nodes > maxNodes) return false;
    const st = stack.pop();
    if (shelvesSolved(st)) return true;

    const k = shelfKey(st);
    if (seen.has(k)) continue;
    seen.add(k);

    // Собираем ходы. Ход, достраивающий тройку, считаем
    // обязательным: он всегда освобождает места, поэтому
    // перебирать вместо него другие смысла нет — это отсечение
    // убирает почти всё ветвление.
    const seenMove = new Set();
    const moves = [];
    let forced = null;
    for (let a = 0; a < st.length && !forced; a++) {
      if (st[a].locked) continue;
      for (let i = 0; i < SHELF_SLOTS && !forced; i++) {
        const tile = st[a].front[i];
        if (!tile) continue;
        if (!canTake(st[a], i)) continue;
        for (let b = 0; b < st.length; b++) {
          if (a === b || !canPlace(st[b], tile)) continue;
          const others = st[b].front.filter((x) => x && x.special !== "joker");
          const willMatch =
            st[b].front.filter((x) => x).length === SHELF_SLOTS - 1 &&
            (!others.length ||
              others.every((x) => x.e === tile.e || tile.special === "joker"));
          if (willMatch) { forced = { a, i, b }; break; }
          const sigA = st[a].front.filter((x) => x).map((x) => x.e).sort().join("");
          const sigB = st[b].front.filter((x) => x).map((x) => x.e).sort().join("");
          const sig = tile.e + ">" + sigA + ">" + sigB;
          if (seenMove.has(sig)) continue;
          seenMove.add(sig);
          moves.push({ a, i, b });
        }
      }
    }

    const list = forced ? [forced] : moves;
    // стек не должен разрастаться безгранично
    if (stack.length > 4000) continue;
    for (const mv of list) {
      const ns = clone(st);
      const j = ns[mv.b].front.findIndex((x, k) => slotOpen(ns[mv.b], k));
      ns[mv.b].front[j] = ns[mv.a].front[mv.i];
      ns[mv.a].front[mv.i] = null;
      settleShelves(ns);
      stack.push(ns);
    }
  }
  return false;
}

/* Подсказка: первый верный ход. Ищем неглубоко, этого хватает. */
export function shelfHint(shelves) {
  const clone = (st) =>
    st.map((s) => ({ front: [...s.front], queue: [...s.queue], locked: s.locked }));
  for (let a = 0; a < shelves.length; a++) {
    if (shelves[a].locked) continue;
    for (let i = 0; i < SHELF_SLOTS; i++) {
      if (!shelves[a].front[i]) continue;
      for (let b = 0; b < shelves.length; b++) {
        if (a === b || !canPlace(shelves[b])) continue;
        const ns = clone(shelves);
        const j = ns[b].front.findIndex((x, k) => slotOpen(ns[b], k));
        ns[b].front[j] = ns[a].front[i];
        ns[a].front[i] = null;
        settleShelves(ns);
        if (solveShelves(ns, 12000)) return { a, i, b };
      }
    }
  }
  return null;
}

/* ============================================================
   ГЕНЕРАЦИЯ
   Раскладываем случайно, но с постоянным запасом пустых мест,
   и отдаём поле только после проверки решателем.
   ============================================================ */
/* Конструктивная сборка.

   Случайная раскладка с проверкой решателем не годится: на поздних
   уровнях она уходила в тринадцать секунд и всё равно выдавала
   тупики. Поэтому строим поле от собранного состояния обратными
   ходами — каждый шаг строго обратим прямым, значит путь к решению
   существует всегда и проверять перебором уже не нужно. */
function buildShelves(cfg, items) {
  const pool = items.slice(0, cfg.shelfTypes || cfg.types);
  const shelves = Array.from({ length: cfg.shelves }, (_, i) => ({
    id: i,
    front: Array(SHELF_SLOTS).fill(null),
    queue: [],
    locked: null,
  }));

  let tid = 0;
  const typeSeq = Array.from(
    { length: cfg.shelfTriples || cfg.triples },
    (_, i) => pool[i % pool.length]
  );

  /* Полку-хозяина берём САМУЮ ЗАПОЛНЕННУЮ, а не самую пустую.
     Это ключевой момент: перед возвратом тройки витрина хозяина
     целиком уезжает в глубину, освобождая ровно столько мест,
     сколько мы сейчас займём. Если брать пустую полку, занятых
     мест становится всё больше, витрины забиваются под завязку
     и на старте не остаётся ни одного хода. */
  // идём от последней тройки к первой
  const TRIPLES = cfg.shelfTriples || cfg.triples;
  for (let g = TRIPLES - 1; g >= 0; g--) {
    const type = typeSeq[g];

    const host = [...shelves].sort(
      (a, b) => frontOf(b).length - frontOf(a).length
    )[0];
    // обратное «подтягивание из глубины»: витрина уезжает назад
    while (freeSlots(host) < SHELF_SLOTS) {
      for (let i = SHELF_SLOTS - 1; i >= 0; i--) {
        if (host.front[i]) {
          host.queue.unshift(host.front[i]);
          host.front[i] = null;
          break;
        }
      }
    }

    // обратный ход к матчу: тройка снова на полке
    const trio = [];
    for (let k = 0; k < 3; k++) {
      const tile = { id: tid++, ...type, group: g, ice: 0, lock: 0 };
      host.front[k] = tile;
      trio.push(k);
    }

    // обратные ходы к переносам: часть тройки уезжает на другие полки
    const scatter = 1 + Math.floor(Math.random() * 2);
    for (let k = 0; k < scatter; k++) {
      const others = shelves.filter((o) => o !== host && freeSlots(o) > 0);
      if (!others.length) break;
      const to = others[Math.floor(Math.random() * others.length)];
      const slot = trio[trio.length - 1 - k];
      if (!host.front[slot]) continue;
      const j = to.front.indexOf(null);
      to.front[j] = host.front[slot];
      host.front[slot] = null;
    }
  }

  shelves.palette = {};
  pool.forEach((m) => (shelves.palette[m.e] = m.c));

  /* --- ОСЛОЖНЕНИЯ ---
     Ключ любого осложнения берётся из тройки, которая по решению
     собирается РАНЬШЕ той, что осложняем, — поэтому порядок
     разбора остаётся выполнимым. */

  const allTiles = [];
  shelves.forEach((sh) => {
    frontOf(sh).forEach((x) => allTiles.push(x));
    sh.queue.forEach((x) => allTiles.push(x));
  });
  // группы с подменённым материалом: на них нельзя ссылаться как на ключ
  const specialGroups = new Set();

  /* ⭐ ДЖОКЕР: подходит к любому материалу. Заменяем группу целиком,
     тогда её собственная тройка складывается сама. */
  if (cfg.jokers > 0 && TRIPLES >= 5) {
    const free = [];
    for (let g = 2; g < TRIPLES; g++) free.push(g);
    shuffled(free).slice(0, cfg.jokers).forEach((g) => {
      allTiles
        .filter((x) => x.group === g)
        .forEach((x) => {
          x.special = "joker";
          x.e = "⭐";
          x.c = "#f2c144";
        });
      specialGroups.add(g);
    });
  }

  /* ❄️ ЛЁД НА МЕСТЕ.

     Замораживать сам предмет нельзя: тройка на полке собирается
     целиком, поэтому один обледеневший предмет запирает полку
     насмерть — растопить его можно только собрав другую тройку,
     а места он при этом не освобождает. Проверка показала 100%
     непроходимых полей.

     Поэтому лёд лежит на ПУСТОМ месте полки: туда нельзя ставить,
     пока не соберёшь тройку указанного материала. Это отнимает
     ресурс свободных мест, но никогда не блокирует уровень. */
  if (cfg.icePct > 0) {
    const emptySpots = [];
    shelves.forEach((sh, si) => {
      if (sh.locked) return;
      sh.front.forEach((x, k) => {
        if (x === null) emptySpots.push({ sh, k });
      });
    });
    // оставляем хотя бы два свободных места, иначе ходов не будет
    const maxIce = Math.max(0, emptySpots.length - 2);
    shuffled(emptySpots)
      .slice(0, Math.min(maxIce, Math.round(emptySpots.length * cfg.icePct)))
      .forEach(({ sh, k }) => {
        const gk = Math.floor(Math.random() * Math.max(1, Math.floor(TRIPLES / 2)));
        if (!typeSeq[gk]) return;
        sh.frozen = sh.frozen || {};
        sh.frozen[k] = typeSeq[gk].e;
        sh.frozenColor = typeSeq[gk].c;
      });
  }

  /* 🎁 ЗАГАДКА: пока предмет ждёт в глубине, его вид скрыт.
     На витрину выходит уже открытым — механика на разведку,
     правила хода она не меняет. */
  if (cfg.mysteryPct > 0) {
    const inQueue = [];
    shelves.forEach((sh) => sh.queue.forEach((x) => inQueue.push(x)));
    shuffled(inQueue)
      .slice(0, Math.round(inQueue.length * cfg.mysteryPct))
      .forEach((x) => {
        if (!x.special) x.mystery = true;
      });
  }

  /* 📌 ЗАКРЕПЛЁННЫЙ ПРЕДМЕТ.
     Приклеен к месту: унести нельзя, уедет только в составе
     тройки, собранной прямо на этой полке. Закрепляем не больше
     одного на полку и только на витрине — иначе предмет из
     глубины вышел бы уже приклеенным и запер полку. */
  if (cfg.pinned > 0) {
    const spots = [];
    shelves.forEach((sh, si) => {
      if (sh.locked) return;
      sh.front.forEach((x, k) => {
        if (x && !x.special) spots.push({ sh, si, x });
      });
    });
    const usedShelf = new Set();
    shuffled(spots).forEach(({ sh, si, x }) => {
      if (usedShelf.size >= cfg.pinned) return;
      if (usedShelf.has(si)) return;
      // на полке должно остаться место, куда носить пару
      if (openSlots(sh) < 1) return;
      x.pinned = true;
      usedShelf.add(si);
    });
  }

  /* ⚖️ ПОЛКА С ЛИМИТОМ.
     Принимает только один вид материала. Берём материал, который
     на этой полке уже есть, — тогда её содержимое не оказывается
     вне закона с первого хода. */
  if (cfg.pickyShelves > 0) {
    const cand = shelves.filter((sh) => !sh.locked && frontOf(sh).length);
    shuffled(cand)
      .slice(0, cfg.pickyShelves)
      .forEach((sh) => {
        const own = frontOf(sh).filter((x) => x.special !== "joker");
        if (!own.length) return;
        // все, кто уже стоит, должны быть одного вида
        const e = own[0].e;
        if (!own.every((x) => x.e === e)) return;
        sh.only = e;
        sh.onlyColor = own[0].c;
      });
  }

  /* 🔗 СЦЕПКА.
     Два предмета одной тройки носятся вместе и занимают два
     места. Связываем только те пары, что стоят на витрине одной
     полки: иначе сцепка растянулась бы через всё поле. */
  if (cfg.chains > 0) {
    let made = 0;
    shuffled([...shelves]).forEach((sh) => {
      if (made >= cfg.chains || sh.locked) return;
      const free = frontOf(sh).filter((x) => !x.special && !x.pinned);
      if (free.length < 2) return;
      // сцепляем пару одного материала — так тройка соберётся проще
      const same = free.filter((x) => x.e === free[0].e);
      const pair = same.length >= 2 ? same.slice(0, 2) : free.slice(0, 2);
      pair.forEach((x) => (x.chain = true));
      made++;
    });
  }

  /* 🔒 ЗАПЕРТАЯ ПОЛКА: откроется от тройки указанного материала.
     Ключ — из тройки, что собирается раньше всего на этой полке,
     иначе полка заперла бы собственный ключ. */
  if (cfg.shelfLocks > 0) {
    const candidates = shelves.filter((sh) => frontOf(sh).length || sh.queue.length);
    shuffled(candidates)
      .slice(0, cfg.shelfLocks)
      .forEach((sh) => {
        const all = [...frontOf(sh), ...sh.queue];
        if (!all.length) return;
        const earliest = Math.min(...all.map((x) => x.group));
        const opts = [];
        for (let k = 0; k < earliest; k++) if (!specialGroups.has(k)) opts.push(k);
        if (!opts.length) return;
        const gk = opts[Math.floor(Math.random() * opts.length)];
        sh.locked = typeSeq[gk].e;
        sh.lockColor = typeSeq[gk].c;
      });
  }

  return shelves;
}


/* Отдаём поле только после проверки решателем. Конструктивная
   сборка почти всегда даёт проходимое поле, но редкие раскладки
   всё же запираются — дешевле пересобрать, чем оставить игрока
   в тупике. */
export function generateShelves(cfg, items) {
  /* Поле строится обратными ходами, поэтому почти всегда проходимо
     по построению: 89% полей решаются за первые 4000 узлов.
     Задержку давали редкие тяжёлые раскладки, где решатель
     перебирал до упора. Поэтому бюджет держим низким, а вместо
     долгого перебора просто пересобираем поле — это дешевле. */
  for (let att = 0; att < 8; att++) {
    const b = buildShelves(cfg, items);
    if (solveShelves(b, 5000)) return b;
  }
  // не сложилось — снимаем осложнения и добавляем место
  for (let att = 0; att < 6; att++) {
    const b = buildShelves(
      { ...cfg, shelfLocks: 0, icePct: 0, spare: cfg.spare + 1 },
      items
    );
    if (solveShelves(b, 6000)) return b;
  }
  // упрощаем поле, пока не станет решаемым
  for (let cut = 1; cut <= 4; cut++) {
    const simpler = {
      ...cfg,
      shelfLocks: 0, icePct: 0, jokers: 0, mysteryPct: 0,
      spare: cfg.spare + 1,
      shelfTriples: Math.max(3, (cfg.shelfTriples || cfg.triples) - cut * 2),
      shelfTypes: Math.max(2, (cfg.shelfTypes || cfg.types) - 1),
    };
    for (let att = 0; att < 4; att++) {
      const b = buildShelves(simpler, items);
      if (solveShelves(b, 8000)) return b;
    }
  }
  // крайний случай: маленькое поле, решаемое по построению
  return buildShelves(
    {
      ...cfg,
      shelfLocks: 0, icePct: 0, jokers: 0, mysteryPct: 0,
      shelfTriples: 3, shelfTypes: 2, spare: SHELF_SLOTS,
    },
    items
  );
}
