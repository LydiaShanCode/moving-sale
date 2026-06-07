// All three sounds loaded from /assets/*.mp3.
// Call unlockAudio() on first user gesture to satisfy browser autoplay policy.

let unlocked = false;

function makeAudio(src: string, volume: number): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  const el = new Audio(src);
  el.preload = "auto";
  el.volume = volume;
  return el;
}

let popAudio: HTMLAudioElement | null = null;
let coinAudio: HTMLAudioElement | null = null;
let receiptAudio: HTMLAudioElement | null = null;

function getPopAudio()     { return popAudio     ??= makeAudio("/assets/pop-sfx.mp3",           0.30); }
function getCoinAudio()    { return coinAudio    ??= makeAudio("/assets/coins-sfx.mp3",         0.20); }
function getReceiptAudio() { return receiptAudio ??= makeAudio("/assets/receipt-print-sfx.mp3", 0.25); }

export function unlockAudio() {
  if (unlocked) return;
  unlocked = true;
  // Play-then-pause each element inside the user gesture. Once an HTMLAudioElement
  // has been played inside a user activation, Chrome allows future plays from any
  // event (including mouseenter), so hover sounds work without a prior click.
  for (const getAudio of [getPopAudio, getCoinAudio, getReceiptAudio]) {
    const el = getAudio();
    if (!el) continue;
    el.play().then(() => {
      el.pause();
      el.currentTime = 0;
    }).catch(() => {});
  }
}

// ─── Sticker hover ──────────────────────────────────────────────────────────
// Global 50ms cooldown shared across all cards

let lastStickerTime = 0;
const STICKER_COOLDOWN_MS = 50;

export function playSticker() {
  const now = Date.now();
  if (now - lastStickerTime < STICKER_COOLDOWN_MS) return;
  lastStickerTime = now;

  const audio = getPopAudio();
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

// ─── Coin drop ───────────────────────────────────────────────────────────────

export function playCoin() {
  const audio = getCoinAudio();
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

// ─── Receipt print ───────────────────────────────────────────────────────────

export function playReceiptPrint() {
  const audio = getReceiptAudio();
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}
