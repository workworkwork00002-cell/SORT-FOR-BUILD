
/* ============================================================
   ТАКТИЛЬНАЯ ОТДАЧА
   Веб использует navigator.vibrate — он работает на Android
   (Chrome, Firefox, Samsung Internet), но НЕ поддерживается
   в Safari на iPhone. Поэтому паттерны названы так же, как
   нативные типы iOS: при сборке в нативную оболочку
   (Capacitor / React Native / Swift) достаточно подменить
   реализацию fire() на UIImpactFeedbackGenerator —
   вся остальная логика останется прежней.
   ============================================================ */

const HAPTIC_PATTERNS = {
  light: 8,                    // iOS: impact .light — тап по плитке
  medium: 18,                  // iOS: impact .medium — скол льда, покупка
  heavy: 32,                   // iOS: impact .heavy — тяжёлое действие
  success: [10, 35, 18],       // iOS: notification .success — собрана тройка
  warning: [16, 50, 16],       // iOS: notification .warning
  error: [34, 45, 34],         // iOS: notification .error — поднос переполнен
  build: [14, 28, 14, 28, 40], // здание построено
  fanfare: [12, 24, 12, 24, 12, 24, 60], // мир достроен
};

export function createHaptics() {
  const supported =
    typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
  let enabled = true;
  let last = 0;

  const fire = (kind) => {
    if (!enabled || !supported) return;
    // не частим: подряд идущие тапы иначе сливаются в непрерывную дрожь
    const now = Date.now();
    if (kind === "light" && now - last < 45) return;
    last = now;
    const p = HAPTIC_PATTERNS[kind];
    if (p === undefined) return;
    try {
      navigator.vibrate(p);
    } catch (e) {
      /* некоторые браузеры запрещают вибрацию без жеста — игнорируем */
    }
  };

  return {
    supported,
    setEnabled(v) {
      enabled = v;
      if (v) fire("light"); // подтверждаем включение коротким откликом
    },
    tap: () => fire("light"),
    crack: () => fire("medium"),
    match: () => fire("success"),
    fail: () => fire("error"),
    build: () => fire("build"),
    worldDone: () => fire("fanfare"),
    buy: () => fire("medium"),
    blocked: () => fire("warning"),
  };
}
