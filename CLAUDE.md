# CLAUDE.md: Hackathon workspace

You do everything now: plan, build, test and keep the notes. No other Claude session is involved. Nurkhan is the user.

## The job
- NU × IEEE Case Hackathon. The team chose the **Wabtec case**: a bench test cell that checks an IGBT phase module before it goes onto a locomotive.
- **Deadline 18 Oct 2026, 11:00 (UTC+5). Feature freeze 17 Oct, 20:00.** After the freeze: defect fixes and wording only.
- Team: Said (specs, proposal, owns rules and verdict logic), Nurkhan (builds the app with you), Darkhan (slides, diagram, fallback video), Ramazan (pitch).
- You build an **offline virtual prototype** of the test cell's operator workflow, test sequencing, safety/abort behaviour, decision logic and reports. Simulated data only. It is not a digital twin.

## Where things are
The root folder is `/Users/nurhangarifolla/Hackathon /`. Its name ends with a **space**, so always quote paths.
```
00 Index.md                          ← map of the vault; keep it current
CLAUDE.md                            ← this file
CONTRIBUTING.md                      ← rules for Said and the team (branches + PRs, protected paths)
.github/guard.sh, workflows/guard.yml ← repo guard (CI on every PR and push to main)
DESIGN.md                            ← app look and feel (NVIDIA style; project box at the top wins)
design/screenshots/                  ← design-pass screenshots (not shipped)
Projects/Wabtec – IGBT Test Cell/
  Brief.md, Decisions.md             ← goal and decision log
  Tickets.md                         ← work slices; TICKET 01 is written, start there
  Specs/02–05 (v0.3)                 ← SOURCE OF TRUTH (Said's)
  Specs/IGBT_Test_Cell_Analysis_Report.md  ← background; 02–05 win where they differ
igbt-test-cell/                      ← the app (created by TICKET 01); the git repo is the vault root
Sessions/                            ← one handoff note per session
Sources/ (summaries), Originals/ (raw decks)  ← open originals only if a summary is missing something
```
Read the specs in this order: 04 (plan and priorities) → 02 (design) → 05 (data and report) → 03 (tests, expected outcomes, acceptance checks).

## Rules (from the specs; never break them)
- **Offline, Method A:** classic `<script src>` only. All data lives in `js/data.js` as `window.APP_DATA`. No `fetch`, no ES modules, no CDN, no network.
- Copy every value, limit and fixed text **verbatim** from 03/05. Don't edit the specs.
- **Never change a threshold, σ, expected outcome or fixed text to make something pass.** If the engine disagrees with 03 §12, stop and log it in `Decisions.md` as "Pending Said".
- Any change to rules, limits, verdict logic, safe-state behaviour, timings or claims needs Said's OK. Log it as "Pending Said".
- No verdict may be keyed on a scenario ID. Readings are computed from parameters.
- The SIMULATION banner appears on every screen and every export. Every judged reading shows its rule basis, its case reference and `NOT APPROVED`.
- The forbidden-claims list is in 03 §14. The never-cut list is in 04 §4.

## How to work
1. **Pull first.** Start every session with `git pull` on `main` at the vault root, and pull again right before each push. Said (`saidstrong`) has write access and may push specs or proposal files. If a pull conflicts, merge it before anything else (in tables such as `Decisions.md`, keep both sides' rows). If a spec (02–05) changed, re-run `node igbt-test-cell/dev/selfcheck-node.js` before building and log any mismatch as "Pending Said".
   - After each pull, run `git diff --stat ORIG_HEAD HEAD`. If someone else changed a protected path, the app code or the tool setup (list in `CONTRIBUTING.md` §3–4), run `bash .github/guard.sh ORIG_HEAD HEAD <their-login>` and tell Nurkhan before building.
   - Said works on `said/<topic>` branches and opens pull requests (`CONTRIBUTING.md`). Review them with `gh pr list` / `gh pr diff <n>`, check out the branch, then run the guard and the selfcheck. Merge only after Nurkhan says OK. GitHub's **guard** workflow runs the same script on every pull request and every push to `main`.
2. **One slice at a time.** Each slice is a ticket in `Tickets.md` (goal, steps, Done when). If the next ticket isn't written yet, write it first. Order: 01 skeleton/validation → 02 engine + S0 (M1) → 03 S1–S8 + HTML report (M2) → 04 Custom + AC-14 + AC-01 (M3).
3. Build in `igbt-test-cell/`, styled per `DESIGN.md`. Commit each slice as `TICKET NN: summary` (one repo at the vault root; raw `.pptx` decks and `graphify-out/` are ignored). Push `main` to the private GitHub repo `nurkhangarifolla/nu-ieee-hackathon-2026` after each slice so the team sees the latest. Never make it public.
4. **Check your own work before calling it done.** Test every Done-when line. The engine has no DOM, so run it with `node` (load `data.js` and `engine.js` with a `window` shim). Compare against the 03 §12 table and diff two runs for determinism (AC-02). Ask Nurkhan for browser screenshots and the second-laptop offline test (AC-01).
5. Put your own small decisions in `igbt-test-cell/NOTES-FOR-NURKHAN.md` under "Needs your decision" and "Decisions I made". Team-level decisions go in `Decisions.md`.
6. Ask Nurkhan only when you need a fact or choice that only he has. Otherwise keep going.
7. **End of session:** write `Sessions/YYYY-MM-DD <topic>.md` in 150 words or fewer (Done / Next / Open questions). Then add a row to the Sessions table in `00 Index.md` and update the statuses in `Tickets.md`.

## Milestones (04 §3)
| Time (17 Oct) | Milestone |
| --- | --- |
| 15:30 | M1: S0 end to end, JSON export |
| 17:30 | M2: S1, S2, S3, S4, S5, S8 match 03 §12; HTML report |
| 18:30 | M3: Custom mode, AC-14, AC-01 on a second laptop |
| 20:00 | Freeze, tag, backup |

## Open questions
- Which browser is on the presentation laptop? Default: Chrome or Edge.
- 05 §3.3 has no `required` column. For now every non-info rule is required, which matches 03 §12. Said to confirm.
- Has the team agreed to the 20:00 freeze and the 23:00–07:00 sleep?

## Talking to Nurkhan
Casual, direct, short. Give concrete steps rather than frameworks. Lead with the answer.
