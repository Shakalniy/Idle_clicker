# Project notes

## Commits
- Do NOT add any assistant/agent attribution trailers to commit messages
  (no "Generated with ...", no "Co-Authored-By"). Plain messages only.

## Build
- `npm run build:tma` — Telegram Mini Apps build (deployed to GitHub Pages via Actions)
- `npm run build:yandex` / `build:vk` / `build:web` — other platform builds
- TMA env vars live in `.env.tma` (gitignored): VITE_ADSGRAM_BLOCK_ID, VITE_YM_COUNTER_ID, VITE_TELEMETREE_*, TG_BOT_TOKEN
- Same VITE_* vars must exist as repo Variables for CI deploy
