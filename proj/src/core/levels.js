import { M } from "../world/builders/resort";


/* ============================================================
   СЛОЖНОСТЬ УРОВНЕЙ
   Все материалы лежат в ящиках. Взять можно только верхний
   в стопке — одно правило на весь экран.
   ============================================================ */

/* Соседство: плитка прямо под снятой в той же стопке */
function isNeighbour(a, b) {
  return a.crate === b.crate && Math.abs(a.depth - b.depth) === 1;
}

/* Плитка доступна, если лежит сверху стопки */
function isFree(tile, tiles) {
  for (const o of tiles) {
    if (o.taken || o === tile) continue;
    if (o.crate === tile.crate && o.depth > tile.depth) return false;
  }
  return true;
}

/* ============================================================
   ТИРЫ СЛОЖНОСТИ
   Внутри мира уровни идут вразнобой: лёгкий, обычный, сложный,
   суперсложный. Базовая планка при этом растёт от мира к миру,
   поэтому «лёгкий» в конце игры тяжелее «сложного» в начале.
   ============================================================ */
const TIERS = ["easy", "normal", "hard", "extreme"];

const TIER_MOD = {
  /* size — объём поля, spare — запас мест (минус = теснее),
     types — сколько добавить материалов,
     special — доля осложнений: 0 совсем без них, 1 — полная норма.

     Раньше осложнения включались только на сложных тирах, и 58%
     уровней проходили вообще без механик — отсюда ощущение, что
     игра однообразная. Теперь обычный тир тоже их получает,
     но вполовину слабее. */
  easy:    { size: 0.62, spare: +1, types: -1, ice: 0.0, special: 0 },
  normal:  { size: 0.85, spare: 0,  types: 0,  ice: 0.6, special: 0.5 },
  hard:    { size: 1.0,  spare: 0,  types: 0,  ice: 1.0, special: 1 },
  extreme: { size: 1.15, spare: -1, types: +1, ice: 1.3, special: 1.35 },
};

function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* расклад тиров для мира: доля сложных растёт с номером мира */
/* Раскладка тиров по миру.
   Строим её сразу правильной, а не «перемешать и латать»: встречные
   проходы правок ломали друг друга — разгон выталкивал суперсложный
   в начало, а разведение возвращало его обратно.

   Гарантии по построению:
     • в мягкой зоне начала мира нет сложных уровней;
     • два суперсложных никогда не стоят вплотную;
     • раскладка детерминирована — у всех игроков одинаковая. */
