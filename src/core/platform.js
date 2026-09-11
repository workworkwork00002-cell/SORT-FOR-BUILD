/* ============================================================
   ПЛАТФОРМА (Яндекс Игры)

   Тонкая обёртка над Yandex Games SDK. Смысл файла в том, чтобы
   остальная игра ничего не знала о платформе: она просто просит
   «сохрани», «покажи рекламу», а здесь решается, есть ли SDK.

   Игра обязана работать и без платформы — в dev-режиме, в APK,
   при заблокированном скрипте SDK. Поэтому каждый метод имеет
   запасной вариант, и ни один сбой SDK не должен мешать играть.
   ============================================================ */

let ysdk = null;      // объект SDK, если платформа доступна
let player = null;    // объект игрока, если удалось инициализировать
let initPromise = null;

/* Страховка от «молчащего» SDK.

   SDK общается с площадкой через postMessage в родительский
   фрейм. Если игру открыли не внутри Яндекс Игр — по прямой
   ссылке, локально, в чужом фрейме — сообщения уходить некуда,
   и обещанные колбэки не приходят НИКОГДА. Без таймаута игрок
   получает вечную крутилку «реклама загружается».

   Поэтому каждый вызов к SDK ограничен по времени: не ответил
   вовремя — считаем, что не ответил вообще. */
function withTimeout(promise, ms, fallback) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => {
      if (done) return;
      done = true;
      resolve(v);
    };
    const timer = setTimeout(() => finish(fallback), ms);
    promise.then(
      (v) => { clearTimeout(timer); finish(v); },
      () => { clearTimeout(timer); finish(fallback); }
    );
  });
}

/* Быстрые запросы к SDK: чтение и запись данных, проверки
   доступности. Они обязаны отвечать сразу; если молчат — SDK
   недоступен. */
const T_FAST = 6000;

/* Реклама: сторожим ТОЛЬКО окно до открытия ролика. Как только
   придёт onOpen, сторож снимается, и дальше ролик может идти
   сколько угодно — хоть минуту с финальной карточкой. Обрывать
   его по времени нельзя: игрок досмотрит до конца и не получит
   награду, а это хуже любой зависшей крутилки. */
const T_AD_START = 8000;

/* Игра запущена внутри Яндекс Игр? */
export const onYandex = () => ysdk !== null;

/* Облачные сохранения доступны только при живом объекте player. */
export const hasCloud = () => player !== null;

/* --- инициализация ---
   Вызывается один раз на старте. Никогда не бросает исключение:
   при любой ошибке возвращаемся к локальному режиму. */
export function initPlatform() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (typeof window === "undefined" || !window.YaGames) return false;

    try {
      ysdk = await withTimeout(window.YaGames.init(), T_FAST, null);
    } catch (e) {
      ysdk = null;
    }
    if (!ysdk) return false;

    // Player инициализируем отдельно: он может не подняться
    // (игрок запретил доступ к данным, сетевой сбой), и это не
    // повод отказываться от рекламы и остального SDK.
    try {
      player = await withTimeout(ysdk.getPlayer({ scopes: false }), T_FAST, null);
    } catch (e) {
      player = null;
    }

    return true;
  })();

  return initPromise;
}

/* Сообщаем платформе, что загрузка кончилась и игра готова.
   До этого вызова Яндекс держит свой лоадер поверх игры. */
export function signalReady() {
  try {
    ysdk?.features?.LoadingAPI?.ready();
  } catch (e) {
    /* не критично */
  }
}

/* Отметка о начале игрового процесса — платформа использует её,
   чтобы не показывать рекламу поверх активной партии. */
export function gameplayStart() {
  try {
    ysdk?.features?.GameplayAPI?.start();
  } catch (e) {}
}

export function gameplayStop() {
  try {
    ysdk?.features?.GameplayAPI?.stop();
  } catch (e) {}
}

/* --- хранилище ---
   Наружу отдаём два метода с одинаковым поведением в обоих
   режимах: читаем откуда получится, пишем куда получится. */

export async function cloudGet(key) {
  if (!player) return null;
  try {
    const data = await withTimeout(player.getData([key]), T_FAST, null);
    if (!data) return null;
    return data && typeof data[key] === "string" ? data[key] : null;
  } catch (e) {
    return null;
  }
}

