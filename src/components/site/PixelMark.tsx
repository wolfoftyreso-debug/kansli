/**
 * The PIXDRIFT mark: a small cluster of units where one unit has drifted into
 * place — pixel + drift. Not pixel art; a precise modular glyph.
 */
export function PixelMark({ size = 24 }: { size?: number }) {
  const u = size / 5;
  const gap = u * 0.14;
  const s = u - gap;
  const cell = (cx: number, cy: number, on: boolean) => (
    <rect
      key={`${cx}-${cy}`}
      x={cx * u + gap / 2}
      y={cy * u + gap / 2}
      width={s}
      height={s}
      fill={on ? "currentColor" : "transparent"}
      stroke={on ? "none" : "currentColor"}
      strokeOpacity={on ? 0 : 0.25}
      strokeWidth={0.6}
    />
  );
  // A 4x4 field of faint units with a solid 2x2 core and one drifted unit.
  const cells = [];
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const core = x >= 1 && x <= 2 && y >= 1 && y <= 2;
      cells.push(cell(x, y, core));
    }
  }
  // The drifted unit: bottom-right, detached from the core.
  cells.push(cell(3, 3, true));
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${4 * u} ${4 * u}`}
      role="img"
      aria-label="PIXDRIFT"
      className="text-ink"
    >
      {cells}
    </svg>
  );
}
