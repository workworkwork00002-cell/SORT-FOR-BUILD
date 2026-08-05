import React, { useState, useEffect, useRef } from "react";
import { CRATE_STYLES, WORLD_CRATE } from "../core/economy";
import { UI } from "../core/geometry";
import { SHELF_SLOTS, openSlots } from "../core/shelves";


/* ============================================================
   2D-ПОЛЕ: ПОЛКИ
   Полки стоят сеткой по две в ряду и уходят вниз ярусами.
   Предмет перетаскивается пальцем на нужную полку.

   Предметы из глубины не возникают из ниоткуда: пока витрина
   занята, они видны позади силуэтами. Как только витрина
   опустеет целиком, они выезжают вперёд.
   ============================================================ */
export function Board2D({
  board, cfg, justMatched, blockedAt, worldKey, onDrop, shake,
}) {
  const S = CRATE_STYLES[WORLD_CRATE[worldKey]] || CRATE_STYLES.wood;
  const [drag, setDrag] = useState(null);   // {si, slot, item, x, y}
  const [overSlot, setOverSlot] = useState(null);
  const slotRefs = useRef(new Map());
  const wrapRef = useRef(null);

  /* какой слот под пальцем */
  const slotAt = (cx, cy) => {
    for (const [key, el] of slotRefs.current) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) {
        const [si, slot] = key.split(":").map(Number);
        return { si, slot };
      }
    }
    return null;
  };

  const onDown = (e, si, slot, item) => {
    if (!item || board[si].locked) return;
    if (item.pinned) return; // 📌 приклеен, не берётся
    e.preventDefault();
    setDrag({ si, slot, item, x: e.clientX, y: e.clientY });
    setOverSlot(null);
  };

  useEffect(() => {
    if (!drag) return;
    const move = (e) => {
      setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
      const hit = slotAt(e.clientX, e.clientY);
      setOverSlot(hit && hit.si !== drag.si ? hit : hit);
    };
    const up = (e) => {
      const hit = slotAt(e.clientX, e.clientY);
      if (hit) onDrop(drag.si, drag.slot, hit.si, hit.slot);
      setDrag(null);
      setOverSlot(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [drag, onDrop]);

  // по две полки в ряду
  const rows = [];
  for (let i = 0; i < board.length; i += 2) rows.push(board.slice(i, i + 2));

  return (
    <div
      ref={wrapRef}
      style={{
        background: UI.panel, borderRadius: 18, padding: "14px 10px",
        boxShadow: "0 4px 16px rgba(47,58,44,0.08)",
        display: "flex", flexDirection: "column", gap: 12,
        animation: shake ? "sb-shake .4s ease" : "none",
        touchAction: "none",
      }}
    >
      {rows.map((row, ri) => (
        <div key={ri} style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          {row.map((sh) => {
            const si = board.indexOf(sh);
            const celebrating = justMatched.includes(si);
            const hasRoom = !sh.locked && openSlots(sh) > 0;
            return (
              <div
                key={sh.id}
                className={celebrating ? "sb-crate-done" : ""}
                style={{
                  position: "relative", flex: 1, minWidth: 0,
                  padding: "16px 7px 11px",
                  borderRadius: "7px 7px 4px 4px",
                  background: sh.bonus
                    ? "linear-gradient(180deg, #d8b98a, #b8945f)"
                    : S.body,
                  border: `2px solid ${S.edge}`,
                  boxShadow: `inset 0 -6px 10px ${S.shadow}, 0 3px 7px rgba(0,0,0,.18)`,
                  opacity: sh.locked ? 0.8 : 1,
                }}
              >
                {/* задняя стенка — на её фоне видны силуэты */}
                <span
                  style={{
                    position: "absolute", left: 3, right: 3, top: 3, height: 26,
                    borderRadius: 4, background: "rgba(0,0,0,.16)",
                  }}
                />

                {/* силуэты тех, кто ждёт в глубине */}
                <div
                  style={{
                    position: "absolute", left: 7, right: 7, top: 6,
                    display: "flex", gap: 4, justifyContent: "center",
                    pointerEvents: "none",
                  }}
                >
                  {sh.queue.slice(0, SHELF_SLOTS).map((q, k) => (
                    <span
                      key={k}
                      style={{
                        flex: 1, height: 20, borderRadius: 6,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13,
                        background: "rgba(0,0,0,.22)",
                        filter: "grayscale(1) brightness(0.55)",
                        opacity: 0.75,
                      }}
                    >
                      {q.mystery ? "❓" : q.e}
                    </span>
                  ))}
                </div>

                {/* витрина */}
                <div style={{ display: "flex", gap: 4, position: "relative", marginTop: 12 }}>
                  {sh.front.map((item, slot) => {
                    const over = overSlot && overSlot.si === si;
                    const dragged = drag && drag.si === si && drag.slot === slot;
                    return (
                      <div
                        key={slot}
                        ref={(el) => slotRefs.current.set(`${si}:${slot}`, el)}
                        data-slot={`${si}:${slot}`}
                        onPointerDown={(e) => onDown(e, si, slot, item)}
                        style={{
                          flex: 1, height: 50, position: "relative",
                          border: item
                            ? "none"
                            : `2px dashed ${hasRoom ? "rgba(255,255,255,.9)" : "rgba(255,255,255,.28)"}`,
                          borderRadius: 11,
                          background: over && hasRoom
                            ? "rgba(255,255,255,.3)"
                            : item ? "transparent" : "rgba(255,255,255,.14)",
                          cursor: item ? "grab" : "default",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "background .12s ease",
                        }}
                      >
                        {item && !dragged && (
                          <span
                            style={{
                              width: 44, height: 44, borderRadius: "26%",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 26,
                              background: item.c,
                              filter: "saturate(1.4) brightness(1.08)",
                              border: "1.5px solid rgba(255,255,255,.75)",
                              boxShadow: "0 3px 6px rgba(0,0,0,.28), inset 0 2px 2px rgba(255,255,255,.5)",
                              position: "relative",
                              animation:
                                blockedAt === item.id ? "sb-shake .3s ease" : "sb-pop .2s ease both",
                            }}
                          >
                            {item.e}
                            {/* 📌 приклеен к месту */}
                            {item.pinned && (
                              <span style={{ position: "absolute", top: -4, right: -3, fontSize: 13 }}>📌</span>
                            )}
                            {/* 🔗 носится в паре */}
                            {item.chain && (
                              <span style={{ position: "absolute", bottom: -4, left: -3, fontSize: 12 }}>🔗</span>
                            )}
                          </span>
                        )}
                        {/* ❄️ место подо льдом: сюда нельзя ставить */}
                        {!item && sh.frozen && sh.frozen[slot] && (
                          <span
                            style={{
                              display: "flex", flexDirection: "column",
                              alignItems: "center", gap: 1,
                            }}
                          >
                            <span style={{ fontSize: 15 }}>❄️</span>
                            <span
                              style={{
                                width: 19, height: 19, borderRadius: "50%",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 11, background: "rgba(255,255,255,.95)",
                                border: `2px solid ${sh.frozenColor || "#7fd8ff"}`,
                              }}
                            >
                              {sh.frozen[slot]}
                            </span>
                          </span>
                        )}
                        {!item && hasRoom && !(sh.frozen && sh.frozen[slot]) && (
                          <span style={{ fontSize: 16, color: "rgba(255,255,255,.8)" }}>+</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ⚖️ полка принимает только этот материал */}
                {sh.only && (
                  <span
                    style={{
                      position: "absolute", top: 3, left: 6,
                      display: "flex", alignItems: "center", gap: 3,
                      background: "rgba(255,255,255,.94)",
                      borderRadius: 8, padding: "1px 5px",
                      border: `2px solid ${sh.onlyColor || UI.accent}`,
                      fontSize: 12, zIndex: 3,
                    }}
                  >
                    <span style={{ fontSize: 9 }}>⚖️</span>
                    {sh.only}
                  </span>
                )}

                {/* планка полки */}
                <span
                  style={{
                    position: "absolute", left: 0, right: 0, bottom: 0, height: 6,
                    background: S.rim, borderRadius: "0 0 3px 3px",
                  }}
                />

                {sh.queue.length > SHELF_SLOTS && (
                  <span
                    style={{
                      position: "absolute", top: 3, right: 6,
                      fontFamily: "Fredoka, sans-serif", fontWeight: 800, fontSize: 9.5,
                      color: "rgba(255,255,255,.95)", textShadow: "0 1px 2px rgba(0,0,0,.5)",
                    }}
                  >
                    +{sh.queue.length - SHELF_SLOTS}
                  </span>
                )}

                {sh.locked && (
                  <span
                    style={{
                      position: "absolute", inset: 0, borderRadius: 7,
                      background: "rgba(30,26,22,.58)",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                  >
                    <span style={{ fontSize: 19 }}>🔒</span>
                    <span
                      style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: "rgba(255,255,255,.95)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16,
                        border: `2px solid ${sh.lockColor || "#e0b545"}`,
                      }}
                    >
                      {sh.locked}
                    </span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* предмет, который тащат пальцем */}
      {drag && (
        <span
          style={{
            position: "fixed", left: drag.x, top: drag.y,
            transform: "translate(-50%, -50%) scale(1.15)",
            width: 44, height: 44, borderRadius: "26%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, background: drag.item.c,
            filter: "saturate(1.4) brightness(1.12)",
            border: `2.5px solid ${UI.accent}`,
            boxShadow: `0 0 0 3px ${UI.accent}44, 0 8px 16px rgba(0,0,0,.35)`,
            pointerEvents: "none", zIndex: 999,
          }}
        >
          {drag.item.e}
        </span>
      )}
    </div>
  );
}
