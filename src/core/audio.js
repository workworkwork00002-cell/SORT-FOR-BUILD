
/* ============================================================
   ЗВУК (синтез через WebAudio, без внешних файлов)
   ============================================================ */
export function createAudio() {
  let ctx = null;
  let musicGain = null;
  let sfxGain = null;
  let loopId = null;
  let step = 0;
  const state = { music: 0.35, sfx: 0.6 };

  const ensure = () => {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    musicGain = ctx.createGain();
    musicGain.gain.value = state.music * 0.25;
    musicGain.connect(ctx.destination);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = state.sfx;
    sfxGain.connect(ctx.destination);
    return ctx;
  };

  // мягкая пентатоника — не надоедает на длинной сессии
  const SCALE = [261.6, 293.7, 329.6, 392.0, 440.0, 523.3, 587.3, 659.3];
  const PATTERN = [0, 2, 4, 3, 5, 4, 2, 1, 0, 3, 5, 6];

  const note = (freq, dur, gainNode, type = "sine", vol = 0.25, when = 0) => {
    if (!ctx) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(gainNode);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  };

  return {
    unlock() {
      const c = ensure();
      if (c && c.state === "suspended") c.resume();
    },
    /* Глушим всё разом: на время рекламного ролика и когда вкладку
       свернули. Останавливать сам аудиоконтекст надёжнее, чем
       крутить громкость — иначе поверх чужого ролика продолжает
       звенеть наша музыка, а это первое, за что площадка снимает
       игру с модерации. */
    suspendAll() {
      if (ctx && ctx.state === "running") ctx.suspend();
    },
    resumeAll() {
      if (ctx && ctx.state === "suspended") ctx.resume();
    },
    startMusic() {
      const c = ensure();
      if (!c || loopId) return;
      loopId = setInterval(() => {
        if (!ctx || state.music <= 0) return;
        const i = PATTERN[step % PATTERN.length];
        note(SCALE[i], 1.2, musicGain, "sine", 0.22);
        if (step % 4 === 0) note(SCALE[i] / 2, 1.8, musicGain, "triangle", 0.14);
        step++;
      }, 520);
    },
    stopMusic() {
      if (loopId) clearInterval(loopId);
      loopId = null;
    },
    setMusic(v) {
      state.music = v;
      if (musicGain) musicGain.gain.value = v * 0.25;
    },
    setSfx(v) {
      state.sfx = v;
      if (sfxGain) sfxGain.gain.value = v;
    },
    tap(i = 0) {
      ensure();
      note(440 + (i % 6) * 55, 0.14, sfxGain, "triangle", 0.18);
    },
    match() {
      ensure();
      [523.3, 659.3, 784.0].forEach((f, i) => note(f, 0.3, sfxGain, "sine", 0.22, i * 0.06));
    },
    fail() {
      ensure();
      note(160, 0.35, sfxGain, "sawtooth", 0.16);
      note(120, 0.4, sfxGain, "sine", 0.14, 0.08);
    },
    complete() {
      ensure();
      [523.3, 659.3, 784.0, 1046.5].forEach((f, i) => note(f, 0.45, sfxGain, "sine", 0.24, i * 0.11));
    },
  };
}

