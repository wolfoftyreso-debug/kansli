/**
 * The system map: two larger system blocks (dense unit fields) with a fine
 * PIXDRIFT layer of units connecting the space between them. This is the
 * homepage's controlled visualization — technical, not decorative.
 *
 * Motion is a slow one-shot alignment of the connecting units; under
 * prefers-reduced-motion the field renders in its final, aligned state.
 */
export function PixelField({ className = "" }: { className?: string }) {
  const u = 14; // unit size
  const cols = 34;
  const rows = 16;
  const W = cols * u;
  const H = rows * u;

  const block = (x0: number, y0: number, w: number, h: number, label: string) => {
    const cells = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        cells.push(
          <rect
            key={`b-${label}-${x}-${y}`}
            x={(x0 + x) * u + 1}
            y={(y0 + y) * u + 1}
            width={u - 2}
            height={u - 2}
            fill="var(--color-ink)"
            opacity={0.9}
          />,
        );
      }
    }
    return cells;
  };

  // Connecting units in the gap between the two blocks (the "pixels between").
  const gapCols = [12, 14, 16, 18, 20, 21];
  const connectors = gapCols.map((cx, i) => {
    const cy = 6 + ((i % 4) - 1.5);
    return (
      <rect
        key={`c-${cx}`}
        x={cx * u + 1}
        y={Math.round(cy) * u + 1}
        width={u - 2}
        height={u - 2}
        fill="var(--color-accent)"
        className="pd-connector"
        style={{ animationDelay: `${i * 140}ms` }}
      />
    );
  });

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label="Two established systems with a fine PIXDRIFT layer connecting the space between them."
        className="pd-field block h-auto w-full"
      >
        {/* Faint underlying grid */}
        {Array.from({ length: cols + 1 }).map((_, i) => (
          <line
            key={`v-${i}`}
            x1={i * u}
            y1={0}
            x2={i * u}
            y2={H}
            stroke="var(--color-line)"
            strokeWidth={0.5}
          />
        ))}
        {Array.from({ length: rows + 1 }).map((_, i) => (
          <line
            key={`h-${i}`}
            x1={0}
            y1={i * u}
            x2={W}
            y2={i * u}
            stroke="var(--color-line)"
            strokeWidth={0.5}
          />
        ))}
        {block(1, 3, 9, 10, "left")}
        {block(24, 3, 9, 10, "right")}
        {connectors}
      </svg>
      <style>{`
        .pd-connector { opacity: 0; animation: pd-drift 700ms ease-out forwards; }
        @keyframes pd-drift {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .pd-connector { opacity: 1 !important; animation: none !important; transform: none !important; }
        }
      `}</style>
    </div>
  );
}
