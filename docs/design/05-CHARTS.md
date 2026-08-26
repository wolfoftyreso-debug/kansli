# Charts — the 2.5D language
Reference: referens/PIXDRIFT Grafer.html (self-contained; interactivity inlined).

Built from the illustration system's extruded volumes: three tones per body
(light top, mid front, dark side), light upper-left, muted palette ONLY (02 §Charts).
Every chart offers switchable view modes; segmented control top-right.

1. Time series — Volym (extruded bars, clickable focus month) / Band (depth ribbon) / Platt.
2. Series comparison — Djup (grouped extruded, shallow 10/5px depth) / Torn (stacked
   towers with totals) / Platt. Never staggered-depth rows (unreadable).
3. Share — Skiva (2.5D disc with rim walls) / Ring (flat donut) + legend with % bars.
4. Activity — Höjdfält (pillar height field, back rows first) / Platt heatmap.
5. Cash flow — GROUNDED staircase: every column stands on the baseline (gray =
   running balance), additions as green volumes on top, removals as dashed red
   ghosts of what left, running totals "= n" under each column. Nothing floats.
   / Kumulativt band.
6. Key figures — KPI cards with depth-shadowed sparklines, period 30d/90d/12m.

Interaction: mode switch instant; clicked month drives the headline figure.
Implementation note: chart pages are self-contained (script inlined in the page,
with a self-healing re-render guard) — do not depend on external runtime files.