export function worldTiers(worldIdx, count) {
  const w =
    worldIdx === 0
      ? { easy: 5, normal: 3, hard: 2, extreme: 1 }
      : { easy: 3, normal: 4, hard: 3, extreme: 2 };

  const rnd = seeded(worldIdx * 7919 + 13);
  const shuffleSeeded = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // сколько уровней каждого тира
  const total = w.easy + w.normal + w.hard + w.extreme;
  const want = {};
  TIERS.forEach((k) => (want[k] = Math.round((w[k] / total) * count)));
  let sum = TIERS.reduce((acc, k) => acc + want[k], 0);
  while (sum > count) { want.easy > 0 ? want.easy-- : want.normal--; sum--; }
  while (sum < count) { want.normal++; sum++; }

  // мягкая зона начала: только лёгкие и обычные
  const warmup = worldIdx === 0 ? 6 : 2;
  const soft = shuffleSeeded([
    ...Array(want.easy).fill("easy"),
    ...Array(want.normal).fill("normal"),
  ]);
  const heavy = shuffleSeeded([
    ...Array(want.hard).fill("hard"),
    ...Array(want.extreme).fill("extreme"),
  ]);

  const bag = new Array(count).fill(null);
  const softZone = Math.min(warmup, soft.length, count);
  for (let i = 0; i < softZone; i++) bag[i] = soft.shift();

  // суперсложные расставляем с гарантированным зазором
  const freeIdx = [];
  for (let i = softZone; i < count; i++) freeIdx.push(i);
  const extremes = heavy.filter((x) => x === "extreme").length;
  const rest = heavy.filter((x) => x !== "extreme");
  if (extremes > 0 && freeIdx.length) {
    const step = freeIdx.length / extremes;
    for (let k = 0; k < extremes; k++) {
      // ставим в середину своего отрезка — соседи гарантированно свободны
      let pos = freeIdx[Math.min(freeIdx.length - 1, Math.floor(step * k + step / 2))];
      // подстраховка: не встаём рядом с уже поставленным суперсложным
      if (bag[pos - 1] === "extreme" || bag[pos + 1] === "extreme") {
        const alt = freeIdx.find(
          (i) => bag[i] === null && bag[i - 1] !== "extreme" && bag[i + 1] !== "extreme"
        );
        if (alt !== undefined) pos = alt;
      }
      if (bag[pos] === null) bag[pos] = "extreme";
    }
  }

  // остальное заполняем сложными, затем лёгкими и обычными
  const filler = shuffleSeeded([...rest, ...soft]);
  for (let i = 0; i < count; i++) {
    if (bag[i] === null) bag[i] = filler.shift() || "normal";
  }

  // финал мира — испытание, но не в самом первом мире
  if (count > 3 && worldIdx > 0 && bag[count - 1] === "easy") {
    const k = bag.findIndex(
      (x, q) => q >= softZone && q < count - 1 && x === "hard"
    );
    if (k > 0) [bag[count - 1], bag[k]] = [bag[k], bag[count - 1]];
  }
  return bag;
}

/* кривая сложности: globalIdx — сквозной номер уровня во всей игре */
export function levelConfig(globalIdx, tier = "normal") {
  const s = globalIdx;
  const M = TIER_MOD[tier] || TIER_MOD.normal;

  /* --- объём поля --- */
  // материалов: чем больше видов, тем труднее держать полки чистыми
  const types = Math.max(2, Math.min(5, (s < 8 ? 2 : 2 + Math.floor(s / 26)) + M.types));
  const baseTriples = Math.min(4 + Math.floor(s / 8), 12);
  const triples = Math.max(3, Math.min(12, Math.round(baseTriples * M.size)));

  // полки и запас свободных мест — главный ресурс игрока
  const shelves = Math.max(4, Math.min(6, 3 + Math.floor(s / 45)));
  // Запас мест — главный ресурс, и он единственный, что может расти
  // после того, как объём поля упёрся в потолок решаемости.
  const baseSpare = s < 25 ? 4 : s < 200 ? 3 : 2;
  const spare = Math.max(2, baseSpare + M.spare);

  /* --- ОСЛОЖНЕНИЯ --- */

  // 🔒 запертая полка: откроется, когда соберёшь тройку её материала
  const shelfLocks =
    s < 40 ? 0 : Math.round(Math.min(2, 1 + Math.floor((s - 40) / 80)) * M.special);

  // ❄️ обледеневший предмет: растает от тройки указанного материала
  const icePct =
    s < 60 ? 0 : Math.min(0.22, (s - 60) * 0.0022) * M.ice * (M.special > 0 ? 1 : 0);

  // ⭐ джокер: подходит к любому материалу
  const jokers = s < 30 ? 0 : Math.min(2, 1 + Math.floor((s - 30) / 90));

  // 🎁 загадка: содержимое видно, только когда предмет выйдет на витрину
  const mysteryPct =
    s < 90 ? 0 : Math.min(0.2, (s - 90) * 0.0018) * Math.min(1, M.special);

  // 📌 закреплённый предмет: приклеен к месту, унести нельзя.
  // Уедет только в составе тройки, собранной прямо на этой полке
  const pinned =
    s < 120 ? 0 : Math.round(Math.min(3, 1 + Math.floor((s - 120) / 70)) * M.special);

  // ⚖️ полка с лимитом: принимает только один вид материала
  const pickyShelves =
    s < 170 ? 0 : Math.round(Math.min(2, 1 + Math.floor((s - 170) / 110)) * M.special);

  // 🔗 сцепка: два предмета носятся только вместе
  const chains =
    s < 230 ? 0 : Math.round(Math.min(3, 1 + Math.floor((s - 230) / 80)) * M.special);

  return {
    types, triples, shelves, spare,
    shelfLocks, icePct, jokers, mysteryPct, pinned, pickyShelves, chains,
    // старые имена — генератор полок читает их напрямую
    shelfTriples: triples, shelfTypes: types,
    tier,
  };
}


