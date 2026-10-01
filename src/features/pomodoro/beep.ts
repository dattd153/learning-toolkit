let ctx: AudioContext | null = null;

function audio() {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctor) ctx = new Ctor();
  }
  return ctx;
}

/** Browsers only allow audio after a user gesture; call this from a click. */
export function unlockAudio() {
  try {
    void audio()?.resume();
  } catch {
    /* ignore */
  }
}

/** Three short 880 Hz beeps. */
export function beep() {
  try {
    const a = audio();
    if (!a) return;
    [0, 0.35, 0.7].forEach((t) => {
      const o = a.createOscillator();
      const g = a.createGain();
      o.frequency.value = 880;
      o.connect(g);
      g.connect(a.destination);
      g.gain.setValueAtTime(0.0001, a.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.3, a.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + t + 0.3);
      o.start(a.currentTime + t);
      o.stop(a.currentTime + t + 0.32);
    });
  } catch {
    /* ignore */
  }
}