/* flush=true отправляет данные немедленно (перед уходом со
   страницы), иначе запись становится в очередь SDK. */
export async function cloudSet(key, value, flush = false) {
  if (!player) return false;
  try {
    const ok = await withTimeout(player.setData({ [key]: value }, flush).then(() => true), T_FAST, false);
    return ok;
  } catch (e) {
    return false;
  }
}

/* --- реклама ---
   Обе функции всегда резолвятся. Вызывающий код не должен
   зависеть от того, показалась реклама или нет. */

/* Полноэкранная вставка. Резолвится после закрытия. */
export function showFullscreenAd() {
  return new Promise((resolve) => {
    if (!ysdk?.adv?.showFullscreenAdv) {
      resolve(false);
      return;
    }
    let done = false;
    const finish = (shown) => {
      if (done) return;
      done = true;
      clearTimeout(guard);
      resolve(shown);
    };
    // если колбэки не придут — выходим сами
    // сторож только до старта ролика
    const guard = setTimeout(() => finish(false), T_AD_START);
    try {
      ysdk.adv.showFullscreenAdv({
        callbacks: {
          onOpen: () => clearTimeout(guard),
          onClose: (wasShown) => finish(!!wasShown),
          onError: () => finish(false),
        },
      });
    } catch (e) {
      finish(false);
    }
  });
}

/* Реклама за награду. Резолвится в true, только если ролик
   досмотрен до конца — награду выдаём строго по этому флагу. */
export function showRewardedAd() {
  return new Promise((resolve) => {
    if (!ysdk?.adv?.showRewardedVideo) {
      resolve(false);
      return;
    }
    let rewarded = false;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(guard);
      resolve(rewarded);
    };
    const guard = setTimeout(finish, T_AD_START);
    try {
      ysdk.adv.showRewardedVideo({
        callbacks: {
          // ролик пошёл — снимаем ограничение по времени
          onOpen: () => clearTimeout(guard),
          onRewarded: () => { rewarded = true; },
          onClose: finish,
          onError: finish,
        },
      });
    } catch (e) {
      finish();
    }
  });
}

/* --- ярлык на рабочий стол ---
   Игрок, поставивший ярлык, возвращается заметно чаще: игра
   перестаёт быть случайной вкладкой и становится иконкой рядом
   с остальными. Спрашивать можно не всегда — доступность зависит
   от устройства и браузера, поэтому сначала проверка. */

export async function canAddShortcut() {
  if (!ysdk?.shortcut?.canShowPrompt) return false;
  try {
    const res = await withTimeout(ysdk.shortcut.canShowPrompt(), T_FAST, null);
    return !!res?.canShow;
  } catch (e) {
    return false;
  }
}

/* true — игрок согласился и ярлык создан. */
export async function addShortcut() {
  if (!ysdk?.shortcut?.showPrompt) return false;
  try {
    // окно закрывает сам игрок — по времени не обрываем
    const res = await ysdk.shortcut.showPrompt();
    return res?.outcome === "accepted";
  } catch (e) {
    return false;
  }
}

/* --- оценка игры ---
   Просить можно один раз за сессию и только у авторизованного
   игрока, который ещё не оценивал. Платформа сама это отслеживает,
   наше дело — спросить у неё перед показом. */

export async function canReview() {
  if (!ysdk?.feedback?.canReview) return false;
  try {
    const res = await withTimeout(ysdk.feedback.canReview(), T_FAST, null);
    return !!res?.value;
  } catch (e) {
    return false;
  }
}

export async function requestReview() {
  if (!ysdk?.feedback?.requestReview) return false;
  try {
    // окно закрывает сам игрок — по времени не обрываем
    const res = await ysdk.feedback.requestReview();
    return !!res?.feedbackSent;
  } catch (e) {
    return false;
  }
}

/* --- язык площадки ---
   Яндекс сообщает язык интерфейса пользователя. Используем его
   как стартовое значение, если игрок ещё не выбирал язык сам. */
export function platformLang() {
  try {
    return ysdk?.environment?.i18n?.lang || null;
  } catch (e) {
    return null;
  }
}
