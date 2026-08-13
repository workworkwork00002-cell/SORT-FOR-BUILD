import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Board2D } from "./board/Board2D";
import { Board3D } from "./board/Board3D";
import { createAudio } from "./core/audio";
import { BOOST_COST, BUNDLE_ALL, IAP_COINS, IAP_LIVES, LIFE_OFFERS, LIFE_REGEN_MS, MAX_LIVES, REGEN_CAP, START_COINS, fmtTime, worldPrice } from "./core/economy";
import { UI } from "./core/geometry";
import { createHaptics } from "./core/haptics";
import { LANGS, detectLang, isRTL, makeT } from "./core/i18n";
import { levelConfig, worldTiers } from "./core/levels";
import { catchUpLives, clearSave, readSave, writeSave } from "./core/save";
import { SHELF_SLOTS, acceptsItem, frontOf, generateShelves, hasShelfMoves, openSlots, shelfHint, shelfMatch, shelvesSolved, sizeOf, slotOpen, solveShelves } from "./core/shelves";
import { MechanicCard, TUTORIAL_STEPS, TutorialHint, firstNewMechanic, tutorialTarget } from "./ui/Tutorial";
import { Plot } from "./world/Plot";
import { TOTAL_LEVELS, WORLDS } from "./world/worlds";


/* ============================================================
   ИГРОВАЯ ЛОГИКА
   ============================================================ */

const VIEWS = [
  { key: "front", theta: Math.PI / 2, phi: 1.34, zoom: 1 },
  { key: "side", theta: 0, phi: 1.34, zoom: 1 },
  { key: "back", theta: -Math.PI / 2, phi: 1.34, zoom: 1 },
  { key: "top", theta: Math.PI / 2, phi: 0.62, zoom: 1 },
  { key: "wide", theta: Math.PI / 2 - 0.7, phi: 1.15, zoom: 1.08 },
];

/* Схлопывание подноса: убирается только ряд из трёх ОДИНАКОВЫХ ПОДРЯД.
   После удаления соседи смыкаются, поэтому возможны цепочки. */
/* Схлопывание подноса: убирается ряд из трёх ОДИНАКОВЫХ ПОДРЯД.
   Джокер подставляется к любому материалу. После удаления
   соседи смыкаются, поэтому возможны цепочки. */
function collapseTray(tray) {
  let t = [...tray];
  const cleared = [];
  let again = true;
  while (again) {
    again = false;
    for (let i = 0; i + 2 < t.length; i++) {
      const trio = [t[i], t[i + 1], t[i + 2]];
      const real = trio.filter((x) => x.special !== "joker");
      if (real.length === 0 || real.every((x) => x.e === real[0].e)) {
        cleared.push({ e: real.length ? real[0].e : "*", tiles: trio });
        t.splice(i, 3);
        again = true;
        break;
      }
    }
  }
  return { tray: t, cleared };
}

/* сквозной номер уровня во всей игре — по нему считается сложность */
function globalIndex(world, level) {
  let n = 0;
  for (let i = 0; i < world; i++) n += WORLDS[i].stages.length;
  return n + level;
}

/* расклад тиров считается один раз на мир и дальше берётся из кэша */
const TIER_CACHE = WORLDS.map((w, i) => worldTiers(i, w.stages.length));
const tierOf = (world, level) => TIER_CACHE[world][level] || "normal";

const TIER_STYLE = {
  easy:    { color: "#4fa83c", dots: 1 },
  normal:  { color: "#d0a03f", dots: 2 },
  hard:    { color: "#d0703f", dots: 3 },
  extreme: { color: "#c4383c", dots: 4 },
};

