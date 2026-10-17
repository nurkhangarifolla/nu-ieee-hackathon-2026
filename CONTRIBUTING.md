---
title: How to contribute (for Said and the team)
tags:
  - workflow
---

# How to contribute

This repo is Nurkhan's Obsidian vault and the app. Claude Code builds and checks the app from it. Please follow these rules so the vault, the notes graph and the build checks keep working.

## 1. Never push to `main`. Use a branch and a pull request
- **With git:**
  ```
  git clone https://github.com/nurkhangarifolla/nu-ieee-hackathon-2026.git
  git switch -c said/<topic>
  # … edit, then:
  git add <your files>
  git commit -m "<what you changed>"
  git push -u origin said/<topic>
  ```
  Then open a pull request on GitHub.
- **Without git (website):** **Add file → Upload files**. Under "Commit changes", pick **"Create a new branch for this commit and start a pull request"**, not "Commit directly to main".
- Nurkhan (with Claude) reviews and merges. Run `git pull` before you start each time.

## 2. Where you can write
| Path | You may |
| --- | --- |
| `Projects/Wabtec – IGBT Test Cell/Specs/` | edit freely (you own the specs; after a change, tell Nurkhan which section changed) |
| `Projects/Wabtec – IGBT Test Cell/Proposal/` | add your proposal, cost sheet and figures |
| `Projects/Wabtec – IGBT Test Cell/Decisions.md` | add rows; don't rewrite or delete existing ones |
| `igbt-test-cell/` (the app) | change code only by pull request, under the rules in §4 |

## 3. Please don't touch
- `CLAUDE.md`, `DESIGN.md`, `00 Index.md`, `CONTRIBUTING.md`, `.gitignore`, `.gitattributes`, `.github/`, `.obsidian/`
- `Sessions/`, `Sources/`, `Originals/`, `Projects/Wabtec – IGBT Test Cell/Tickets.md`, `igbt-test-cell/NOTES-FOR-NURKHAN.md`
- **Don't rename, move or delete existing notes.** Obsidian links point to them by name. Add a new file instead.

Need a change in one of these? Ask Nurkhan.

## 4. Never commit
- Editor and AI-tool files: `.vscode/`, `.idea/`, `.cursor/`, `.claude/`, `.mcp.json`, `.cursorrules`, `AGENTS.md`, or a second `CLAUDE.md` anywhere. These change how Nurkhan's tools behave.
- `node_modules/`, `package.json` or any lock file. The app has no build step and must stay offline.
- `dist/`, `graphify-out/`, `.env`, and files over 20 MB.
- Whole-file reformatting (Prettier or format-on-save). Change only the lines you mean to.

### If you change app code
- Offline only: classic `<script src>`, no `fetch`, no ES modules, no CDN, no URLs.
- No scenario IDs (S0…S10, CUSTOM) in `engine.js`, `models.js` or `sequencer.js`.
- Don't change thresholds, σ or expected outcomes to make a check pass.
- Before you push, run `node igbt-test-cell/dev/selfcheck-node.js`. Every case must PASS.

## 5. The automatic check
Every pull request and every push to `main` runs **guard** (GitHub Actions). It checks the rules above, the selfcheck and the offline/scenario-ID greps. A red ✗ on your pull request means something needs fixing: open the run to see which line failed.
