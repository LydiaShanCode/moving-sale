export const CARD_W = 160;
export const CARD_H = 200;
export const PAD_X = 32;
export const PAD_Y = 32;

export type Position = { x: number; y: number };

export function scatterPositions(count: number): Position[] {
  const cols = 4;
  const cellW = CARD_W + PAD_X;
  const cellH = CARD_H + PAD_Y;
  const rows = Math.ceil(count / cols);
  const totalW = cols * cellW;
  const totalH = rows * cellH;
  const offsetX = -totalW / 2;
  const offsetY = -totalH / 2;
  return Array.from({ length: count }, (_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const baseX = offsetX + col * cellW;
    const baseY = offsetY + row * cellH;
    const jitterX = (Math.random() - 0.5) * (PAD_X * 0.8);
    const jitterY = (Math.random() - 0.5) * (PAD_Y * 0.8);
    return { x: baseX + jitterX, y: baseY + jitterY };
  });
}

export function gridPositions(count: number): Position[] {
  const cols = 2;
  const gapX = 24;
  const gapY = 24;
  const startX = -((cols * CARD_W + (cols - 1) * gapX) / 2) + CARD_W / 2;
  const startY = -Math.floor(count / cols) * ((CARD_H + gapY) / 2);
  return Array.from({ length: count }, (_, i) => ({
    x: startX + (i % cols) * (CARD_W + gapX),
    y: startY + Math.floor(i / cols) * (CARD_H + gapY),
  }));
}
