import { LIFE_REGEN_MS, MAX_LIVES, REGEN_CAP, START_COINS } from "./economy";
import { I18N } from "./i18n";
import { WORLDS } from "../world/worlds";
import { cloudGet, cloudSet, hasCloud } from "./platform";


/* ============================================================
   СОХРАНЕНИЕ ПРОГРЕССА

   Два уровня хранения, и это не дублирование ради надёжности,
   а разные задачи:

   • localStorage — быстрый, синхронный, всегда под рукой.
     Пишем туда часто: он переживает перезагрузку вкладки и
     работает даже когда платформы нет вообще.

   • Облако Яндекса — переносит прогресс между устройствами.
     Дёргать его часто нельзя: setData ограничен сотней вызовов
     за пять минут, а игра меняет монеты и жизни десятками раз
     за партию. Поэтому в облако уходит не каждое изменение, а
     срез состояния раз в CLOUD_INTERVAL и обязательно в момент
     ухода со страницы.

   Остальное, что здесь важно:

   • Данные могут прийти испорченными — от старой версии игры,
     от ручной правки, от сбоя записи. Поэтому каждое поле
     проверяется по отдельности, и одно битое значение не рушит
     всё сохранение: оно просто заменяется значением по умолчанию.

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
let cloudTimer = null;
let lastPayload = "";      // что последний раз ушло в localStorage
let lastCloudPayload = ""; // что последний раз ушло в облако
let lastCloudAt = 0;

/* Минимальный интервал между записями в облако. Лимит платформы —
   100 запросов за 5 минут; двадцать секунд оставляют огромный
   запас даже при нескольких вкладках. */
const CLOUD_INTERVAL = 20000;

function writeLocal(json) {
  try {
    window.localStorage.setItem(SAVE_KEY, json);
  } catch (e) {
    // Приватный режим, переполненная квота, отключённое хранилище.
    // Партия от этого не должна прерываться.
  }
}

async function writeCloud(json, flush) {
  if (!hasCloud()) return;
  if (json === lastCloudPayload) return;
  const ok = await cloudSet(SAVE_KEY, json, flush);
  if (ok) {
    lastCloudPayload = json;
    lastCloudAt = Date.now();
  }
}

/* Планируем отправку в облако с соблюдением интервала. */
function scheduleCloud(json) {
  if (!hasCloud()) return;
  clearTimeout(cloudTimer);
  const wait = Math.max(0, CLOUD_INTERVAL - (Date.now() - lastCloudAt));
  cloudTimer = setTimeout(() => writeCloud(json, false), wait);
}

export function writeSave(data) {
  const json = JSON.stringify(data);
  // не пишем то же самое повторно
  if (json === lastPayload) return;
  lastPayload = json;

  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    writeLocal(json);
    scheduleCloud(json);
  }, SAVE_DELAY);
}

/* Немедленная запись — на выходе со страницы и в переломных
   точках вроде конца уровня. Ждать здесь нечего: вкладку могут
   закрыть в любой момент, поэтому пишем локально синхронно, а в
   облако отправляем с flush. */
export function flushSave() {
  clearTimeout(saveTimer);
  clearTimeout(cloudTimer);
  if (!lastPayload) return;
  writeLocal(lastPayload);
  writeCloud(lastPayload, true);
}

/* Уход со страницы. visibilitychange ловит сворачивание на
   мобильных, где pagehide часто не приходит вовсе. */
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flushSave);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushSave();
  });
}

/* --- чтение ---
   Облако приоритетнее: игрок мог продвинуться на другом
   устройстве. Локальная копия — запасной вариант, когда
   платформы нет или облако не ответило. */

export async function readSave() {
  let raw = null;

  try {
    const cloud = await cloudGet(SAVE_KEY);
    if (cloud) raw = cloud;
  } catch (e) {
    raw = null;
  }

  if (!raw) {
    try {
      raw = window.localStorage.getItem(SAVE_KEY);
    } catch (e) {
      raw = null;
    }
  }

  if (!raw) return null;

  try {
    const save = sanitizeSave(JSON.parse(raw));
    // синхронизируем «последнее отправленное», чтобы первый же
    // writeSave не погнал в облако то, что там уже лежит
    lastPayload = raw;
    lastCloudPayload = raw;
    return save;
  } catch (e) {
    // Битое сохранение — начинаем с чистого листа, это лучше,
    // чем падение на старте.
    return null;
  }
}

export async function clearSave() {
  clearTimeout(saveTimer);
  clearTimeout(cloudTimer);
  lastPayload = "";
  lastCloudPayload = "";
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch (e) {}
  // В облаке нет удаления ключа — затираем пустым объектом.
  try {
    await cloudSet(SAVE_KEY, "", true);
  } catch (e) {}
}
