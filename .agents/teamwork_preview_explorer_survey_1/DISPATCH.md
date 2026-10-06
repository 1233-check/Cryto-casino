# Task Assignment: Frontend & PixiJS Explorer

## Mission
Survey all 15 games in the Crypto Casino project for UI rendering issues, PixiJS v8 deprecations, canvas mounting/unmounting memory leaks, and DOM/Canvas lifecycle errors.

## Context
- Original User Request: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\ORIGINAL_REQUEST.md
- Project Root: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\
- Your Working Directory: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\.agents\teamwork_preview_explorer_survey_1\
- Parent: teamwork_preview_orchestrator_1 (Conv ID: c9e493c9-504a-44d3-889b-6f9b5020c961)

## Instructions
1. Read ORIGINAL_REQUEST.md.
2. Inspect package.json and all game component files in src/ (specifically RouletteGame.jsx, CrashGame.jsx, SlotsGame.jsx, PlinkoGame.jsx, MinesGame.jsx, DiceGame.jsx, etc.).
3. Identify all PixiJS v8 Graphics API deprecations (beginFill, lineStyle, drawCircle, drawPolygon, endFill) and how they must be refactored to PixiJS v8 API.
4. Identify any canvas cleanup, resize, or unmount memory leaks or state locks.
5. Produce a comprehensive report in your working directory at `analysis.md` and `handoff.md`.
6. Send a message to parent when complete.

## 2026-10-06T14:58:15Z
<USER_REQUEST>
You are teamwork_preview_explorer_survey_1.
Your role: Frontend & PixiJS Explorer.
Working directory: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\.agents\teamwork_preview_explorer_survey_1\
Project root: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\
Parent conversation ID: c9e493c9-504a-44d3-889b-6f9b5020c961

Task:
1. Read ORIGINAL_REQUEST.md at project root.
2. Read your assignment in your working directory DISPATCH.md.
3. Survey the entire codebase for all 15 casino games, specifically focusing on UI rendering pipelines, PixiJS usage, Canvas2D, SVG/DOM rendering.
4. Deep-dive into RouletteGame.jsx, CrashGame.jsx, SlotsGame.jsx, PlinkoGame.jsx, and any other game rendering components.
5. Identify all PixiJS v8 Graphics API deprecations (beginFill, lineStyle, drawCircle, drawPolygon, endFill) and specify exact v8 replacements (e.g. fill(), stroke(), circle(), poly()).
6. Inspect canvas lifecycle (mount, resize, unmount, animation frame cleanup, memory leaks, Pixi app destruction).
7. Write your detailed technical findings in c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\.agents\teamwork_preview_explorer_survey_1\analysis.md and a summary with recommendations in handoff.md.
8. Update progress.md with your liveness and status.
9. Send a message to parent (c9e493c9-504a-44d3-889b-6f9b5020c961) when done.
</USER_REQUEST>
