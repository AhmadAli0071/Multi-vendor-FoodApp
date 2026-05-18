let audioCtx = null;

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// Resume on first user interaction
document.addEventListener('click', () => {
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}, { once: true });
document.addEventListener('touchstart', () => {
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}, { once: true });

export const playBeep = (frequency = 880, duration = 0.15, volume = 0.2) => {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    osc.type = 'square';
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) { /* silent */ }
};

export const playRing = () => {
  playBeep(880, 0.15, 0.2);
  setTimeout(() => playBeep(880, 0.15, 0.2), 200);
};

let ringInterval = null;

export const startRinging = (intervalMs = 3000) => {
  stopRinging();
  playRing();
  ringInterval = setInterval(playRing, intervalMs);
};

export const stopRinging = () => {
  if (ringInterval) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
};
