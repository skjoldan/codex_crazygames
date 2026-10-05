# Ricochet Foundry

**Bank the perfect shot. Break the whole reactor.**

A complete, lightweight HTML5 arcade puzzler made for a CrazyGames Basic Launch submission. Aim a volley of energy balls, ricochet around steel, trigger explosive overloads, and multiply shots with splitters.

![Ricochet Foundry](submission/covers/landscape-1920x1080.png)

## Play locally

**Quickest:** download `submission/play-ricochet-foundry.html` and double-click it. This self-contained review build does not need a server.

Install Node.js 20 or newer, open a terminal in this folder, then run:

```sh
npm run dev
```

Open **http://localhost:4173**. No dependency install is needed to play or build. Opening `index.html` directly with `file://` is unsupported because browsers restrict ES modules on that protocol.

## Included

- 30 designed chambers in five sectors; 90 collectible stars.
- Deterministic daily reactor with a personal best (UTC daily reset).
- Mouse, touch, and keyboard controls; responsive portrait/landscape interface.
- Original Canvas artwork, particles, sound synthesis, aim preview, instant restart, and one-step rewind.
- Local progress plus CrazyGames SDK v3 Data integration; gameplay lifecycle events.
- Basic Launch build with **no ads**, payments, third-party analytics, accounts, or fullscreen button.
- Three portal covers, two silent gameplay preview videos, screenshots, metadata, and a uploadable ZIP.

## Controls

| Action | Mouse / touch | Keyboard |
|---|---|---|
| Aim | Move / drag in chamber | Left / right arrows |
| Fire | Release in chamber | Space |
| Undo last volley | Rewind | Z |
| Restart chamber | Restart | R |
| Pause | Pause icon | P |

Break every colored block. Numbers are remaining hits. Red overloads damage nearby blocks. Mint splitters add balls. Steel cannot be destroyed and is not a victory target. Rewind restores the last volley after it ends; it is not an extra life or paid feature.

## Build and verify

```sh
npm test                    # Deterministic physics, campaign, saves, portal contract
npm run verify:levels       # Search winning angles and write solution evidence
npm run build               # dist/ and submission/ricochet-foundry-crazygames.zip
npm install                 # Only needed for browser tests and media tools
npx playwright install chromium
npm run test:browser         # Chromium mouse/touch + layout + SDK contract tests
npm run media               # Rebuild original cover artwork (Linux font paths)
node scripts/record.mjs      # Record real-time browser footage; requires ffmpeg
```

GitHub Actions runs the build and Chromium checks and uploads a verification artifact. See [verification notes](docs/VERIFICATION.md) for what has actually been tested and what still requires the CrazyGames preview tool / real devices.

## Submission

Use [SUBMISSION.md](docs/SUBMISSION.md) and the files in [`submission/`](submission/). The game ZIP contains only playable files; marketing media stays outside it. Approval and player-retention performance have **not** been established. This project has not been submitted to CrazyGames by the agent.

## Architecture

- `src/engine.js`: deterministic fixed-step simulation, no DOM or randomness.
- `src/levels.js`: campaign layouts and seeded daily content.
- `src/render.js`: code-native artwork and visual feedback.
- `src/main.js`: input, menus, progression, accessibility, game lifecycle.
- `src/portal.js`: fault-tolerant CrazyGames adapter and save merging.
- `src/audio.js`: original synthesized sound effects.

No external game engine or runtime asset downloads. The CrazyGames SDK is the only external runtime script. Local play skips it unless launched with `?sdk=1`. `?qa=1` exposes the test harness **only on localhost**.
