const COLS = 5;
const ROWS = 7;
const CELL = 4;
const DOT = 3;
const TRACKING = 1;

// 5×7 glyphs for a decorative footer rule. Painted as squares, never as text.
const FONT: Record<string, readonly number[]> = {
  " ": [0, 0, 0, 0, 0, 0, 0],
  ".": [0, 0, 0, 0, 0, 0b01100, 0b01100],
  S: [0b01110, 0b10001, 0b10000, 0b01110, 0b00001, 0b10001, 0b01110],
  a: [0, 0b01110, 0b00001, 0b01111, 0b10001, 0b10001, 0b01111],
  b: [0b10000, 0b10000, 0b11110, 0b10001, 0b10001, 0b10001, 0b11110],
  d: [0b00001, 0b00001, 0b01111, 0b10001, 0b10001, 0b10001, 0b01111],
  e: [0, 0b01110, 0b10001, 0b11111, 0b10000, 0b10001, 0b01110],
  f: [0b00111, 0b01000, 0b01000, 0b11110, 0b01000, 0b01000, 0b01000],
  g: [0, 0b01111, 0b10001, 0b10001, 0b01111, 0b00001, 0b01110],
  h: [0b10000, 0b10000, 0b10110, 0b11001, 0b10001, 0b10001, 0b10001],
  i: [0b00100, 0, 0b01100, 0b00100, 0b00100, 0b00100, 0b01110],
  j: [0b00010, 0, 0b00110, 0b00010, 0b00010, 0b10010, 0b01100],
  m: [0, 0, 0b11111, 0b10101, 0b10101, 0b10101, 0b10101],
  n: [0, 0, 0b11110, 0b10001, 0b10001, 0b10001, 0b10001],
  o: [0, 0, 0b01110, 0b10001, 0b10001, 0b10001, 0b01110],
  r: [0, 0, 0b10110, 0b11001, 0b10000, 0b10000, 0b10000],
  s: [0, 0b01111, 0b10000, 0b01110, 0b00001, 0b00001, 0b11110],
  t: [0b01000, 0b01000, 0b11110, 0b01000, 0b01000, 0b01001, 0b00110],
  å: [0b00100, 0b01010, 0b01110, 0b00001, 0b01111, 0b10001, 0b01111],
};

const LINE = "Snart finns det inget som heter jobba hemifrån.";

function glyph(ch: string) {
  const rows = FONT[ch];
  if (!rows) {
    throw new Error(`footer-grain: missing glyph for ${JSON.stringify(ch)}`);
  }
  return rows;
}

function footerGrainPath() {
  const parts: string[] = [];
  let cursor = 0;

  for (const ch of LINE) {
    const rows = glyph(ch);
    const width = ch === " " ? 3 : COLS;

    for (let row = 0; row < ROWS; row += 1) {
      const bits = rows[row] ?? 0;
      for (let col = 0; col < width; col += 1) {
        const shift = COLS - 1 - col;
        if (width === COLS && bits & (1 << shift)) {
          const x = (cursor + col) * CELL;
          const y = row * CELL;
          parts.push(`M${x} ${y}h${DOT}v${DOT}h-${DOT}z`);
        }
      }
    }

    cursor += width + TRACKING;
  }

  return {
    d: parts.join(""),
    width: cursor * CELL - TRACKING * CELL,
    height: ROWS * CELL,
  };
}

export const footerGrain = footerGrainPath();