export default function SortAndBuild3D() {
  // Прогресс подгружается асинхронно, поэтому до его прихода
  // игра показывает заставку — иначе игрок успел бы нажать
  // «Начать» и перезаписать своё сохранение чистым состоянием.
  const [loaded, setLoaded] = useState(false);
  const [screen, setScreen] = useState("menu");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lang, setLang] = useState(detectLang);
  const [musicVol, setMusicVol] = useState(0.35);
  const [sfxVol, setSfxVol] = useState(0.6);
  const [hapticsOn, setHapticsOn] = useState(true);
  const [view3D, setView3D] = useState(true); // 3D-модели или плоские эмодзи
  const [tutStep, setTutStep] = useState(0);  // шаг обучения на первом уровне
  const [tutDone, setTutDone] = useState(false);
  const [seenMechanics, setSeenMechanics] = useState([]); // какие механики уже объяснили
  const [mechCard, setMechCard] = useState(null);
  const [resetArmed, setResetArmed] = useState(false); // подтверждение сброса
  const [tutRect, setTutRect] = useState(null); // куда показывать палец
  const [started, setStarted] = useState(false);

  const [world, setWorld] = useState(0);
  const [maxWorld, setMaxWorld] = useState(0);
  const [boughtWorlds, setBoughtWorlds] = useState([]); // миры, открытые за деньги
  // сколько объектов построено в каждом мире — нужно для галереи
  const [worldProgress, setWorldProgress] = useState(() => WORLDS.map(() => 0));
  const [viewWorld, setViewWorld] = useState(0); // мир, который сейчас осматриваем
  const [level, setLevel] = useState(0);
  const [unlocked, setUnlocked] = useState(0);

  const [cfg, setCfg] = useState(() => levelConfig(0, tierOf(0, 0)));
  const [board, setBoard] = useState(() =>
    generateShelves(levelConfig(0, tierOf(0, 0)), WORLDS[0].stages[0].items)
  );
  const [history, setHistory] = useState([]);  // для отката хода
  const [matches, setMatches] = useState(0);
  const [moves, setMoves] = useState(0);
  const [extraShelves, setExtraShelves] = useState(0);
  const [justMatched, setJustMatched] = useState([]); // полки, где только что собралось
  const [blockedAt, setBlockedAt] = useState(null);
  const [lives, setLives] = useState(MAX_LIVES);
  const [coins, setCoins] = useState(START_COINS);
  const [nextLifeAt, setNextLifeAt] = useState(null);   // когда придёт следующая жизнь
  const [unlimitedUntil, setUnlimitedUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [shake, setShake] = useState(false);
  const [modal, setModal] = useState(null);
  const [adLoading, setAdLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [hint, setHint] = useState(null);

  const lock = useRef(false);
  const camRef = useRef(null);
  const audioRef = useRef(null);
  if (!audioRef.current) audioRef.current = createAudio();
  const audio = audioRef.current;
  const hapticRef = useRef(null);
  if (!hapticRef.current) hapticRef.current = createHaptics();
  const haptic = hapticRef.current;

  // makeT подставляет английский текст там, где перевода нет,
  // поэтому новый ключ никогда не появится на экране пустым
  const t = useMemo(() => makeT(lang), [lang]);
  const rtl = isRTL(lang);
  const stages = WORLDS[world].stages;
  const stage = stages[Math.min(level, stages.length - 1)];
  const totalItems = board.reduce((n, sh) => n + frontOf(sh).length + sh.queue.length, 0);
  const startItems = (cfg.shelfTriples || cfg.triples) * 3;
  const progress = startItems ? 1 - totalItems / startItems : 0;
  const freeTotal = board.reduce((n, sh) => n + (sh.locked ? 0 : openSlots(sh)), 0);
  const wName = (w) => t.worlds[WORLDS[w].key];
  const sName = (s) => (t.stages[s.key] || s.key) + (s.n ? " " + s.n : "");
  const gIdx = globalIndex(world, level);
  const isBuilt = (i) => worldProgress[i] >= WORLDS[i].stages.length;
  const builtCount = worldProgress.filter((_, i) => isBuilt(i)).length;

  useEffect(() => { audio.setMusic(musicVol); }, [musicVol, audio]);
  useEffect(() => { audio.setSfx(sfxVol); }, [sfxVol, audio]);
  useEffect(() => { haptic.setEnabled(hapticsOn); }, [hapticsOn, haptic]);

  /* ---------- загрузка прогресса ---------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      const save = await readSave();
      if (!alive) return;
      if (save) {
        setWorld(save.world);
        setMaxWorld(save.maxWorld);
        setLevel(save.level);
        setUnlocked(save.unlocked);
        setWorldProgress(save.worldProgress);
        setBoughtWorlds(save.boughtWorlds);
        setStarted(save.started);
        setCoins(save.coins);
        setUnlimitedUntil(save.unlimitedUntil);
        setMusicVol(save.musicVol);
        setSfxVol(save.sfxVol);
        setHapticsOn(save.hapticsOn);
        setView3D(save.view3D);
        setTutDone(save.tutDone);
        setSeenMechanics(save.seenMechanics);
        if (save.lang) setLang(save.lang);

        // жизни, накопившиеся пока игра была закрыта
        const caught = catchUpLives(save, Date.now());
        setLives(caught.lives);
        setNextLifeAt(caught.nextLifeAt);

        // восстанавливаем поле того уровня, на котором остановились
        const c = levelConfig(globalIndex(save.world, save.level), tierOf(save.world, save.level));
        const st = WORLDS[save.world].stages[Math.min(save.level, WORLDS[save.world].stages.length - 1)];
        setCfg(c);
        setBoard(generateShelves(c, st.items));
      }
      setLoaded(true);
    })();
    return () => { alive = false; };
  }, []);

  /* ---------- запись прогресса ----------
     Пишем только после загрузки, иначе первый же рендер затёр бы
     сохранение значениями по умолчанию. */
  useEffect(() => {
    if (!loaded) return;
    writeSave({
      world, maxWorld, level, unlocked, worldProgress, boughtWorlds, started,
      coins, lives, nextLifeAt, unlimitedUntil,
      lang, musicVol, sfxVol, hapticsOn, view3D, tutDone, seenMechanics,
    });
  }, [
    loaded, world, maxWorld, level, unlocked, worldProgress, boughtWorlds, started,
    coins, lives, nextLifeAt, unlimitedUntil,
    lang, musicVol, sfxVol, hapticsOn, view3D, tutDone, seenMechanics,
  ]);
  useEffect(() => () => audio.stopMusic(), [audio]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 1500);
    return () => clearTimeout(id);
  }, [toast]);

  // тик раз в секунду: обновляет обратный отсчёт и начисляет жизни
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const unlimited = unlimitedUntil > now;

  useEffect(() => {
    // сверх потолка восстановление не работает — только покупки
    if (lives >= REGEN_CAP) {
      if (nextLifeAt) setNextLifeAt(null);
      return;
    }
    if (!nextLifeAt) {
      setNextLifeAt(Date.now() + LIFE_REGEN_MS);
      return;
    }
    if (now >= nextLifeAt) {
      // могло пройти несколько интервалов, пока игра была свёрнута
      const passed = Math.floor((now - nextLifeAt) / LIFE_REGEN_MS) + 1;
      const gained = Math.min(passed, REGEN_CAP - lives);
      setLives((l) => Math.min(REGEN_CAP, l + gained));
      setNextLifeAt(gained + lives >= REGEN_CAP ? null : nextLifeAt + gained * LIFE_REGEN_MS);
    }
  }, [now, lives, nextLifeAt]);

  const spendLife = () => {
    if (unlimited) return true;
    if (lives <= 0) return false;
    setLives((l) => l - 1);
    return true;
  };

  // Начисление за просмотр рекламы добивает только до потолка,
  // а покупка складывается сверху — иначе пак из 10 сердец при
  // потолке 5 сгорал бы почти целиком.
  const addLives = (n) => setLives((l) => Math.min(REGEN_CAP, l + n));
  const addLivesBought = (n) => setLives((l) => l + n);
  useEffect(() => {
    if (!hint) return;
    const id = setTimeout(() => setHint(null), 1400);
    return () => clearTimeout(id);
  }, [hint]);

  const restart = useCallback((w, lvl) => {
    const c = levelConfig(globalIndex(w, lvl), tierOf(w, lvl));
    const st = WORLDS[w].stages[Math.min(lvl, WORLDS[w].stages.length - 1)];
    setCfg(c);
    setBoard(generateShelves(c, st.items));
    setHistory([]);
    setMatches(0);
    setMoves(0);
    setExtraShelves(0);
    setJustMatched([]);
    lock.current = false;
  }, []);

  const beginGame = () => {
    audio.unlock();
    audio.startMusic();
    setStarted(true);
    setScreen("game");
  };

  const isWorldOpen = (w) => w <= maxWorld || boughtWorlds.includes(w);

  // покупка мира: в прототипе выдаём сразу,
  // в релизе здесь вызывается платёжный SDK стора
  const buyWorld = (w) => {
    setBoughtWorlds((b) => (b.includes(w) ? b : [...b, w]));
    audio.complete();
    haptic.buy();
    setToast(t.worldUnlocked);
  };

  const buyAllWorlds = () => {
    setBoughtWorlds(WORLDS.map((_, i) => i));
    audio.complete();
    setToast(t.worldUnlocked);
  };

  const enterWorld = (w) => {
    if (!isWorldOpen(w)) return;
    audio.unlock();
    audio.startMusic();
    setWorld(w);
    setLevel(0);
    setUnlocked(0);
    restart(w, 0);
    setStarted(true);
    setModal(null);
    setScreen("game");
  };

  /* ---------- ход: выбрал ящик-источник, затем приёмник ---------- */
  /* ---------- ход: выбрал предмет, затем полку ---------- */
  const applyBoard = (mutate) => {
    setBoard((b) => {
      const nb = b.map((sh) => ({
        ...sh,
        front: [...sh.front],
        queue: [...sh.queue],
      }));
      mutate(nb);

      // собранные тройки уезжают на стройку
      const fresh = [];
      let again = true;
      let cleared = 0;
      while (again) {
        again = false;
        nb.forEach((sh, i) => {
          if (sh.locked) return;
          const m = shelfMatch(sh);
          if (!m) return;
          sh.front = Array(SHELF_SLOTS).fill(null);
          fresh.push(i);
          cleared++;
          /* Собранный материал не только открывает замки, но и
             растапливает лёд. Раньше игра снимала только замки —
             решатель же считал, что лёд тает, и признавал уровень
             проходимым по правилам, которых в игре не было. */
          nb.forEach((o) => {
            if (o.locked === m) o.locked = null;
            // лёд на предметах
            o.front.forEach((x) => {
              if (x && x.ice > 0 && x.iceKey === m) x.ice = 0;
            });
            o.queue.forEach((x) => {
              if (x.ice > 0 && x.iceKey === m) x.ice = 0;
            });
            // лёд на местах полки
            if (o.frozen) {
              Object.keys(o.frozen).forEach((k) => {
                if (o.frozen[k] === m) delete o.frozen[k];
              });
            }
          });
          again = true;
        });
        // опустевшая полка выводит содержимое из глубины
        nb.forEach((sh) => {
          if (!sh.locked && frontOf(sh).length === 0 && sh.queue.length) {
            for (let i = 0; i < SHELF_SLOTS && sh.queue.length; i++) {
              sh.front[i] = sh.queue.shift();
            }
            again = true;
          }
        });
      }
      if (fresh.length) {
        setJustMatched(fresh);
        setTimeout(() => setJustMatched([]), 650);
        setMatches((m) => m + cleared);
        audio.match();
        haptic.match();
      }
      nb.palette = b.palette;
      return nb;
    });
  };

  /* ---------- перетаскивание предмета на полку ---------- */
  const handleDrop = (fromSi, fromSlot, toSi, toSlotHint) => {
    if (lock.current || modal) return;
    const from = board[fromSi];
    const to = board[toSi];
    if (!from || !to) return;
    const moving = from.front[fromSlot];
    if (!moving) return;

    // 📌 закреплённый предмет унести нельзя
    if (moving.pinned) {
      setHint(t.hintPinned);
      haptic.blocked();
      setBlockedAt(moving.id);
      setTimeout(() => setBlockedAt(null), 320);
      return;
    }

    if (to.locked) {
      setHint(t.hintShelfLocked.replace("{item}", to.locked));
      haptic.blocked();
      setBlockedAt(moving.id);
      setTimeout(() => setBlockedAt(null), 320);
      return;
    }
    /* Перестановка внутри полки.

       Раньше здесь стоял безусловный выход: бросок на свою же
       полку молча отменялся, и предмет было не подвинуть из
       левого места в центр. Теперь двигаем внутри полки, если
       целевое место свободно. */
    if (toSi === fromSi) {
      if (toSlotHint === undefined || toSlotHint === fromSlot) return;
      if (!slotOpen(from, toSlotHint)) return;
      audio.tap(1);
      haptic.tap();
      setMoves((m) => m + 1);
      setHistory((h) => [
        ...h.slice(-24),
        { from: fromSi, fromSlot, to: toSi, toSlot: toSlotHint, partnerSlot: -1 },
      ]);
      applyBoard((nb) => {
        nb[fromSi].front[toSlotHint] = nb[fromSi].front[fromSlot];
        nb[fromSi].front[fromSlot] = null;
      });
      return;
    }

    // ⚖️ полка принимает только свой материал
    if (!acceptsItem(to, moving)) {
      setHint(t.hintOnlyItem.replace("{item}", to.only));
      haptic.blocked();
      setBlockedAt(moving.id);
      setTimeout(() => setBlockedAt(null), 320);
      return;
    }

    // 🔗 сцепке нужно два места сразу
    if (openSlots(to) < sizeOf(moving)) {
      setHint(moving.chain ? t.hintChainRoom : t.hintNoRoom);
      haptic.blocked();
      setBlockedAt(moving.id);
      setTimeout(() => setBlockedAt(null), 320);
      return;
    }

    // ставим туда, куда целился игрок, если там свободно
    const toSlot =
      toSlotHint !== undefined && slotOpen(to, toSlotHint)
        ? toSlotHint
        : to.front.findIndex((x, k) => slotOpen(to, k));
    // партнёр по сцепке едет следом
    const partnerSlot = moving.chain
      ? from.front.findIndex((x, k) => k !== fromSlot && x && x.chain)
      : -1;
    const mv = { from: fromSi, fromSlot, to: toSi, toSlot, partnerSlot };
    audio.tap(1);
    haptic.tap();
    setMoves((m) => m + 1);
    setHistory((h) => [...h.slice(-24), mv]);
    applyBoard((nb) => {
      nb[mv.to].front[mv.toSlot] = nb[mv.from].front[mv.fromSlot];
      nb[mv.from].front[mv.fromSlot] = null;
      if (mv.partnerSlot >= 0) {
        const j = nb[mv.to].front.findIndex((x, k) => slotOpen(nb[mv.to], k));
        if (j >= 0) {
          nb[mv.to].front[j] = nb[mv.from].front[mv.partnerSlot];
          nb[mv.from].front[mv.partnerSlot] = null;
        }
      }
    });
  };

  /* ---------- бусты ---------- */
  const showAd = (reward) => {
    setAdLoading(true);
    setTimeout(() => {
      setAdLoading(false);
      reward();
    }, 1500);
  };

  const payOrAd = (cost, reward) => {
    if (coins >= cost) {
      setCoins((c) => c - cost);
      reward();
    } else {
      // не хватает монет — предлагаем получить буст за рекламу
      showAd(reward);
    }
  };

  const boostUndo = () => {
    if (!history.length || lock.current) return;
    payOrAd(BOOST_COST.undo, () => {
      const last = history[history.length - 1];
      setBoard((b) => {
        const nb = b.map((sh) => ({ ...sh, front: [...sh.front], queue: [...sh.queue] }));
        const item = nb[last.to].front[last.toSlot];
        if (item && nb[last.from].front[last.fromSlot] === null) {
          nb[last.from].front[last.fromSlot] = item;
          nb[last.to].front[last.toSlot] = null;
          // сцепка возвращается вместе с партнёром
          if (item.chain && last.partnerSlot >= 0) {
            const j = nb[last.to].front.findIndex((x) => x && x.chain);
            if (j >= 0 && nb[last.from].front[last.partnerSlot] === null) {
              nb[last.from].front[last.partnerSlot] = nb[last.to].front[j];
              nb[last.to].front[j] = null;
            }
          }
        }
        nb.palette = b.palette;
        return nb;
      });
      setHistory((h) => h.slice(0, -1));
        setToast(t.boostUndo);
    });
  };

  // лишняя полка — главный инструмент, когда мест не осталось
  const boostShelf = () => {
    if (lock.current || extraShelves >= 2) return;
    payOrAd(BOOST_COST.slot, () => {
      setBoard((b) => {
        const nb = b.map((sh) => ({ ...sh, front: [...sh.front], queue: [...sh.queue] }));
        nb.push({
          id: 900 + nb.length,
          front: Array(SHELF_SLOTS).fill(null),
          queue: [],
          locked: null,
          bonus: true,
        });
        nb.palette = b.palette;
        return nb;
      });
      setExtraShelves((n) => n + 1);
      setToast(t.boostShelf);
    });
  };

  // подсказка: решатель ищет верный ход
  const boostHint = () => {
    if (lock.current) return;
    payOrAd(BOOST_COST.shuffle, () => {
      const mv = shelfHint(board);
      if (!mv) {
        setToast(t.noHint);
        return;
      }
      setBlockedAt(board[mv.a].front[mv.i] ? board[mv.a].front[mv.i].id : null);
      setTimeout(() => setBlockedAt(null), 900);
      setHint(t.hintShown);
    });
  };

  /* ---------- покупки ---------- */
  const buyForCoins = (offer) => {

    if (coins < offer.coins) {
      setToast(t.notEnough);
      return;
    }
    setCoins((c) => c - offer.coins);
    addLivesBought(offer.amount);
    audio.match();
    haptic.buy();
    setToast(t.purchased);
  };

  // покупка за деньги: в прототипе сразу выдаём товар,
  // в релизе здесь вызывается платёжный SDK стора
  const buyIAP = (item) => {
    if (item.lives) addLivesBought(item.lives);
    if (item.coins) setCoins((c) => c + item.coins);
    if (item.unlimitedMin) setUnlimitedUntil(Date.now() + item.unlimitedMin * 60 * 1000);
    audio.complete();
    haptic.buy();
    setToast(t.purchased);
  };

  const freeCoins = () => showAd(() => {
    setCoins((c) => c + 25);
    setToast("+25 🪙");
  });

  /* ---------- обучение ----------
     Идёт только на первом уровне первого мира и продвигается
     по действиям игрока, а не по таймеру. */
  const tutorialOn =
    !tutDone && screen === "game" && world === 0 && level === 0 && !modal;

  const tutorialStep = useMemo(() => {
    if (!tutorialOn) return null;
    const st = { moves, matches, board };
    let i = tutStep;
    // пропускаем шаги, которые уже выполнены или неприменимы
    while (i < TUTORIAL_STEPS.length) {
      const s = TUTORIAL_STEPS[i];
      if ((s.skip && s.skip(st)) || s.done(st)) i++;
      else break;
    }
    return i < TUTORIAL_STEPS.length ? { ...TUTORIAL_STEPS[i], index: i } : null;
  }, [tutorialOn, tutStep, moves, matches, board]);

  useEffect(() => {
    if (!tutorialOn) return;
    if (!tutorialStep) {
      setTutDone(true);
      return;
    }
    if (tutorialStep.index !== tutStep) setTutStep(tutorialStep.index);
  }, [tutorialOn, tutorialStep, tutStep]);

  // палец наводим на предмет, который стоит перетащить
  useEffect(() => {
    if (!tutorialStep || tutorialStep.id !== "drag") {
      setTutRect(null);
      return;
    }
    const target = tutorialTarget(board);
    if (!target) {
      setTutRect(null);
      return;
    }
    const find = () => {
      const el = document.querySelector(
        `[data-slot="${target.si}:${target.slot}"]`
      );
      if (!el) return setTutRect(null);
      const r = el.getBoundingClientRect();
      setTutRect({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    };
    find();
    const id = setInterval(find, 700);
    return () => clearInterval(id);
  }, [tutorialStep, board]);

  /* ---------- первая встреча с механикой ----------
     Карточка привязана к тому, что реально лежит на поле:
     генератор может выдать механику раньше или позже расчётного
     уровня, и объяснение должно прийти вместе с ней. */
  useEffect(() => {
    if (screen !== "game" || modal || mechCard || tutorialStep) return;
    const card = firstNewMechanic(board, seenMechanics);
    if (card) setMechCard(card);
  }, [board, screen, modal, mechCard, tutorialStep, seenMechanics]);

  /* ---------- завершение уровня ---------- */
  useEffect(() => {
    if (screen !== "game" || modal) return;
    if (shelvesSolved(board)) {
      const nextUnlocked = Math.min(unlocked + 1, stages.length);
      setUnlocked(nextUnlocked);
      setWorldProgress((p) => {
        if (p[world] >= nextUnlocked) return p;
        const n = [...p];
        n[world] = nextUnlocked;
        return n;
      });
      setCoins((c) => c + 10 + Math.floor(gIdx / 40));
      audio.complete();
      if (nextUnlocked >= stages.length) haptic.worldDone();
      else haptic.build();
      if (nextUnlocked >= stages.length) {
        const nw = world + 1;
        if (nw < WORLDS.length) {
          setMaxWorld((m) => Math.max(m, nw));
          setModal("worldDone");
        } else setModal("allDone");
      } else setModal("win");
      return;
    }
    // мест не осталось — предлагаем выход, а не молча запираем
    /* Тупик — это не только «ходов нет».

       Проверка показала: случайной игрой можно загнать себя в
       позицию, где ходы формально есть, но выиграть уже нельзя —
       33 случая из 237 партий. Игрок при этом мог бы бесконечно
       перекладывать предметы, не понимая, что уровень уже проигран.

       Поэтому если ходов нет — тупик очевиден. А если ходы есть,
       но свободных мест почти не осталось, спрашиваем решатель:
       остался ли путь к победе. Проверяем не каждый ход, а только
       в опасной зоне, иначе это било бы по отзывчивости. */
    if (!hasShelfMoves(board)) {
      setModal("stuck");
      return;
    }
    const freeNow = board.reduce((n, sh) => n + (sh.locked ? 0 : openSlots(sh)), 0);
    if (freeNow <= 2 && !solveShelves(board, 12000)) setModal("stuck");
  }, [board, modal, screen, unlocked, stages.length, world, gIdx, audio, haptic]);

  const nextLevel = () => {
    const lvl = level + 1;
    setLevel(lvl);
    restart(world, lvl);
    setModal(null);
  };

  const doneStage = stages[Math.min(Math.max(unlocked - 1, 0), stages.length - 1)];
  const nextStage = stages[Math.min(unlocked, stages.length - 1)];

  /* Пока прогресс не загружен, показываем заставку: если пустить
     игрока в меню раньше, он успеет начать партию и перезаписать
     своё сохранение чистым состоянием. */
  if (!loaded) {
    return (
      <div
        style={{
          minHeight: "100vh", background: UI.bg, color: UI.ink,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 14,
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          boxSizing: "border-box",
          fontFamily: "Nunito, system-ui, sans-serif",
        }}
      >
        <style>{`
          @keyframes sb-load{0%,100%{transform:translateY(0);opacity:.55}
            50%{transform:translateY(-9px);opacity:1}}
        `}</style>
        <div style={{ display: "flex", gap: 8 }}>
          {["📦", "🔨", "🏠"].map((e, i) => (
            <span
              key={i}
              style={{
                fontSize: 30,
                animation: `sb-load 1.1s ease-in-out ${i * 0.15}s infinite`,
              }}
            >
              {e}
            </span>
          ))}
        </div>
        <div
          style={{
            fontFamily: "Fredoka, sans-serif", fontWeight: 700,
            fontSize: 20, color: UI.deep, letterSpacing: "-0.3px",
          }}
        >
          Sort &amp; Build
        </div>
      </div>
    );
  }

  return (
    <div
      dir={rtl ? "rtl" : "ltr"}
      style={{
        minHeight: "100vh", background: UI.bg, color: UI.ink,
        fontFamily: "Nunito, system-ui, sans-serif",
        display: "flex", justifyContent: "center",
        /* Отступы под вырез камеры, часы и системные кнопки.
           Без них шапка уезжает под статус-бар: кнопка «Меню»
           либо не видна, либо видна, но не нажимается — по ней
           попадает системная панель, а не игра. */
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;800&display=swap');
        @keyframes sb-pop{0%{opacity:0;transform:scale(.6)}70%{transform:scale(1.08)}100%{opacity:1;transform:scale(1)}}
        @keyframes sb-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-7px)}75%{transform:translateX(7px)}}
        @keyframes sb-in{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:scale(1)}}
        @keyframes sb-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        /* блик скользит по льду, потом долгая пауза — чтобы не мельтешило */
        @keyframes sb-glare{0%{transform:translateX(-140%) skewX(-18deg)}
          22%{transform:translateX(300%) skewX(-18deg)}
          100%{transform:translateX(300%) skewX(-18deg)}}
        @keyframes sb-crystal{0%,100%{transform:scale(1);opacity:.95}50%{transform:scale(1.18);opacity:1}}
        @keyframes sb-shard{0%{opacity:1;transform:scale(.6) translate(0,0)}
          100%{opacity:0;transform:scale(1.5) translate(var(--dx,0),var(--dy,-14px))}}
        .sb-ice-glare{animation:sb-glare 3.4s ease-in-out infinite}
        .sb-ice-crystal{animation:sb-crystal 1.8s ease-in-out infinite}
        .sb-shard{animation:sb-shard .38s ease-out forwards}
        /* материал выпрыгивает из ящика-источника */
        @keyframes sb-lift{0%{transform:translateY(0) scale(1)}
          100%{transform:translateY(-26px) scale(1.12);opacity:0}}
        /* и мягко опускается в приёмник */
        @keyframes sb-drop{0%{transform:translateY(-26px) scale(1.12);opacity:0}
          60%{transform:translateY(3px) scale(.96);opacity:1}
          100%{transform:translateY(0) scale(1);opacity:1}}
        /* собранный ящик радостно подпрыгивает */
        @keyframes sb-crate-done{0%{transform:scale(1)}
          30%{transform:scale(1.09) rotate(-2deg)}
          55%{transform:scale(.97) rotate(2deg)}
          100%{transform:scale(1) rotate(0)}}
        /* сияние по контуру готового ящика */
        @keyframes sb-glow{0%,100%{box-shadow:0 0 0 0 rgba(79,168,60,0)}
          50%{box-shadow:0 0 16px 4px rgba(79,168,60,.55)}}
        .sb-lift{animation:sb-lift .26s ease-in forwards}
        .sb-drop{animation:sb-drop .3s cubic-bezier(.34,1.56,.64,1) both}
        .sb-crate-done{animation:sb-crate-done .6s cubic-bezier(.34,1.56,.64,1), sb-glow .7s ease}
        /* палец обучения: показывает жест перетаскивания */
        @keyframes sb-tut-hand{
          0%{transform:translate(-50%,-10%) scale(1)}
          30%{transform:translate(-50%,-24%) scale(1.12)}
          60%{transform:translate(10%,-24%) scale(1.12)}
          100%{transform:translate(-50%,-10%) scale(1)}}
        .sb-tut-hand{animation:sb-tut-hand 2.2s ease-in-out infinite}
        .sb-tile{transition:transform .1s ease}
        .sb-tile:active{transform:scale(.9)}
        .sb-range{-webkit-appearance:none;appearance:none;height:6px;border-radius:4px;background:#00000018;outline:none}
        .sb-range::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:${UI.accent};cursor:pointer;border:none}
        .sb-range::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:${UI.accent};cursor:pointer;border:none}
        button:focus-visible{outline:2px solid ${UI.accent};outline-offset:2px}
        @media (prefers-reduced-motion: reduce){*{animation-duration:.01ms !important}}
      `}</style>

      {/* ---------- МЕНЮ ---------- */}
      {screen === "menu" && (
        <div style={{ width: "100%", maxWidth: 460, padding: "18px 18px 24px", display: "flex", flexDirection: "column", gap: 14, boxSizing: "border-box"}}>
          <ResourceBar
            t={t} lives={lives} coins={coins} unlimited={unlimited}
            nextLifeAt={nextLifeAt} now={now}
            onShop={() => setScreen("shop")}
          />

          <div style={{ textAlign: "center", marginTop: 18 }}>
            <div style={{ fontSize: 64, animation: "sb-float 3s ease-in-out infinite" }}>{WORLDS[world].icon}</div>
            <h1 style={{ fontFamily: "Fredoka, sans-serif", fontWeight: 700, fontSize: 40, color: UI.deep, margin: "10px 0 6px", letterSpacing: "-0.5px" }}>
              {t.title}
            </h1>
            <p style={{ fontSize: 14.5, opacity: 0.7, margin: 0 }}>{t.tagline}</p>
          </div>

          <div
            style={{
              background: UI.panel, borderRadius: 20, padding: "16px 18px", marginTop: 8,
              boxShadow: "0 4px 16px rgba(47,58,44,0.08)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>{t.worldLabel}</div>
              <div style={{ fontFamily: "Fredoka, sans-serif", fontWeight: 700, fontSize: 20, color: UI.deep }}>
                {WORLDS[world].icon} {wName(world)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, opacity: 0.6 }}>{t.levelLabel}</div>
              <div style={{ fontFamily: "Fredoka, sans-serif", fontWeight: 700, fontSize: 20, color: UI.deep }}>
                {gIdx + 1} <span style={{ fontSize: 13, opacity: 0.6 }}>{t.of} {TOTAL_LEVELS}</span>
              </div>
            </div>
          </div>

          {/* Вид поля — ключевой выбор, поэтому он на виду в меню,
              а не спрятан в настройках. */}
          <div
            style={{
              background: UI.panel, borderRadius: 18, padding: "12px 14px",
              boxShadow: "0 4px 16px rgba(47,58,44,0.08)",
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 8 }}>{t.viewMode}</div>
            <div
              style={{
                display: "flex", gap: 6, background: "#00000010",
                borderRadius: 13, padding: 4,
              }}
            >
              {[
                { on: true, icon: "🧊", label: t.view3D },
                { on: false, icon: "🙂", label: t.view2D },
              ].map((o) => (
                <button
                  key={String(o.on)}
                  onClick={() => setView3D(o.on)}
                  style={{
                    flex: 1, border: "none", cursor: "pointer",
                    borderRadius: 10, padding: "9px 6px",
                    background: view3D === o.on ? UI.accent : "transparent",
                    color: view3D === o.on ? "#fff" : UI.deep,
                    fontFamily: "Fredoka, sans-serif", fontWeight: 600, fontSize: 13,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    boxShadow: view3D === o.on ? "0 2px 6px rgba(208,112,63,.35)" : "none",
                    transition: "background .15s ease",
                  }}
                >
                  <span style={{ fontSize: 16 }}>{o.icon}</span>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <Btn onClick={beginGame}>{started ? t.continueGame : t.start}</Btn>
          <div style={{ display: "flex", gap: 8 }}>
            <GhostBtn onClick={() => setScreen("worlds")}>🗺 {t.chooseWorld}</GhostBtn>
            <GhostBtn onClick={() => setScreen("gallery")}>
              🖼 {t.gallery}{builtCount > 0 ? ` (${builtCount})` : ""}
            </GhostBtn>
          </div>
          <GhostBtn onClick={() => setSettingsOpen(true)}>⚙ {t.settings}</GhostBtn>
        </div>
      )}

      {/* ---------- МАГАЗИН ---------- */}
      {screen === "shop" && (
        <div style={{ width: "100%", maxWidth: 460, padding: "18px 16px 26px", display: "flex", flexDirection: "column", gap: 12, boxSizing: "border-box"}}>
          <ResourceBar
            t={t} lives={lives} coins={coins} unlimited={unlimited}
            nextLifeAt={nextLifeAt} now={now}
          />

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
            <button
              onClick={() => setScreen("menu")}
              style={{
                background: UI.panel, border: "none", borderRadius: 11, padding: "7px 13px",
                fontFamily: "Fredoka, sans-serif", fontWeight: 600, fontSize: 13, color: UI.deep, cursor: "pointer",
              }}
            >
              ← {t.menu}
            </button>
            <div style={{ fontFamily: "Fredoka, sans-serif", fontWeight: 700, fontSize: 19, color: UI.deep }}>
              🛒 {t.shopTitle}
            </div>
          </div>

          {/* бесплатные монеты за рекламу */}
          <button
            onClick={freeCoins}
            style={{
              background: `linear-gradient(135deg, ${UI.accent}, #e08a52)`, border: "none",
              borderRadius: 16, padding: "13px 16px", cursor: "pointer", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ fontSize: 22 }}>🎁</span>
              <span style={{ fontFamily: "Fredoka, sans-serif", fontWeight: 600, fontSize: 14 }}>{t.freeCoins}</span>
            </span>
            <span style={{ fontFamily: "Fredoka, sans-serif", fontWeight: 700, fontSize: 15 }}>+25 🪙</span>
          </button>

          {/* жизни */}
          <SectionTitle>❤️ {t.livesTitle}</SectionTitle>
          <div
            style={{
              fontSize: 11.5, lineHeight: 1.45, opacity: 0.7, color: UI.deep,
              background: "#00000008", borderRadius: 11, padding: "8px 11px",
              marginTop: -2, marginBottom: 2,
            }}
          >
            💡 {t.livesStackNote}
          </div>
          {LIFE_OFFERS.map((o) => (
            <ShopRow
              key={o.id} icon={o.icon} title={t[o.titleKey]}
              sub={`+${o.amount} ❤️`}
              price={`${o.coins} 🪙`}
              onClick={() => buyForCoins(o)}
            />
          ))}
          {IAP_LIVES.map((o) => (
            <ShopRow
              key={o.id} icon={o.icon} title={t[o.titleKey]}
              sub={o.lives ? `+${o.lives} ❤️` : `${o.unlimitedMin} ${t.minutesShort}`}
              price={o.price} badge={o.badge ? t[o.badge] : null} money
              onClick={() => buyIAP(o)}
            />
          ))}

          {/* комплект миров */}
          <SectionTitle>🌍 {t.worldLabel}</SectionTitle>
          <ShopRow
            icon={BUNDLE_ALL.icon} title={t.unlockAll}
            sub={`${WORLDS.length} ${t.worldLabel.toLowerCase()}`}
            price={BUNDLE_ALL.price} badge={t.bestValue} money
            onClick={buyAllWorlds}
          />

          {/* монеты */}
          <SectionTitle>🪙 {t.coins}</SectionTitle>
          {IAP_COINS.map((o) => (
            <ShopRow
              key={o.id} icon={o.icon} title={`${o.coins.toLocaleString()} ${t.coinPack}`}
              price={o.price} badge={o.badge ? t[o.badge] : null} money
              onClick={() => buyIAP(o)}
            />
          ))}

          <button
            onClick={() => setToast(t.purchased)}
            style={{
              background: "none", border: "none", color: UI.deep, opacity: 0.55,
              fontSize: 12, cursor: "pointer", padding: 10, marginTop: 4,
            }}
          >
            {t.restore}
          </button>
        </div>
      )}

      {/* ---------- ВЫБОР МИРА ---------- */}
      {screen === "worlds" && (
        <div style={{ width: "100%", maxWidth: 460, padding: "20px 16px", display: "flex", flexDirection: "column", gap: 12, boxSizing: "border-box"}}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setScreen("menu")}
              style={{
                background: UI.panel, border: "none", borderRadius: 11, padding: "7px 13px",
                fontFamily: "Fredoka, sans-serif", fontWeight: 600, fontSize: 13, color: UI.deep, cursor: "pointer",
              }}
            >
              ← {t.menu}
            </button>
            <div style={{ fontFamily: "Fredoka, sans-serif", fontWeight: 700, fontSize: 18, color: UI.deep }}>
              {t.chooseWorld}
            </div>
          </div>

          {WORLDS.map((w, i) => {
            const open = isWorldOpen(i);
            const bought = boughtWorlds.includes(i);
            const price = worldPrice(i);
            return (
              <div
                key={w.key}
                style={{
                  background: open ? UI.panel : "#00000008",
                  border: i === world && open ? `2px solid ${UI.accent}` : "2px solid transparent",
                  borderRadius: 18, padding: "13px 15px", width: "100%",
                  boxShadow: open ? "0 4px 14px rgba(47,58,44,0.07)" : "none",
                }}
              >
                <div
                  onClick={() => open && enterWorld(i)}
                  style={{
                    display: "flex", alignItems: "center", gap: 13,
                    cursor: open ? "pointer" : "default", opacity: open ? 1 : 0.75,
                  }}
                >
                  <span style={{ fontSize: 30, filter: open ? "none" : "grayscale(0.8)" }}>
                    {open ? w.icon : "🔒"}
                  </span>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: "block", fontFamily: "Fredoka, sans-serif", fontWeight: 700, fontSize: 16.5, color: UI.deep }}>
                      {wName(i)}
                    </span>
                    <span style={{ display: "block", fontSize: 12, opacity: 0.65, marginTop: 2 }}>
                      {open
                        ? `${w.stages.length} ${t.levelLabel.toLowerCase()}${bought ? " · " + t.bought : ""}`
                        : `${t.completePrev}: ${wName(i - 1)}`}
                    </span>
                  </span>
                  {open && <span style={{ fontSize: 18, color: UI.accent }}>›</span>}
                </div>

                {/* закрытый мир: пройти предыдущий бесплатно или купить сразу */}
                {!open && (
                  <>
                    <button
                      onClick={() => buyWorld(i)}
                      style={{
                        marginTop: 10, width: "100%", cursor: "pointer",
                        background: UI.accent, border: "none", color: "#fff",
                        borderRadius: 12, padding: "10px 12px",
                        fontFamily: "Fredoka, sans-serif", fontWeight: 600, fontSize: 13.5,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxSizing: "border-box"}}
                    >
                      🔓 {t.buyWorld} — {price}
                    </button>
                    <div style={{ textAlign: "center", fontSize: 11, opacity: 0.55, marginTop: 6 }}>
                      {t.freeByPlay}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ---------- ГАЛЕРЕЯ СОБРАННЫХ МИРОВ ---------- */}
      {screen === "gallery" && (
        <div style={{ width: "100%", maxWidth: 460, padding: "18px 16px 26px", display: "flex", flexDirection: "column", gap: 12, boxSizing: "border-box"}}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setScreen("menu")}
              style={{
                background: UI.panel, border: "none", borderRadius: 11, padding: "7px 13px",
                fontFamily: "Fredoka, sans-serif", fontWeight: 600, fontSize: 13, color: UI.deep, cursor: "pointer",
              }}
            >
              ← {t.menu}
            </button>
            <div style={{ fontFamily: "Fredoka, sans-serif", fontWeight: 700, fontSize: 19, color: UI.deep }}>
              🖼 {t.gallery}
            </div>
          </div>

          {/* счётчик коллекции */}
          <div
            style={{
              background: UI.panel, borderRadius: 16, padding: "12px 16px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              boxShadow: "0 2px 10px rgba(47,58,44,0.06)",
            }}
          >
            <span style={{ fontSize: 13, opacity: 0.7 }}>{t.collected}</span>
            <span style={{ fontFamily: "Fredoka, sans-serif", fontWeight: 700, fontSize: 18, color: UI.accent }}>
              {builtCount} / {WORLDS.length}
            </span>
          </div>

          {builtCount === 0 && (
            <div
              style={{
                textAlign: "center", padding: "26px 18px", opacity: 0.65,
                fontSize: 13, lineHeight: 1.5,
              }}
            >
              <div style={{ fontSize: 38, marginBottom: 8 }}>🏗️</div>
              {t.galleryEmpty}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {WORLDS.map((w, i) => {
              const done = isBuilt(i);
              const prog = worldProgress[i];
              return (
                <button
                  key={w.key}
                  onClick={() => { if (done) { setViewWorld(i); setScreen("view"); } }}
                  disabled={!done}
                  style={{
                    position: "relative", padding: "14px 10px", borderRadius: 16,
                    border: done ? `2px solid ${UI.accent}55` : "2px solid transparent",
                    background: done ? UI.panel : "#00000008",
                    cursor: done ? "pointer" : "not-allowed",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                    boxShadow: done ? "0 3px 12px rgba(47,58,44,0.08)" : "none",
                  }}
                >
                  <span style={{ fontSize: 34, filter: done ? "none" : "grayscale(1) opacity(.4)" }}>
                    {w.icon}
                  </span>
                  <span
                    style={{
                      fontFamily: "Fredoka, sans-serif", fontWeight: 600, fontSize: 12.5,
                      color: UI.deep, opacity: done ? 1 : 0.5, textAlign: "center", lineHeight: 1.2,
                    }}
                  >
                    {wName(i)}
                  </span>
                  <span style={{ fontSize: 10.5, opacity: 0.6 }}>
                    {done ? `${w.stages.length} ${t.buildings}` : `${prog}/${w.stages.length}`}
                  </span>
                  {done && (
                    <span
                      style={{
                        position: "absolute", top: 7, right: 8, fontSize: 13,
                      }}
                    >
                      ✅
                    </span>
                  )}
                  {/* полоска прогресса для недостроенных */}
                  {!done && prog > 0 && (
                    <span
                      style={{
                        position: "absolute", left: 12, right: 12, bottom: 8,
                        height: 4, borderRadius: 3, background: "#00000012", overflow: "hidden",
                      }}
                    >
                      <span
                        style={{
                          display: "block", height: "100%",
                          width: `${(prog / w.stages.length) * 100}%`, background: UI.accent,
                        }}
                      />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------- ПРОСМОТР СОБРАННОГО МИРА ---------- */}
      {screen === "view" && (
        <div style={{ width: "100%", maxWidth: 460, padding: "14px 12px 22px", display: "flex", flexDirection: "column", gap: 10, boxSizing: "border-box"}}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button
              onClick={() => setScreen("gallery")}
              style={{
                background: UI.panel, border: "none", borderRadius: 11, padding: "6px 12px",
                fontFamily: "Fredoka, sans-serif", fontWeight: 600, fontSize: 13, color: UI.deep, cursor: "pointer",
              }}
            >
              ← {t.gallery}
            </button>
            <div style={{ fontFamily: "Fredoka, sans-serif", fontWeight: 700, fontSize: 15, color: UI.deep }}>
              {WORLDS[viewWorld].icon} {wName(viewWorld)}
            </div>
            <span style={{ width: 60 }} />
          </div>

          {/* мир целиком, со всеми постройками */}
          <div
            style={{
              position: "relative", height: 400, borderRadius: 20, overflow: "hidden",
              boxShadow: "0 8px 24px rgba(47,58,44,0.14)",
            }}
          >
            <Plot world={viewWorld} unlocked={WORLDS[viewWorld].stages.length} apiRef={camRef} />
            <div style={{ position: "absolute", top: 10, right: 10, display: "flex", flexDirection: "column", gap: 5 }}>
              <RoundBtn onClick={() => camRef.current?.zoomBy(-1)}>+</RoundBtn>
              <RoundBtn onClick={() => camRef.current?.zoomBy(1)}>−</RoundBtn>
            </div>
            <div
              style={{
                position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
                display: "flex", gap: 3, background: "rgba(253,250,243,0.9)", padding: 3, borderRadius: 11,
              }}
            >
              {VIEWS.map((v) => (
                <button
                  key={v.key}
                  onClick={() => camRef.current?.setView(v.theta, v.phi, v.zoom)}
                  style={{
                    border: "none", background: "transparent", cursor: "pointer",
                    fontFamily: "Fredoka, sans-serif", fontWeight: 600, fontSize: 11,
                    color: UI.deep, padding: "4px 7px", borderRadius: 8,
                  }}
                >
                  {t.views[v.key]}
                </button>
              ))}
            </div>
          </div>

          {/* состав мира */}
          <div
            style={{
              background: UI.panel, borderRadius: 16, padding: "12px 14px",
              boxShadow: "0 2px 10px rgba(47,58,44,0.06)",
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 8 }}>
              {WORLDS[viewWorld].stages.length} {t.buildings}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {WORLDS[viewWorld].stages.map((st, k) => (
                <span
                  key={k}
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    background: "#00000008", borderRadius: 9, padding: "4px 8px",
                    fontSize: 11, color: UI.deep,
                  }}
                >
                  <span style={{ fontSize: 13 }}>{st.icon}</span>
                  {sName(st)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------- ИГРА ---------- */}
      {screen === "game" && (
        <div style={{ width: "100%", maxWidth: 460, padding: "12px 12px 20px", display: "flex", flexDirection: "column", gap: 9, boxSizing: "border-box"}}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button
              onClick={() => setScreen("menu")}
              style={{
                background: UI.panel, border: "none", borderRadius: 11, padding: "6px 12px",
                fontFamily: "Fredoka, sans-serif", fontWeight: 600, fontSize: 13, color: UI.deep, cursor: "pointer",
              }}
            >
              ← {t.menu}
            </button>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <span style={{ fontFamily: "Fredoka, sans-serif", fontWeight: 600, fontSize: 13, color: UI.deep }}>
                {t.levelLabel} {gIdx + 1}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ display: "flex", gap: 2 }}>
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      style={{
                        width: 5, height: 5, borderRadius: "50%",
                        background: i < TIER_STYLE[cfg.tier].dots ? TIER_STYLE[cfg.tier].color : "#00000018",
                      }}
                    />
                  ))}
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, color: TIER_STYLE[cfg.tier].color, fontFamily: "Fredoka, sans-serif" }}>
                  {t["tier" + cfg.tier.charAt(0).toUpperCase() + cfg.tier.slice(1)]}
                </span>
              </span>
            </div>
            <button
              onClick={() => setView3D((v) => !v)}
              style={{
                background: UI.panel, border: "none", borderRadius: 11,
                padding: "5px 9px", cursor: "pointer", fontSize: 14, lineHeight: 1,
              }}
              title={view3D ? t.view3D : t.view2D}
            >
              {view3D ? "🧊" : "🙂"}
            </button>
            <button
              onClick={() => setScreen("shop")}
              style={{
                display: "flex", alignItems: "center", gap: 7, cursor: "pointer",
                background: UI.panel, border: "none", borderRadius: 11, padding: "5px 10px",
              }}
            >
              <span style={{ fontFamily: "Fredoka, sans-serif", fontWeight: 700, fontSize: 12.5, color: UI.deep }}>
                {unlimited ? "♾️" : `${lives} ❤️`}
              </span>
              <span style={{ fontFamily: "Fredoka, sans-serif", fontWeight: 700, fontSize: 12.5, color: UI.deep }}>
                {coins} 🪙
              </span>
            </button>
          </div>

          <div style={{ position: "relative", height: 220, borderRadius: 20, overflow: "hidden", boxShadow: "0 8px 24px rgba(47,58,44,0.14)" }}>
            <Plot world={world} unlocked={unlocked} apiRef={camRef} />
            <div
              style={{
                position: "absolute", top: 9, left: 9,
                background: "rgba(253,250,243,0.9)", borderRadius: 12, padding: "5px 10px",
                fontFamily: "Fredoka, sans-serif", fontWeight: 600, fontSize: 12.5, color: UI.deep,
              }}
            >
              {stage.icon} {sName(stage)} · {unlocked}/{stages.length}
            </div>
            <div style={{ position: "absolute", top: 9, right: 9, display: "flex", flexDirection: "column", gap: 5 }}>
              <RoundBtn onClick={() => camRef.current?.zoomBy(-1)}>+</RoundBtn>
              <RoundBtn onClick={() => camRef.current?.zoomBy(1)}>−</RoundBtn>
              <RoundBtn onClick={() => setSettingsOpen(true)}>⚙</RoundBtn>
            </div>
            <div
              style={{
                position: "absolute", bottom: 7, left: "50%", transform: "translateX(-50%)",
                display: "flex", gap: 3, background: "rgba(253,250,243,0.9)", padding: 3, borderRadius: 11,
              }}
            >
              {VIEWS.map((v) => (
                <button
                  key={v.key}
                  onClick={() => camRef.current?.setView(v.theta, v.phi, v.zoom)}
                  style={{
                    border: "none", background: "transparent", cursor: "pointer",
                    fontFamily: "Fredoka, sans-serif", fontWeight: 600, fontSize: 11,
                    color: UI.deep, padding: "4px 7px", borderRadius: 8,
                  }}
                >
                  {t.views[v.key]}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ flex: 1, height: 8, borderRadius: 5, background: "#00000014", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress * 100}%`, background: UI.accent, transition: "width .25s ease" }} />
            </div>
            <span
              style={{
                fontFamily: "Fredoka, sans-serif", fontSize: 11.5, fontWeight: 700,
                color: freeTotal === 0 ? "#d43a2f" : UI.deep, opacity: 0.85,
              }}
            >
              🗄️ {freeTotal}
            </span>
          </div>

          {/* ---- поле: полки ---- */}
          {view3D ? (
            <div
              style={{
                background: "linear-gradient(180deg, #fdfaf3, #f3ece0)",
                borderRadius: 18,
                boxShadow: "0 4px 16px rgba(47,58,44,0.08)",
                height: 380,
                overflow: "hidden",
                animation: shake ? "sb-shake .4s ease" : "none",
              }}
            >
              <Board3D
                board={board}
                cfg={cfg}
                justMatched={justMatched}
                blockedAt={blockedAt}
                worldKey={WORLDS[world].key}
                onDrop={handleDrop}
              />
            </div>
          ) : (
            <Board2D
              board={board}
              cfg={cfg}
              justMatched={justMatched}
              blockedAt={blockedAt}
              worldKey={WORLDS[world].key}
              onDrop={handleDrop}
              shake={shake}
            />
          )}

          {/* ---- бусты ---- */}
          <div style={{ display: "flex", gap: 7 }}>
            <BoostBtn onClick={boostUndo} disabled={!history.length} icon="↩️" label={t.boostUndo} cost={BOOST_COST.undo} coins={coins} adWord={t.watchAd} />
            <BoostBtn onClick={boostShelf} disabled={extraShelves >= 2} icon="🗄️" label={t.boostShelf} cost={BOOST_COST.slot} coins={coins} adWord={t.watchAd} />
            <BoostBtn onClick={boostHint} icon="💡" label={t.boostHint} cost={BOOST_COST.shuffle} coins={coins} adWord={t.watchAd} />
          </div>

          <button
            onClick={() =>
              showAd(() => {
                setUnlocked((u) => Math.min(u + 1, stages.length));
                setToast(t.levelSkipped);
                setTimeout(() => {
                  const nx = level + 1;
                  if (nx < stages.length) {
                    setLevel(nx);
                    restart(world, nx);
                  } else {
                    const nw = world + 1;
                    if (nw < WORLDS.length) setMaxWorld((m) => Math.max(m, nw));
                    setModal(nw < WORLDS.length ? "worldDone" : "allDone");
                  }
                }, 300);
              })
            }
            style={{
              background: "transparent", border: `1.5px solid ${UI.deep}33`, color: UI.deep,
              borderRadius: 12, padding: "9px", cursor: "pointer", opacity: 0.85,
              fontFamily: "Fredoka, sans-serif", fontWeight: 600, fontSize: 12.5,
            }}
          >
            ⏭ {t.skipLevel} · ▶ {t.watchAd}
          </button>

          <div
            style={{
              border: "1.5px dashed rgba(63,98,68,.35)", borderRadius: 12, padding: "8px",
              textAlign: "center", fontSize: 11, color: UI.deep, opacity: 0.5,
            }}
          >
            {t.adBanner}
          </div>
        </div>
      )}

      {/* ---------- НАСТРОЙКИ ---------- */}
      {settingsOpen && (
        <Overlay>
          <div style={{ fontFamily: "Fredoka, sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 16, color: UI.deep }}>
            ⚙ {t.settings}
          </div>
          <Slider label={`🎵 ${t.music}`} value={musicVol} onChange={setMusicVol} />
          <Slider
            label={`🔔 ${t.sound}`}
            value={sfxVol}
            onChange={(v) => { setSfxVol(v); audio.setSfx(v); audio.tap(2); }}
          />
          {/* сброс всего прогресса — с подтверждением, потому что
              действие необратимое */}
          <button
            onClick={() => {
              if (!resetArmed) {
                setResetArmed(true);
                setTimeout(() => setResetArmed(false), 4000);
                return;
              }
              clearSave();
              setWorld(0); setMaxWorld(0); setLevel(0); setUnlocked(0);
              setWorldProgress(WORLDS.map(() => 0));
              setBoughtWorlds([]); setStarted(false);
              setCoins(START_COINS); setLives(MAX_LIVES);
              setNextLifeAt(null); setUnlimitedUntil(0);
              setTutDone(false); setTutStep(0); setSeenMechanics([]);
              setResetArmed(false);
              setSettingsOpen(false);
              setScreen("menu");
              restart(0, 0);
            }}
            style={{
              width: "100%", background: "transparent", cursor: "pointer",
              border: `1.5px solid ${resetArmed ? "#c4383c" : "#00000018"}`,
              borderRadius: 12, padding: "9px", marginBottom: 12,
              color: resetArmed ? "#c4383c" : UI.deep,
              opacity: resetArmed ? 1 : 0.6,
              fontFamily: "Fredoka, sans-serif", fontWeight: 600, fontSize: 12.5,
            }}
          >
            {resetArmed ? `⚠️ ${t.resetConfirm}` : `🗑 ${t.resetProgress}`}
          </button>

          {/* тактильная отдача */}
          <button
            onClick={() => haptic.supported && setHapticsOn((v) => !v)}
            disabled={!haptic.supported}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              background: "transparent", border: "none", padding: "4px 0 12px",
              cursor: haptic.supported ? "pointer" : "not-allowed",
              opacity: haptic.supported ? 1 : 0.5, textAlign: "left", boxSizing: "border-box"}}
          >
            <span style={{ fontSize: 15 }}>📳</span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: UI.deep }}>{t.haptics}</span>
              {!haptic.supported && (
                <span style={{ display: "block", fontSize: 10.5, opacity: 0.6, marginTop: 1 }}>{t.hapticsOff}</span>
              )}
            </span>
            <span
              style={{
                width: 44, height: 25, borderRadius: 13, flexShrink: 0, position: "relative",
                background: hapticsOn && haptic.supported ? UI.accent : "#00000020",
                transition: "background .2s ease",
              }}
            >
              <span
                style={{
                  position: "absolute", top: 3, left: hapticsOn && haptic.supported ? 22 : 3,
                  width: 19, height: 19, borderRadius: "50%", background: "#fff",
                  transition: "left .2s ease", boxShadow: "0 1px 3px rgba(0,0,0,.25)",
                }}
              />
            </span>
          </button>

          <div style={{ textAlign: "left", marginTop: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: UI.deep }}>🌐 {t.language}</div>
            <div
              style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6,
                maxHeight: 210, overflowY: "auto", paddingRight: 2,
              }}
            >
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "8px 8px", borderRadius: 11, cursor: "pointer",
                    fontFamily: "Nunito, sans-serif", fontSize: 12.5, fontWeight: 600,
                    border: lang === l.code ? `2px solid ${UI.accent}` : "2px solid transparent",
                    background: lang === l.code ? `${UI.accent}1a` : "#00000009",
                    color: lang === l.code ? UI.accent : UI.ink,
                    textAlign: "start",
                  }}
                >
                  <span style={{ fontSize: 17, lineHeight: 1 }}>{l.flag}</span>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {l.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <Btn onClick={() => setSettingsOpen(false)}>{t.close}</Btn>
          </div>
        </Overlay>
      )}

      {hint && (
        <div
          style={{
            position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)",
            background: UI.deep, color: UI.panel, padding: "9px 16px", borderRadius: 20,
            fontFamily: "Fredoka, sans-serif", fontSize: 13, zIndex: 50,
            animation: "sb-pop .2s ease both", maxWidth: "80%", textAlign: "center",
          }}
        >
          {hint}
        </div>
      )}

      {/* ---------- КАРТОЧКА НОВОЙ МЕХАНИКИ ---------- */}
      {mechCard && (
        <MechanicCard
          card={mechCard}
          t={t}
          onClose={() => {
            setSeenMechanics((v) => [...v, mechCard.id]);
            setMechCard(null);
          }}
        />
      )}

      {/* ---------- ОБУЧЕНИЕ ---------- */}
      {tutorialStep && (
        <TutorialHint
          step={tutorialStep}
          t={t}
          targetRect={tutRect}
          onSkip={() => setTutDone(true)}
        />
      )}

      {toast && (
        <div
          style={{
            position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
            background: UI.deep, color: UI.panel, padding: "8px 16px", borderRadius: 20,
            fontFamily: "Fredoka, sans-serif", fontSize: 13, zIndex: 50,
          }}
        >
          {toast}
        </div>
      )}

      {adLoading && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(20,28,20,.55)", zIndex: 60,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            style={{
              background: UI.panel, borderRadius: 18, padding: "20px 26px",
              fontFamily: "Fredoka, sans-serif", fontSize: 14, color: UI.deep,
            }}
          >
            {t.adLoading}
          </div>
        </div>
      )}

      {modal && (
        <Overlay>
          {modal === "win" && (
            <>
              <div style={{ fontSize: 42 }}>{doneStage.icon}</div>
              <div style={{ fontFamily: "Fredoka, sans-serif", fontWeight: 700, fontSize: 20, margin: "6px 0 4px" }}>
                {sName(doneStage)} {t.doneTitle}
              </div>
              <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 16 }}>
                {t.nextObject}: {nextStage.icon} {sName(nextStage)}
              </div>
              <Btn onClick={nextLevel}>{t.keepBuilding}</Btn>
            </>
          )}
          {modal === "worldDone" && (
            <>
              <div style={{ fontSize: 42 }}>🏆</div>
              <div style={{ fontFamily: "Fredoka, sans-serif", fontWeight: 700, fontSize: 20, margin: "6px 0 4px" }}>
                {wName(world)} {t.worldDoneTitle}
              </div>
              <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 16 }}>
                {t.worldDoneBody}: {WORLDS[Math.min(world + 1, WORLDS.length - 1)].icon}{" "}
                {wName(Math.min(world + 1, WORLDS.length - 1))}
              </div>
              <Btn onClick={() => enterWorld(world + 1)}>{t.nextWorld}</Btn>
              <TextBtn onClick={() => setModal(null)}>{t.lookAround}</TextBtn>
            </>
          )}
          {modal === "allDone" && (
            <>
              <div style={{ fontSize: 42 }}>🎉</div>
              <div style={{ fontFamily: "Fredoka, sans-serif", fontWeight: 700, fontSize: 20, margin: "6px 0 4px" }}>
                {t.allDoneTitle}
              </div>
              <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 16 }}>{t.allDoneBody}</div>
              <Btn onClick={() => setModal(null)}>{t.lookAround}</Btn>
              <TextBtn onClick={() => enterWorld(0)}>{t.restartAll}</TextBtn>
            </>
          )}
          {modal === "stuck" && (
            <>
              <div style={{ fontSize: 42 }}>🤔</div>
              <div style={{ fontFamily: "Fredoka, sans-serif", fontWeight: 700, fontSize: 20, margin: "6px 0 4px" }}>
                {t.stuckTitle}
              </div>
              <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 16 }}>{t.stuckBody}</div>
              <Btn
                onClick={() => {
                  setModal(null);
                  showAd(() => {
                    setBoard((b) => {
                      const nb = b.map((sh) => ({ ...sh, front: [...sh.front], queue: [...sh.queue] }));
                      nb.push({
                        id: 900 + nb.length,
                        front: Array(SHELF_SLOTS).fill(null),
                        queue: [],
                        locked: null,
                        bonus: true,
                      });
                      nb.palette = b.palette;
                      return nb;
                    });
                    setExtraShelves((n) => n + 1);
                    setToast(t.boostShelf);
                  });
                }}
              >
                🗄️ {t.boostShelf}
              </Btn>
              <div style={{ height: 8 }} />
              <button
                onClick={() => {
                  if (!history.length) { setModal(null); restart(world, level); return; }
                  const last = history[history.length - 1];
                  setBoard((b) => {
                    const nb = b.map((sh) => ({ ...sh, front: [...sh.front], queue: [...sh.queue] }));
                    const item = nb[last.to].front[last.toSlot];
                    if (item && nb[last.from].front[last.fromSlot] === null) {
                      nb[last.from].front[last.fromSlot] = item;
                      nb[last.to].front[last.toSlot] = null;
                    }
                    nb.palette = b.palette;
                    return nb;
                  });
                  setHistory((h) => h.slice(0, -1));
                  setModal(null);
                }}
                style={{
                  background: "transparent", border: `1.5px solid ${UI.accent}`, color: UI.accent,
                  borderRadius: 13, padding: "11px 16px", width: "100%", cursor: "pointer",
                  fontFamily: "Fredoka, sans-serif", fontWeight: 600, fontSize: 14,
                }}
              >
                ↩️ {t.boostUndo}
              </button>
              <TextBtn onClick={() => { setModal(null); restart(world, level); }}>
                {t.restartLevel}
              </TextBtn>
            </>
          )}
          {modal === "nolives" && (
            <>
              <div style={{ fontSize: 42 }}>💔</div>
              <div style={{ fontFamily: "Fredoka, sans-serif", fontWeight: 700, fontSize: 20, margin: "6px 0 4px" }}>
                {t.noLivesTitle}
              </div>
              <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 6 }}>{t.noLivesBody}</div>
              {nextLifeAt && (
                <div style={{ fontSize: 13, color: UI.accent, fontWeight: 700, marginBottom: 14, fontFamily: "Fredoka, sans-serif" }}>
                  ⏳ {t.nextLife} {fmtTime(nextLifeAt - now)}
                </div>
              )}
              <Btn
                onClick={() =>
                  showAd(() => {
                    addLives(3);
                    setModal(null);
                    restart(world, level);
                    setToast(t.livesAdded);
                  })
                }
              >
                {t.adLives}
              </Btn>
              <div style={{ height: 8 }} />
              <button
                onClick={() => {
                  if (coins < 90) { setToast(t.notEnough); return; }
                  setCoins((c) => c - 90);
                  addLivesBought(REGEN_CAP);
                  setModal(null);
                  restart(world, level);
                  setToast(t.purchased);
                }}
                style={{
                  background: "transparent", border: `1.5px solid ${UI.accent}`, color: UI.accent,
                  borderRadius: 13, padding: "11px 16px", width: "100%", cursor: "pointer",
                  fontFamily: "Fredoka, sans-serif", fontWeight: 600, fontSize: 14,
                }}
              >
                {t.lifeRefill} — 90 🪙
              </button>
              <TextBtn onClick={() => { setModal(null); setScreen("shop"); }}>
                🛒 {t.shopTitle}
              </TextBtn>
            </>
          )}
        </Overlay>
      )}
    </div>
  );
}

/* ---------- мелкие компоненты ---------- */

/* Ящик с материалами. Дощатый корпус, металлические уголки,
   табличка. Внутри — стопка материалов; двигать можно верхний. */
function BoostBtn({ onClick, icon, label, disabled, cost, coins, adWord }) {
  const affordable = coins >= cost;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1, background: disabled ? "#00000008" : UI.panel,
        border: `1.5px solid ${disabled ? "transparent" : UI.accent + "66"}`,
        borderRadius: 13, padding: "7px 4px", cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontFamily: "Fredoka, sans-serif", fontSize: 10, fontWeight: 600, color: UI.deep }}>
        {label}
      </span>
      <span style={{ fontFamily: "Fredoka, sans-serif", fontSize: 10.5, fontWeight: 700, color: affordable ? UI.accent : UI.deep, opacity: affordable ? 1 : 0.65 }}>
        {affordable ? `${cost} 🪙` : `▶ ${adWord}`}
      </span>
    </button>
  );
}

/* панель ресурсов: жизни с таймером восстановления, монеты, вход в магазин */
function ResourceBar({ t, lives, coins, unlimited, nextLifeAt, now, onShop }) {
  const full = lives >= REGEN_CAP;
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <div
        style={{
          flex: 1, background: UI.panel, borderRadius: 14, padding: "8px 12px",
          display: "flex", alignItems: "center", gap: 8,
          boxShadow: "0 2px 8px rgba(47,58,44,0.07)",
        }}
      >
        <span style={{ fontSize: 17 }}>{unlimited ? "♾️" : "❤️"}</span>
        <span style={{ flex: 1 }}>
          <span style={{ display: "block", fontFamily: "Fredoka, sans-serif", fontWeight: 700, fontSize: 15, color: UI.deep, lineHeight: 1.1 }}>
            {unlimited ? t.unlimitedOn : lives > REGEN_CAP ? `${lives}` : `${lives}/${REGEN_CAP}`}
          </span>
          {!unlimited && (
            <span style={{ display: "block", fontSize: 10.5, opacity: 0.6, lineHeight: 1.3 }}>
              {lives > REGEN_CAP
                ? t.livesStocked
                : full
                ? t.livesFull
                : `${t.nextLife} ${fmtTime((nextLifeAt || 0) - now)}`}
            </span>
          )}
        </span>
      </div>

      <div
        style={{
          background: UI.panel, borderRadius: 14, padding: "8px 12px",
          display: "flex", alignItems: "center", gap: 7,
          boxShadow: "0 2px 8px rgba(47,58,44,0.07)",
        }}
      >
        <span style={{ fontSize: 16 }}>🪙</span>
        <span style={{ fontFamily: "Fredoka, sans-serif", fontWeight: 700, fontSize: 15, color: UI.deep }}>
          {coins}
        </span>
      </div>

      {onShop && (
        <button
          onClick={onShop}
          style={{
            background: UI.accent, border: "none", borderRadius: 14, padding: "8px 13px",
            cursor: "pointer", fontSize: 17, lineHeight: 1,
            boxShadow: "0 2px 8px rgba(208,112,63,0.3)",
          }}
        >
          🛒
        </button>
      )}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div
      style={{
        fontFamily: "Fredoka, sans-serif", fontWeight: 700, fontSize: 14,
        color: UI.deep, marginTop: 10, marginBottom: -3,
      }}
    >
      {children}
    </div>
  );
}

/* строка товара в магазине */
function ShopRow({ icon, title, sub, price, badge, money, disabled, onClick }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        position: "relative", width: "100%", textAlign: "left",
        background: disabled ? "#00000008" : UI.panel,
        border: "1.5px solid " + (money ? UI.accent + "44" : "transparent"),
        borderRadius: 16, padding: "12px 14px",
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
        display: "flex", alignItems: "center", gap: 12,
        boxShadow: disabled ? "none" : "0 2px 10px rgba(47,58,44,0.06)", boxSizing: "border-box"}}
    >
      <span style={{ fontSize: 26 }}>{icon}</span>
      <span style={{ flex: 1 }}>
        <span style={{ display: "block", fontFamily: "Fredoka, sans-serif", fontWeight: 600, fontSize: 14.5, color: UI.deep }}>
          {title}
        </span>
        {sub && <span style={{ display: "block", fontSize: 11.5, opacity: 0.6, marginTop: 1 }}>{sub}</span>}
      </span>
      <span
        style={{
          fontFamily: "Fredoka, sans-serif", fontWeight: 700, fontSize: 14,
          color: money ? "#fff" : UI.deep,
          background: money ? UI.accent : "#00000010",
          borderRadius: 10, padding: "7px 13px", whiteSpace: "nowrap",
        }}
      >
        {price}
      </span>
      {badge && (
        <span
          style={{
            position: "absolute", top: -7, right: 12,
            background: "#3f6244", color: "#fff", borderRadius: 8,
            fontFamily: "Fredoka, sans-serif", fontSize: 9.5, fontWeight: 700,
            padding: "2px 8px", textTransform: "uppercase", letterSpacing: "0.3px",
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function Overlay({ children }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(20,28,20,.45)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 40,
      }}
    >
      <div
        style={{
          background: UI.panel, borderRadius: 22, padding: "26px 22px",
          width: "100%", maxWidth: 330, textAlign: "center",
          animation: "sb-pop .3s ease both", maxHeight: "88vh", overflowY: "auto", boxSizing: "border-box"}}
      >
        {children}
      </div>
    </div>
  );
}

function Slider({ label, value, onChange }) {
  return (
    <div style={{ textAlign: "left", marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, marginBottom: 6, color: UI.deep }}>
        <span>{label}</span>
        <span style={{ opacity: 0.6 }}>{Math.round(value * 100)}</span>
      </div>
      <input
        className="sb-range" type="range" min="0" max="100"
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        style={{ width: "100%" }}
      />
    </div>
  );
}

function RoundBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 28, height: 28, borderRadius: 9, border: "none",
        background: "rgba(253,250,243,0.92)", color: UI.deep,
        fontSize: 14, fontWeight: 700, cursor: "pointer", lineHeight: 1,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      {children}
    </button>
  );
}

function GhostBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, background: "transparent", border: `1.5px solid ${UI.deep}44`, color: UI.deep,
        borderRadius: 13, padding: "11px 8px", fontFamily: "Fredoka, sans-serif",
        fontWeight: 600, fontSize: 13.5, cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function TextBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "none", border: "none", color: UI.deep, opacity: 0.6,
        fontSize: 12, cursor: "pointer", padding: 8, marginTop: 4, width: "100%", boxSizing: "border-box"}}
    >
      {children}
    </button>
  );
}

export function Btn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: UI.accent, color: "#fff", border: "none", borderRadius: 13,
        padding: "13px 16px", fontFamily: "Fredoka, sans-serif", fontWeight: 600,
        fontSize: 15, cursor: "pointer", width: "100%", boxSizing: "border-box"}}
    >
      {children}
    </button>
  );
}
