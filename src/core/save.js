import { LIFE_REGEN_MS, MAX_LIVES, REGEN_CAP, START_COINS } from "./economy";
import { I18N } from "./i18n";
import { WORLDS } from "../world/worlds";


/* ============================================================
   СОХРАНЕНИЕ ПРОГРЕССА

   Игра живёт в браузере, поэтому прогресс пишем в хранилище
   артефакта. Три вещи здесь важнее всего:

   • Данные могут прийти испорченными — от старой версии игры,
     от ручной правки, от сбоя записи. Поэтому каждое поле
     проверяется по отдельности, и одно битое значение не рушит
     всё сохранение: оно просто заменяется значением по умолчанию.

   • Запись идёт с задержкой. Иначе каждый ход дёргал бы диск:
     за партию это сотни обращений на ровном месте.

   • Жизни восстанавливаются за время отсутствия. Игрок закрыл
     игру с одной жизнью, вернулся через час — должен получить
     свои жизни, а не увидеть ту же единицу.
   ============================================================ */

const SAVE_KEY = "sortbuild:save:v1";
const SAVE_DELAY = 700; // мс тишины перед записью

/* --- чтение с проверкой каждого поля --- */

const asInt = (v, def, min, max) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, Math.round(n)));
};

const asBool = (v, def) => (typeof v === "boolean" ? v : def);

const asIntArray = (v, len, min, max) => {
  const out = Array.from({ length: len }, () => min);
  if (!Array.isArray(v)) return out;
  for (let i = 0; i < len; i++) out[i] = asInt(v[i], min, min, max);
  return out;
};

function sanitizeSave(raw) {
  const d = raw && typeof raw === "object" ? raw : {};
  const worldCount = WORLDS.length;

  // мир и уровень должны существовать в текущей версии игры:
  // после обновления число миров могло измениться
  const world = asInt(d.world, 0, 0, worldCount - 1);
  const stagesInWorld = WORLDS[world].stages.length;

  const progress = asIntArray(d.worldProgress, worldCount, 0, 9999).map((v, i) =>
    Math.min(v, WORLDS[i].stages.length)
  );

  const bought = Array.isArray(d.boughtWorlds)
    ? [...new Set(d.boughtWorlds.map((x) => asInt(x, -1, -1, worldCount - 1)))].filter(
        (x) => x >= 0
      )
    : [];

  return {
    world,
    maxWorld: asInt(d.maxWorld, 0, 0, worldCount - 1),
    level: asInt(d.level, 0, 0, Math.max(0, stagesInWorld - 1)),
    unlocked: asInt(d.unlocked, 0, 0, stagesInWorld),
    worldProgress: progress,
    boughtWorlds: bought,
    started: asBool(d.started, false),

    // ресурсы. Верхняя граница щедрая, но конечная: она защищает
    // от подделанного сохранения с миллиардом монет
    coins: asInt(d.coins, START_COINS, 0, 9999999),
    lives: asInt(d.lives, MAX_LIVES, 0, 999),
    nextLifeAt: d.nextLifeAt ? asInt(d.nextLifeAt, 0, 0, Number.MAX_SAFE_INTEGER) : null,
    unlimitedUntil: asInt(d.unlimitedUntil, 0, 0, Number.MAX_SAFE_INTEGER),

    // настройки
    lang: typeof d.lang === "string" && I18N[d.lang] ? d.lang : null,
    musicVol: asInt((d.musicVol ?? 0.35) * 100, 35, 0, 100) / 100,
    sfxVol: asInt((d.sfxVol ?? 0.6) * 100, 60, 0, 100) / 100,
    hapticsOn: asBool(d.hapticsOn, true),
    view3D: asBool(d.view3D, true),
    tutDone: asBool(d.tutDone, false),
    // какие механики уже объясняли — иначе карточки полезли бы заново
    seenMechanics: Array.isArray(d.seenMechanics)
      ? d.seenMechanics.filter((x) => typeof x === "string").slice(0, 32)
      : [],
  };
}

/* Жизни, накопившиеся пока игра была закрыта.
   Считаем по тому же правилу, что и в игре: одна жизнь за
   интервал, но не выше потолка бесплатного восстановления. */
export function catchUpLives(save, now) {
  if (!save.nextLifeAt || save.lives >= REGEN_CAP) {
    return { lives: save.lives, nextLifeAt: save.lives >= REGEN_CAP ? null : save.nextLifeAt };
  }
  if (now < save.nextLifeAt) return { lives: save.lives, nextLifeAt: save.nextLifeAt };

  const passed = Math.floor((now - save.nextLifeAt) / LIFE_REGEN_MS) + 1;
  const gained = Math.min(passed, REGEN_CAP - save.lives);
  const lives = save.lives + gained;
  return {
    lives,
    nextLifeAt: lives >= REGEN_CAP ? null : save.nextLifeAt + gained * LIFE_REGEN_MS,
  };
}

/* --- запись --- */

let saveTimer = null;
let lastPayload = "";

export function writeSave(data) {
  const json = JSON.stringify(data);
  // не пишем то же самое повторно
  if (json === lastPayload) return;
  lastPayload = json;

  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      if (typeof window !== "undefined" && window.storage) {
        await window.storage.set(SAVE_KEY, json);
      }
    } catch (e) {
      // Сохранение не критично для текущей партии: если хранилище
      // недоступно, игра продолжается, просто без записи прогресса.
    }
  }, SAVE_DELAY);
}

export async function readSave() {
  try {
    if (typeof window === "undefined" || !window.storage) return null;
    const res = await window.storage.get(SAVE_KEY);
    if (!res || !res.value) return null;
    return sanitizeSave(JSON.parse(res.value));
  } catch (e) {
    // Битое или отсутствующее сохранение — начинаем с чистого листа,
    // это лучше, чем падение на старте.
    return null;
  }
}

export async function clearSave() {
  try {
    if (typeof window !== "undefined" && window.storage) {
      await window.storage.delete(SAVE_KEY);
    }
    lastPayload = "";
  } catch (e) {
    /* нечего делать */
  }
}
