// Synthesized Web Audio POS Sound Engine
// Zero external asset files required - runs with zero network latency

let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioCtx && typeof window !== "undefined") {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
};

/**
 * Play a crisp laser scanner beep (1000Hz sine wave, 80ms)
 */
export const playBeep = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1000, ctx.currentTime); // 1000 Hz beep

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {
    console.error("Audio beep error:", e);
  }
};

/**
 * Play a celebratory register bell / cha-ching sound (harmonious dual chime)
 */
export const playCashBell = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // First tone (B5 ~ 987.77 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(987.77, ctx.currentTime);
    gain1.gain.setValueAtTime(0.2, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.35);

    // Second tone higher chime (E6 ~ 1318.51 Hz) delayed by 80ms
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.08);
    gain2.gain.setValueAtTime(0.01, ctx.currentTime);
    gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.45);
  } catch (e) {
    console.error("Audio cash bell error:", e);
  }
};

/**
 * Speak out loud using Web Speech API Synthesizer
 */
export const announcePayment = (amount: number, method: string = "M-Pesa") => {
  try {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      // Cancel previous utterances
      window.speechSynthesis.cancel();

      const text = `${method} payment of ${amount.toLocaleString()} shillings confirmed!`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05; // slightly energetic retail rate
      utterance.pitch = 1.0;
      utterance.volume = 0.9;

      window.speechSynthesis.speak(utterance);
    }
  } catch (e) {
    console.error("Speech announcement error:", e);
  }
};