export const shuffled = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};



let tileId = 0;


function generateBoard(cfg, items) {
  const pool = items.slice(0, cfg.types);

  // группы-тройки: слоты назначим при раскладке по ящикам
  const groups = Array.from({ length: cfg.crateTriples }, () => [{}, {}, {}]);
  const typeSeq = shuffled(groups.map((_, i) => pool[i % pool.length]));

  const tiles = [];
  // Ящики набиваем с конца: последняя по решению тройка ложится на дно,
  // первая оказывается сверху — значит, нужное всегда под рукой.
  const stacks = Array.from({ length: cfg.crates }, () => []);
  for (let gi = groups.length - 1; gi >= 0; gi--) {
    const order = shuffled(stacks.map((_, i) => i)).sort(
      (a, b) => stacks[a].length - stacks[b].length
    );
    for (let q = 0; q < 3; q++) stacks[order[q % cfg.crates]].push(gi);
  }
  stacks.forEach((stack, ci) => {
    stack.forEach((gi, di) => {
      const type = typeSeq[gi];
      tiles.push({
        id: tileId++, ...type, crate: ci, depth: di,
        group: gi, ice: 0, lock: 0, taken: false,
      });
    });
  });
  tiles.extent = { w: 1, h: 1 };
  tiles.hasShelf = false;

  const total = groups.length;
  const byGroup = (g) => tiles.filter((t) => t.group === g);
  // группы, материал которых подменён спецплиткой — на них нельзя
  // ссылаться как на «ключ», иначе такую тройку не собрать обычным путём
  const specialGroups = new Set();

  /* --- КЛЮЧ И ЗАМОК: тройка ключей открывает все замки уровня.
     Ключевую группу ставим раньше запертых плиток. --- */
  let keyGroup = -1;
  if (cfg.useKeys && total >= 6) {
    keyGroup = 1 + Math.floor(Math.random() * Math.max(1, Math.floor(total / 3)));
    byGroup(keyGroup).forEach((t) => {
      t.special = "key";
      t.e = "🔑";
      t.c = "#e0b545";
    });
    specialGroups.add(keyGroup);
  }

  /* --- ДЖОКЕР: подставляется к любому материалу.
     Заменяем всю группу целиком, чтобы её тройка складывалась сама. --- */
  if (cfg.jokers > 0 && total >= 6) {
    const free = [];
    for (let g = 2; g < total; g++) if (!specialGroups.has(g)) free.push(g);
    shuffled(free).slice(0, cfg.jokers).forEach((g) => {
      byGroup(g).forEach((t) => {
        t.special = "joker";
        t.e = "⭐";
        t.c = "#f2c144";
      });
      specialGroups.add(g);
    });
  }

  /* --- ЛЁД: тает от тройки материала, указанного на льдине.
     Ключ берём из обычной группы, которая собирается раньше. --- */
  if (cfg.icePct > 0) {
    const plainEarlier = (g) => {
      const opts = [];
      for (let k = 0; k < g; k++) if (!specialGroups.has(k)) opts.push(k);
      return opts.length ? opts[Math.floor(Math.random() * opts.length)] : -1;
    };
    const cand = tiles.filter((t) => t.group >= 1 && !t.special);
    shuffled(cand).slice(0, Math.round(cand.length * cfg.icePct)).forEach((t) => {
      const gk = plainEarlier(t.group);
      if (gk < 0) return;
      t.ice = 1;
      t.iceKey = typeSeq[gk].e;
      t.iceColor = typeSeq[gk].c;
    });
  }

  /* --- ЗАМКИ: вешаем после ключа, только на более поздние группы --- */
  if (keyGroup >= 0) {
    const cand = tiles.filter((t) => t.group > keyGroup && !t.special && !t.ice);
    shuffled(cand).slice(0, cfg.locks * 2).forEach((t) => (t.lock = 1));
  }

  /* --- ВЗРЫВ: тройка с такой плиткой сносит все свободные плитки
     того же материала. Только помогает, решаемость не страдает. --- */
  if (cfg.blasts > 0 && total >= 6) {
    const cand = tiles.filter((t) => t.group >= 3 && !t.special && !t.lock && !t.ice);
    shuffled(cand).slice(0, cfg.blasts).forEach((t) => (t.blast = true));
  }

  /* --- МЕШОК: материал скрыт, пока рядом не уберут соседей --- */
  if (cfg.mysteryPct > 0) {
    const cand = tiles.filter((t) => t.group >= 2 && !t.special && !t.ice);
    shuffled(cand).slice(0, Math.round(cand.length * cfg.mysteryPct)).forEach((t) => {
      t.mystery = 2;
    });
  }

  /* --- НУМЕРОВАННЫЕ: собираются строго по возрастанию.
     Номера раздаём подряд только тем группам, которые реально
     их получили — иначе в последовательности появится дыра. --- */
  if (cfg.numbered > 0 && total >= 10) {
    const step = Math.max(2, Math.floor(total / (cfg.numbered + 1)));
    const picked = [];
    for (let i = 1; i <= cfg.numbered; i++) {
      const g = step * i;
      if (g >= total || specialGroups.has(g)) continue;
      if (byGroup(g).some((t) => t.special)) continue;
      picked.push(g);
    }
    picked.forEach((g, i) => {
      byGroup(g).forEach((t) => {
        t.order = i + 1;
        t.lock = 0;
        t.ice = 0;
        t.mystery = 0;
      });
    });
  }

  /* --- БОМБА: обратный отсчёт ходов. Запас считаем от честного
     решения плюс треть, поэтому вдумчивый игрок всегда успевает. --- */
  if (cfg.bombs > 0 && total >= 10) {
    const g = Math.floor(total * 0.55);
    const t = byGroup(g).find((x) => !x.special && !x.lock && !x.ice && !x.order);
    if (t) t.bomb = Math.ceil((g + 1) * 3 * 1.4) + 6;
  }

  tiles.sealed = shuffled(pool).slice(0, cfg.sealed || 0);
  return tiles;
}

