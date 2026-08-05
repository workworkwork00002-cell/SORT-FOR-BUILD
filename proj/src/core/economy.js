import { volcano } from "../world/builders/antique";
import { B } from "../world/worlds";


/* ============================================================
   ЭКОНОМИКА
   ============================================================ */

/* Восстановление само добивает запас только до пяти сердец.
   Купленные жизни складываются сверху и потолком не срезаются:
   было 5, купил 10 — стало 15. */
export const REGEN_CAP = 5;
export const MAX_LIVES = REGEN_CAP;            // потолок восстановления
export const LIFE_REGEN_MS = 25 * 60 * 1000;   // одна жизнь раз в 25 минут
export const START_COINS = 150;

/* стоимость бустов в монетах (либо реклама бесплатно) */
export const BOOST_COST = { undo: 30, shuffle: 50, slot: 40 };

/* Товары за монеты — мягкая валюта */
export const LIFE_OFFERS = [
  { id: "life1", icon: "❤️", titleKey: "lifeOne", amount: 1, coins: 25 },
  { id: "refill", icon: "💗", titleKey: "lifeRefill", amount: MAX_LIVES, coins: 90 },
];

/* Товары за деньги. Цены — реальные тиры сторов:
   ниже $0.99 продавать невозможно, это минимальный тир App Store и Google Play. */
export const IAP_LIVES = [
  { id: "livepack", icon: "💖", titleKey: "livePack", lives: 10, price: "$0.99" },
  { id: "unlimited", icon: "♾️", titleKey: "unlimited", unlimitedMin: 60, price: "$1.99", badge: "popular" },
];

export const IAP_COINS = [
  { id: "c1", icon: "🪙", coins: 500, price: "$0.99" },
  { id: "c2", icon: "💰", coins: 1200, price: "$1.99", badge: "popular" },
  { id: "c3", icon: "💎", coins: 3000, price: "$4.99" },
  { id: "c4", icon: "👑", coins: 7000, price: "$9.99", badge: "bestValue" },
];

/* формат таймера восстановления */
export function fmtTime(ms) {
  if (ms <= 0) return "0:00";
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* Разблокировка мира: либо бесплатно за прохождение предыдущего,
   либо сразу за деньги. Тиры реальные — ниже $0.99 сторы не пропускают. */
const WORLD_PRICES = ["", "$1.99", "$1.99", "$2.99", "$2.99", "$2.99", "$3.99", "$3.99", "$4.99"];
export const worldPrice = (idx) => WORLD_PRICES[idx] || "$2.99";

/* Комплект: все миры разом — выгоднее, чем покупать по одному */
export const BUNDLE_ALL = { id: "bundle", icon: "🌍", price: "$14.99" };

/* ============================================================
   ВИД ЯЩИКОВ
   Каждому миру — своя тара: деревянный ящик, железный
   инструментальный, плетёная корзина или контейнер.
   ============================================================ */
export const CRATE_STYLES = {
  wood: {
    body: "linear-gradient(178deg, #c48b52 0%, #a8703c 45%, #8a5a2e 100%)",
    back: "#6e4522", rim: "#d19a5f", edge: "#5a3618",
    seam: "rgba(70,40,15,.5)", highlight: "rgba(255,225,180,.28)",
    shadow: "rgba(45,25,8,.6)", grain: 0.5,
    metal: "#6e757c", metalLight: "#a8b0b8", rivet: "#4a5057",
    plate: "#f0dcae", plateDark: "#d4bd8a", plateInk: "#5a3618",
    planks: "v", mark: "№",
  },
  toolbox: {
    body: "linear-gradient(178deg, #e0654a 0%, #c04532 45%, #9a3323 100%)",
    back: "#7a2418", rim: "#ec7a5e", edge: "#66190f",
    seam: "rgba(60,15,10,.45)", highlight: "rgba(255,205,190,.3)",
    shadow: "rgba(55,12,6,.6)", grain: 0.22,
    metal: "#98a0a8", metalLight: "#dfe4e8", rivet: "#5f666d",
    plate: "#f5efe2", plateDark: "#dcd3c2", plateInk: "#7a2418",
    planks: "h", mark: "",
  },
  basket: {
    body: "linear-gradient(178deg, #e0b878 0%, #c49a56 45%, #a67f3e 100%)",
    back: "#8a6428", rim: "#ecc98c", edge: "#7a5620",
    seam: "rgba(90,60,20,.55)", highlight: "rgba(255,240,200,.3)",
    shadow: "rgba(75,50,15,.55)", grain: 0.15,
    metal: "#a8895a", metalLight: "#d8bd8e", rivet: "#7a5a30",
    plate: "#f7ecd0", plateDark: "#e0d2ae", plateInk: "#7a5620",
    planks: "weave", mark: "",
  },
  container: {
    body: "linear-gradient(178deg, #5ea0c0 0%, #3f7d9e 45%, #2d5f7c 100%)",
    back: "#234a5e", rim: "#79b6d2", edge: "#1c3e4f",
    seam: "rgba(12,38,52,.5)", highlight: "rgba(205,240,255,.3)",
    shadow: "rgba(10,32,45,.6)", grain: 0.2,
    metal: "#9fadb6", metalLight: "#dae4ea", rivet: "#5d6a72",
    plate: "#e2eef4", plateDark: "#c4d6df", plateInk: "#1c3e4f",
    planks: "h", mark: "",
  },
  stone: {
    body: "linear-gradient(178deg, #b8b2a4 0%, #97917f 45%, #7c7666 100%)",
    back: "#5e5a50", rim: "#c9c3b4", edge: "#514d44",
    seam: "rgba(48,45,38,.5)", highlight: "rgba(255,252,240,.3)",
    shadow: "rgba(40,37,30,.55)", grain: 0.3,
    metal: "#7e858c", metalLight: "#b6bdc4", rivet: "#565c62",
    plate: "#ece6d6", plateDark: "#d2ccbb", plateInk: "#514d44",
    planks: "h", mark: "",
  },
};

/* какая тара в каком мире */
export const WORLD_CRATE = {
  village: "wood", town: "wood", city: "container", antique: "stone",
  castle: "wood", winter: "wood", sakura: "basket", night: "container",
  airport: "container", desert: "basket", park: "toolbox",
  volcano: "stone", railway: "toolbox", harbor: "container", resort: "basket",
};

/* Ровная сетка ящиков: подбираем число колонок так, чтобы
   последний ряд не оставался с одиноким ящиком. */
function crateCols(n) {
  if (n <= 4) return n;
  for (const c of [4, 3, 5]) {
    const rest = n % c;
    if (rest === 0 || rest >= 2) return c;
  }
  return 3;
}

/* смешивание цветов — чтобы плитки были непрозрачными,
   но сохраняли светлый верхний блик */
function mixHex(a, b, k) {
  const p = (h) => {
    const s = h.replace("#", "");
    const v = s.length === 3 ? s.split("").map((c) => c + c).join("") : s;
    return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
  };
  try {
    const A = p(a);
    const B = p(b);
    const m = A.map((v, i) => Math.round(v + (B[i] - v) * k));
    return "#" + m.map((v) => v.toString(16).padStart(2, "0")).join("");
  } catch (e) {
    return a;
  }
}
