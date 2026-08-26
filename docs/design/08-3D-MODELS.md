# 3D Vehicle Models — all size classes
Reference: referens/fordon-3d.html (open in browser; WebGL).

All 13 size classes exist as real, orbitable three.js models built from the same
design: extruded side profiles matching the 2D library, ink paint (0x262B31),
tinted glasshouse, roof rails on Kombi/SUV, sliding-door windows on vans,
open bed on the Pickup, glowing head/taillights. Studio light, soft ground shadow.

- Class picker top-left; the stage reframes the camera per model.
- Every class exports as OBJ+MTL or GLB with the class id as filename —
  straight into Blender, Unity or a game engine.
- Parameterized builders (threeBox / van / pickup) — a new class is a data entry,
  not a new model. Keep +x as the nose and rest bodies on y=0.
