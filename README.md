# ONE MORE MOVE

A portrait puzzle where every move echoes the previous one. Vanilla JS PWA, no dependencies, no backend.

## Deploy (GitHub Pages)
1. Create a GitHub repo and upload everything in this folder to the root.
2. Settings > Pages > Deploy from a branch > `main` / root.
3. Open `https://<user>.github.io/<repo>/` on Android Chrome, then Menu > Install app.

Runtime files: `index.html`, `manifest.webmanifest`, `sw.js`, `icon-192.png`, `icon-512.png`.

## Develop
- `node test.js`: engine tests, solver checks, validates all 30 levels (needs Node 18+).
- `node build.js`: bundles `engine.js` + `levels.js` + `index.src.html` into `index.html`.
- Edit rules in `engine.js` only. The solver and the game share its `play()`.
- Title: the `TITLE` constant in `index.src.html`.
- Release: bump `VERSION` in `sw.js` so installed players get the update.
- `tools/`: level generation and curation (not shipped to players).

Progress and local stats are stored in the browser (`omm_v1`, `omm_stats`). Nothing leaves the device.