/* Пересдача материалов для буста «перемешать».
   Раздаём заново строго по стопкам: чем глубже плитка, тем позже
   она понадобится — значит, поле остаётся решаемым. */
function reshuffleBoard(tiles, types) {
  const rest = tiles.filter((t) => !t.taken && !t.special);
  if (!rest.length) return [...tiles];

  // собираем стопки заново снизу вверх
  const byCrate = {};
  rest.forEach((t) => (byCrate[t.crate] = byCrate[t.crate] || []).push(t));
  Object.values(byCrate).forEach((st) => st.sort((a, b) => b.depth - a.depth)); // сверху вниз

  // порядок разбора: по очереди снимаем верхние плитки стопок
  const order = [];
  const idx = {};
  Object.keys(byCrate).forEach((k) => (idx[k] = 0));
  let guard = 0;
  while (order.length < rest.length && guard++ < 900) {
    for (const k of Object.keys(byCrate)) {
      if (idx[k] < byCrate[k].length) order.push(byCrate[k][idx[k]++]);
    }
  }

  const seq = shuffled(order.map((_, i) => types[Math.floor(i / 3) % types.length]));
  order.forEach((t, i) => {
    const type = seq[Math.floor(i / 3)] || types[0];
    t.e = type.e;
    t.c = type.c;
  });
  return [...tiles];
}
