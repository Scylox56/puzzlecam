# PuzzleCam

Camera puzzle game using two-hand gesture tracking (MediaPipe Hands via `@mediapipe/tasks-vision`).

## Run it

```bash
npm install
npm run dev
```

Open the printed local URL, allow camera access. Chrome/Edge recommended.
`npm run build` → static `dist/` you can deploy anywhere.

## Architecture

Unlike a typical React app, the camera + puzzle scene is a **single `<canvas>`** driven by its own
`requestAnimationFrame` loop in `src/engine/puzzleCamEngine.ts` — the video frame is drawn to canvas
manually mirrored each frame, and hand landmarks are mirrored with one small helper applied consistently
everywhere. React (`src/App.tsx`) just mounts the canvas/video elements and renders the surrounding UI
(status HUD, gallery strip, buttons) via callbacks from the engine. This avoids fighting React's render
cycle for something that needs to update 30-60x/second.

## Gestures

- **Draw the square**: show both hands, point index fingers — a rectangle tracks between them live, with a
  black & white preview inside it.
- **Lock it in**: pinch (thumb + index touching) with *both* hands and hold for ~250ms. Rectangle locks,
  countdown 3-2-1, photo captured.
- **Solve**: photo is sliced into a 3x3 grid and shuffled. Pinch near a piece to grab it, move your hand to
  drag it anywhere (it free-floats, doesn't snap to a slot grid), release the pinch to drop. Dropping near a
  piece's correct cell snaps it into place; dropping on top of another piece displaces that piece to a random
  open cell with a little animation.
- **Save**: once solved, hold a fist for about 12 frames (roughly a third of a second) — the completed image
  shatters into fragments and flies apart, then gets added to the strip on the right.
- **Auto-download**: after 3 photos, the strip auto-downloads as one merged image.
- **Reset**: the "Reset all" button clears everything and starts over.

## Tuning

All thresholds (pinch distance, fist-hold frames, countdown length, snap tolerance, etc.) are constants
at the top of `src/engine/puzzleCamEngine.ts` — adjust if detection feels too sensitive/insensitive for
your hand size, distance from camera, or lighting.

## Notes

- Model + WASM runtime are fetched from Google's CDN on first load (cached after). GPU delegate is tried
  first, falls back to CPU automatically if that fails.
- Video is mirrored for a natural selfie-cam feel; this is baked into the canvas draw call and the landmark
  mirroring helper (`mirrorX`) — if you want it unmirrored, remove the `translate/scale(-1,1)` in
  `drawVideoFrame()` and drop the `mirrorX()` calls throughout (they're used consistently, so removing all
  of them keeps things in sync).
