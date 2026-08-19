"use client";

type Sounds = {
  startRing: () => void;
  stopRing: () => void;
  chime: (up: boolean) => void;
};

function makeSounds(): Sounds {
  let ctx: AudioContext | null = null;
  let ringTimer: number | null = null;

  const ensure = () => {
    if (typeof window === "undefined") return null;
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => null);
    return ctx;
  };

  const beep = (freq: number, delay: number, dur: number, vol = 0.12) => {
    const c = ctx;
    if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    const t0 = c.currentTime + delay;
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  };

  const ringPattern = () => {
    beep(700, 0, 0.4, 0.1);
    beep(700, 0.5, 0.4, 0.1);
  };

  const sounds: Sounds = {
    startRing() {
      this.stopRing();
      const c = ensure();
      if (!c) return;
      ringPattern();
      ringTimer = window.setInterval(() => {
        const c2 = ensure();
        if (c2) ringPattern();
      }, 1600);
    },
    stopRing() {
      if (ringTimer !== null) {
        window.clearInterval(ringTimer);
        ringTimer = null;
      }
    },
    chime(up: boolean) {
      const c = ensure();
      if (!c) return;
      beep(up ? 880 : 660, 0, 0.16, 0.12);
      beep(up ? 1174 : 494, 0.14, 0.2, 0.12);
    },
  };
  return sounds;
}

export const callSounds: Sounds =
  typeof window !== "undefined" ? makeSounds() : (makeSounds() as Sounds);
