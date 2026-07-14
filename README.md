# PuzzleCam

PuzzleCam turns your webcam into a hand-controlled puzzle game. You draw a square in mid-air with both hands, the app snaps a black-and-white photo of whatever's inside it, chops that photo into a 3x3 grid, and scrambles the pieces. You solve it using nothing but pinch and fist gestures in front of the camera, and once you've solved three of them, they're stitched together into one photo strip and downloaded automatically.

No mouse, no touchscreen, no keyboard. Just your hands and a camera.

## Inspiration

This project is a rebuild of [mishu006/Puzzle](https://github.com/mishu006/Puzzle), a vanilla HTML/JS implementation of the same idea. That original project figured out the hard part: how to track hands reliably, how gestures should feel, how pieces should snap and displace, and how to make the whole thing feel alive instead of janky. All credit for the core concept and gesture design goes there.

What I did here is take that idea and rebuild it from scratch in React and TypeScript, restructuring the logic into a typed, componentized codebase while keeping the real-time canvas engine that makes it actually work well.

## How it works, in plain terms

1. **Show both hands.** The camera watches your index fingers and draws a live rectangle between them, previewed in black and white so you can see exactly what will get captured.
2. **Pinch with both hands at once and hold for a moment.** That locks the square in place, a 3-2-1 countdown appears, and a photo is taken of just that region.
3. **The photo becomes a puzzle.** It's sliced into 9 tiles, shuffled, and scattered across the frame.
4. **Pinch near a tile to grab it.** Move your hand and it follows. Let go of the pinch to drop it. Drop it near its correct spot and it snaps into place; drop it on top of another tile and that tile gets nudged out of the way instead of just disappearing.
5. **Make a fist once it's solved** and hold it for about a third of a second. The completed photo shatters into little fragments and flies apart, then lands as a finished print in the strip on the right.
6. **Repeat two more times.** After your third solved puzzle, everything is stitched into one image, top to bottom, and downloaded automatically.

## How it works, technically

- **Hand tracking** comes from Google's MediaPipe (`@mediapipe/tasks-vision`), specifically the `HandLandmarker` model, running fully client-side. It returns 21 landmark points per hand, per frame, right in the browser. No video ever leaves your machine.
- **Gestures are derived from landmark math, not a pretrained gesture classifier.** A pinch is just "is the distance between thumb tip and index tip small enough." A fist is "are enough fingertips closer to the wrist than their knuckles are." These are recalculated every single frame.
- **Everything renders on one HTML canvas**, not through React's virtual DOM. Rendering a live camera feed and physics-y puzzle pieces at 30-60 times a second is exactly the kind of workload React's render cycle isn't built for, so the engine (`src/engine/puzzleCamEngine.ts`) runs its own `requestAnimationFrame` loop: draw the mirrored video frame, run hand detection, update gesture state, draw the puzzle or the countdown or the shatter animation on top, repeat.
- **React's job is just the shell around that canvas** — the status indicator, the progress badge, the photo strip sidebar, the buttons. The engine talks to React through a small set of callbacks (`onStatus`, `onProgress`, `onGalleryAdd`, and so on) rather than React managing frame-by-frame state itself.
- **Mirroring is handled in exactly one place.** The video is drawn flipped onto the canvas, and hand landmark coordinates are flipped with the same helper function everywhere they're used, so the rectangle you draw, the pieces you drag, and the photo you capture all agree with what you see on screen.
- **TypeScript** is used throughout for the engine and components, mainly so piece state, box geometry, and gesture callbacks are all explicit and don't silently drift out of sync as the logic grew.

## Running it locally

```bash
npm install
npm run dev
```

Open the printed local URL and allow camera access. Chrome or Edge is recommended, since hand tracking relies on WebGL/GPU acceleration that's most consistent there.

\`npm run build\` produces a static \`dist/\` folder that can be deployed anywhere that serves static files, including Vercel, Netlify, or GitHub Pages — there's no backend or server-side component, everything runs in the browser.

## Tuning gestures

If pinch, fist, or the drawing rectangle feel too sensitive or not sensitive enough for your hand size, lighting, or distance from the camera, the relevant thresholds are constants near the top of \`src/engine/puzzleCamEngine.ts\`: \`PINCH_THRESHOLD\`, \`FREEZE_HOLD_MS\`, \`FIST_HOLD_FRAMES\`, \`SNAP_DISTANCE_RATIO\`, and \`COUNTDOWN_SECONDS\` among them. They're grouped together specifically so they're easy to find and adjust without digging through the rest of the engine.
