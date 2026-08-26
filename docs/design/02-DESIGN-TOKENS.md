# Design Tokens & Component Rules
Typeface: Geist 400/500/600. Labels/metadata/tabular numbers: Geist Mono.

## Core palette
paper #FBFBF9 · surface #FFFFFF · ink #101317 · ink-soft #363B42 · muted #6A7078
faint #9AA0A7 · line #E6E5E0 · line-strong #CFCEC8 · accent #1F4B8F · accent-soft #EAF0F8

## Status (shape + color, never color alone)
done #2F6B46 (check) · in progress #8A5A1A (amber) · pilot/info #1F4B8F ·
blocked #8A2A33 (the only red; 2px left-edge banner) · waiting #9AA0A7 (dots)

## Type scale (locked)
Display 40/600 tabular · H1 28/600 · H2 18/600 · Card title 15/600 ·
Body 15/400 #363B42 lh1.55 · Small 13/400 · Label mono 11/400 upper 0.14em

## Document surfaces
Zero radius, no shadows. Hairline grids: 1px gap on #E6E5E0 with white cells;
fill the last row with white filler cells. Primary button = ink rectangle;
destructive = outlined critical filling on hover. Focus = 1px accent border + 1px ring.
Motion: border/background color only, 120ms ease-out; reduced-motion freezes all.

## Launcher exception (opening view ONLY — owner decision)
App tiles: 92px, radius 22px, glassmorphism (backdrop-blur 14px, white gradient
0.85→0.45 into 15% product tint), 3D depth (tinted drop shadow + inset top
highlight + inset bottom tint), border rgba(16,19,23,0.10), hover translateY(-4px).
Label 13/600 + mono 9px category. Grid auto-fill minmax(120px,1fr), gap 22px 10px.

## Charts — muted standard palette (MANDATORY, all charts everywhere)
Three tones per extruded body [top, front, side]:
ink   #5A6068 #33383F #20242A      accent #8FA7C4 #5F7EA3 #46607F
green #8FAC97 #63836D #4A6353      lblue  #C3D2E0 #A4BACD #7F97AC
red   #B98D92 #96626A #71454C      gray   #C2C6CB #A5AAB0 #7D838A
Saturated brand accent #1F4B8F is FORBIDDEN in charts. Focus marks use #5F7EA3.
