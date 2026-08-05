import React from "react";
import { Btn } from "../App";
import { UI } from "../core/geometry";
import { SHELF_SLOTS } from "../core/shelves";
import { it } from "../world/builders/resort";


/* ============================================================
   ОБУЧЕНИЕ
   Правила объясняются действием: каждый шаг ждёт, пока игрок
   сам его выполнит, и только потом показывает следующий.
   Текста минимум — палец-указатель и одна фраза.

   Шаги привязаны не к номеру уровня, а к состоянию поля:
   если игрок случайно собрал тройку раньше, обучение просто
   перейдёт дальше, а не будет требовать уже сделанного.
   ============================================================ */

export const TUTORIAL_STEPS = [
  {
    id: "drag",
    /* показываем палец на предмете, который можно куда-то перетащить */
    key: "tutDrag",
    done: (st) => st.moves > 0,
  },
  {
    id: "match",
    key: "tutMatch",
    done: (st) => st.matches > 0,
  },
  {
    id: "queue",
    key: "tutQueue",
    /* шаг показывается, только если в глубине кто-то есть */
    skip: (st) => !st.board.some((sh) => sh.queue.length > 0),
    done: (st) => st.matches >= 2,
  },
  {
    id: "room",
    key: "tutRoom",
    done: (st) => st.matches >= 3,
  },
];

/* Подсказка обучения: палец над нужным местом и короткая фраза. */
export function TutorialHint({ step, t, targetRect, onSkip }) {
  if (!step) return null;
  return (
    <>
      {/* палец-указатель над целью */}
      {targetRect && (
        <span
          className="sb-tut-hand"
          style={{
            position: "fixed",
            left: targetRect.x,
            top: targetRect.y,
            transform: "translate(-50%, -10%)",
            fontSize: 30,
            pointerEvents: "none",
            zIndex: 900,
            filter: "drop-shadow(0 3px 6px rgba(0,0,0,.4))",
          }}
        >
          👆
        </span>
      )}

      {/* фраза внизу, чтобы не закрывать поле */}
      <div
        style={{
          position: "fixed",
          left: "50%",
          bottom: 92,
          transform: "translateX(-50%)",
          maxWidth: 340,
          width: "calc(100% - 40px)",
          background: "rgba(47,58,44,.94)",
          color: "#fff",
          borderRadius: 16,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,.3)",
          zIndex: 901,
          animation: "sb-pop .25s ease both",
        }}
      >
        <span style={{ fontSize: 20 }}>💡</span>
        <span
          style={{
            flex: 1,
            fontFamily: "Nunito, sans-serif",
            fontSize: 13.5,
            lineHeight: 1.4,
          }}
        >
          {t[step.key]}
        </span>
        <button
          onClick={onSkip}
          style={{
            background: "rgba(255,255,255,.16)",
            border: "none",
            borderRadius: 9,
            color: "#fff",
            fontFamily: "Fredoka, sans-serif",
            fontWeight: 600,
            fontSize: 11.5,
            padding: "6px 10px",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          {t.tutSkip}
        </button>
      </div>
    </>
  );
}

/* Куда показывать палец: ищем предмет, который стоит перетащить.

   Для первого шага нужен ход, ведущий к тройке: берём предмет,
   у которого есть пара на другой полке со свободным местом.
   Если такого нет — просто первый доступный предмет. */
export function tutorialTarget(board) {
  const counts = {};
  board.forEach((sh) =>
    sh.front.forEach((x) => {
      if (x) counts[x.e] = (counts[x.e] || 0) + 1;
    })
  );

  // предмет, у которого есть хотя бы два собрата на витринах
  for (let si = 0; si < board.length; si++) {
    const sh = board[si];
    if (sh.locked) continue;
    for (let slot = 0; slot < SHELF_SLOTS; slot++) {
      const it = sh.front[slot];
      if (!it || counts[it.e] < 3) continue;
      // есть ли полка, куда его можно поставить
      const dest = board.findIndex(
        (o, oi) => oi !== si && !o.locked && o.front.some((x) => x === null)
      );
      if (dest >= 0) return { si, slot };
    }
  }
  // запасной вариант: любой предмет, который есть куда переставить
  for (let si = 0; si < board.length; si++) {
    const sh = board[si];
    if (sh.locked) continue;
    for (let slot = 0; slot < SHELF_SLOTS; slot++) {
      if (!sh.front[slot]) continue;
      const dest = board.findIndex(
        (o, oi) => oi !== si && !o.locked && o.front.some((x) => x === null)
      );
      if (dest >= 0) return { si, slot };
    }
  }
  return null;
}

/* ============================================================
   ПЕРВАЯ ВСТРЕЧА С МЕХАНИКОЙ

   Базовое обучение объясняет правила игры и идёт один раз.
   Но осложнения появляются много позже: замок на 40-м уровне,
   сцепка на 230-м. Игрок к тому моменту давно прошёл обучение
   и встречает новую механику без единого слова.

   Поэтому каждая механика показывает карточку при первом
   появлении. Показ отмечается в сохранении, повторно карточка
   не всплывает.
   ============================================================ */

const MECHANIC_INTROS = [
  {
    id: "joker",
    icon: "⭐",
    titleKey: "mJokerTitle",
    bodyKey: "mJokerBody",
    /* сработает, когда на поле реально появился джокер */
    present: (board) =>
      board.some((sh) =>
        [...sh.front, ...sh.queue].some((x) => x && x.special === "joker")
      ),
  },
  {
    id: "lock",
    icon: "🔒",
    titleKey: "mLockTitle",
    bodyKey: "mLockBody",
    present: (board) => board.some((sh) => sh.locked),
  },
  {
    id: "ice",
    icon: "❄️",
    titleKey: "mIceTitle",
    bodyKey: "mIceBody",
    present: (board) =>
      board.some((sh) => sh.frozen && Object.keys(sh.frozen).length > 0),
  },
  {
    id: "mystery",
    icon: "🎁",
    titleKey: "mMysteryTitle",
    bodyKey: "mMysteryBody",
    present: (board) => board.some((sh) => sh.queue.some((x) => x.mystery)),
  },
  {
    id: "pinned",
    icon: "📌",
    titleKey: "mPinnedTitle",
    bodyKey: "mPinnedBody",
    present: (board) => board.some((sh) => sh.front.some((x) => x && x.pinned)),
  },
  {
    id: "only",
    icon: "⚖️",
    titleKey: "mOnlyTitle",
    bodyKey: "mOnlyBody",
    present: (board) => board.some((sh) => sh.only),
  },
  {
    id: "chain",
    icon: "🔗",
    titleKey: "mChainTitle",
    bodyKey: "mChainBody",
    present: (board) =>
      board.some((sh) => [...sh.front, ...sh.queue].some((x) => x && x.chain)),
  },
];

/* Какую механику показать: первая из встреченных, о которой
   игрок ещё не знает. */
function findNewMechanic(board, seen) {
  for (const m of MECHANIC_INTROS) {
    if (seen.includes(m.id)) continue;
    if (m.present(board)) return m;
  }
  return null;
}

/* Карточка знакомства с механикой. */
function MechanicIntro({ mech, t, onClose }) {
  if (!mech) return null;
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 950,
        background: "rgba(20,24,20,.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 22,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: UI.panel, borderRadius: 22, padding: "24px 22px 18px",
          maxWidth: 320, width: "100%", textAlign: "center",
          boxShadow: "0 16px 40px rgba(0,0,0,.35)",
          animation: "sb-pop .28s cubic-bezier(.34,1.56,.64,1) both",
        }}
      >
        <div
          style={{
            fontSize: 46, marginBottom: 6,
            animation: "sb-float 2.4s ease-in-out infinite",
          }}
        >
          {mech.icon}
        </div>
        <div
          style={{
            fontFamily: "Fredoka, sans-serif", fontWeight: 700,
            fontSize: 19, color: UI.deep, marginBottom: 8,
          }}
        >
          {t[mech.titleKey]}
        </div>
        <div style={{ fontSize: 13.5, lineHeight: 1.5, opacity: 0.78, marginBottom: 18 }}>
          {t[mech.bodyKey]}
        </div>
        <Btn onClick={onClose}>{t.gotIt}</Btn>
      </div>
    </div>
  );
}

