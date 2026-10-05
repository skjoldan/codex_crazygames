# Ricochet Foundry — design and rationale

## Goal

Deliver a small, coherent web game with a complete play loop and submission assets. Favor visible quality, immediate understanding, replayable precision, and low loading cost. Do not assert that a particular genre guarantees approval.

## Hook

An aimed volley ricochets through a reactor. The player tries to create a satisfying cascading clear with a single clever angle. Success combines deliberate planning and an expressive payoff.

## Loop

Observe the layout → aim with a three-bounce guide → launch → watch the chain reaction → change angle or rewind → clear → earn stars → next chamber.

Numbers expose health, not hidden randomness. Red blocks have a radial blast; mint Y-marked blocks split balls; dark bolted blocks reflect but cannot break. Color is supplemented by shape/symbol/number. The aim guide models the first ball on the current board; following balls encounter the changed board, so their paths intentionally diverge.

## Progression

30 chambers, five sectors of six. Each introduces new arrangements rather than purchasing stat upgrades. Three-star targets are backed by saved solver routes. A greedy angle search establishes achievable routes; it is not a proof of globally optimal play or human difficulty.

Daily content mirrors rows of an existing advanced layout using a deterministic date seed. Six volleys and 20 balls are offered, with a three-volley star target. Daily records are personal bests. New content rolls over at midnight UTC, evaluated when opening Daily Reactor.

## Fairness

No timer. Unlimited restarts. One-step rewind after each volley. No ads, paywalls, lives, or false urgency. Pauses freeze physics; changing refresh rate does not change simulation. Most chambers permit recovery shots while three stars reward precision.

## Art and sound

Dark teal machinery, warm peach/rose cores, coral overloads, mint energy. Crisp Canvas 2D shapes, beveled tile faces, simple custom launcher silhouette, restrained spark effects. Original synthesized launch, impact, blast, split, win, and failure cues. No music or large audio dependency.

## Technical budget

Static ES modules, no runtime framework or external font. Fixed 120 Hz simulation, rendering via requestAnimationFrame, DPR capped at 2. Split amplification capped at 24 balls per volley. Ball lifetime capped at 7 seconds; no permanently trapped balls. Particles capped at 350. Game payload roughly 50 KB uncompressed, excluding platform SDK.

## Limits of evidence

Automated tests establish technical properties, routes, and input flows. They do not establish that players enjoy the game, that retention targets are met, or that CrazyGames will accept it. Validate with fresh human players before submission; use portal feedback and Basic Launch results to choose subsequent work.