/* ============================================================
   КАРТОЧКИ ПЕРВОЙ ВСТРЕЧИ

   Базовое обучение объясняет правила игры, но каждая механика
   осложнения появляется молча: игрок видит новый значок и не
   знает, что он означает. Поэтому при первой встрече с каждой
   механикой игра один раз показывает карточку.

   Показ привязан к тому, что реально лежит на поле, а не к
   номеру уровня: генератор может выдать механику раньше или
   позже расчётного, и объяснение должно прийти вместе с ней.
   ============================================================ */

const MECHANIC_CARDS = [
  {
    id: "joker",
    icon: "⭐",
    /* джокер подходит к любому материалу */
    present: (b) =>
      b.some((sh) =>
        [...sh.front, ...sh.queue].some((x) => x && x.special === "joker")
      ),
  },
  {
    id: "lock",
    icon: "🔒",
    present: (b) => b.some((sh) => sh.locked),
  },
  {
    id: "frozen",
    icon: "❄️",
    present: (b) => b.some((sh) => sh.frozen && Object.keys(sh.frozen).length),
  },
  {
    id: "mystery",
    icon: "🎁",
    present: (b) => b.some((sh) => sh.queue.some((x) => x && x.mystery)),
  },
  {
    id: "pinned",
    icon: "📌",
    present: (b) => b.some((sh) => sh.front.some((x) => x && x.pinned)),
  },
  {
    id: "only",
    icon: "⚖️",
    present: (b) => b.some((sh) => sh.only),
  },
  {
    id: "chain",
    icon: "🔗",
    present: (b) =>
      b.some((sh) => [...sh.front, ...sh.queue].some((x) => x && x.chain)),
  },
];

/* Первая невиданная механика на поле, или null. */
export function firstNewMechanic(board, seen) {
  for (const c of MECHANIC_CARDS) {
    if (seen.includes(c.id)) continue;
    if (c.present(board)) return c;
  }
  return null;
}

/* Карточка механики: значок, название, одна фраза правила. */
export function MechanicCard({ card, t, onClose }) {
  if (!card) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 950,
        background: "rgba(20,24,20,.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
        animation: "sb-pop .2s ease both",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: UI.panel, borderRadius: 22, padding: "24px 22px 18px",
          maxWidth: 320, width: "100%", textAlign: "center",
          boxShadow: "0 16px 40px rgba(0,0,0,.32)",
        }}
      >
        <div
          style={{
            fontSize: 46, marginBottom: 6,
            animation: "sb-crate-done .7s cubic-bezier(.34,1.56,.64,1)",
          }}
        >
          {card.icon}
        </div>
        <div
          style={{
            fontFamily: "Fredoka, sans-serif", fontWeight: 700,
            fontSize: 19, color: UI.deep, marginBottom: 6,
          }}
        >
          {t[`mech_${card.id}_title`]}
        </div>
        <div
          style={{
            fontSize: 13.5, lineHeight: 1.5, opacity: 0.78,
            marginBottom: 18, color: UI.ink,
          }}
        >
          {t[`mech_${card.id}_body`]}
        </div>
        <Btn onClick={onClose}>{t.gotIt}</Btn>
      </div>
    </div>
  );
}
