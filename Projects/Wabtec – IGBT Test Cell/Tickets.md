---
title: Wabtec – Builder tickets
tags:
  - wabtec
  - tickets
---

# Builder tickets: Wabtec

Back to [[Projects/Wabtec – IGBT Test Cell/Brief|Brief]] · [[00 Index]] · Specs: `Specs/02`–`05`

| Ticket | Goal | Milestone | Status |
| --- | --- | --- | --- |
| BRIEF | Builder standing brief | – | Superseded by `CLAUDE.md` (Claude Code does everything) |
| 01 | Offline skeleton, all data, validation + config preflight | Skeleton (+1 h) | **Done** (commit c874602; selfcheck 28/28; AC-01 on a second laptop still to do) |
| 02 | Engine, sequencer, safe-state, S0 end-to-end + JSON | M1 15:30 | Next (ticket not written yet) |

## Builder standing brief

```
BUILDER STANDING BRIEF (read once, applies to every ticket)

You are the builder for a hackathon app: a virtual IGBT test cell (Wabtec case).
Specs (source of truth, do not edit): /Users/nurhangarifolla/Hackathon /Projects/Wabtec – IGBT Test Cell/Specs/
  02_SYSTEM_DESIGN.md, 03_TEST_AND_ACCEPTANCE.md, 04_BUILD_PLAN.md, 05_DATA_AND_REPORT_SCHEMA.md
  (IGBT_Test_Cell_Analysis_Report.md is background; 02–05 win where they differ.)
Note: the folder "Hackathon " has a TRAILING SPACE. Always quote paths.
App repo: /Users/nurhangarifolla/Hackathon /igbt-test-cell/

1. Build exactly what the ticket says. No extra scope.
2. Never invent values. Every number, rule, limit and fixed text comes from 03/05. A missing value is a visible placeholder, listed in your report.
3. Never change a threshold, sigma, expected outcome or fixed text to make something pass. If the engine disagrees with 03 §12, report it.
4. Invariants in every build: SIMULATION banner on every screen and export; NOT APPROVED chip on every judged reading; no verdict keyed on a scenario ID; offline only (no fetch, no ES modules, no CDN, no network, classic <script src> only).
5. No media tools. A missing asset is a blocker, not something to substitute.
6. Decisions you make on your own go in igbt-test-cell/NOTES-FOR-NURKHAN.md under "Needs your decision" and "Decisions I made".
7. Commit after each ticket with the ticket ID. Do not push anywhere.

Report format:
TICKET <ID> — DONE / PARTIAL
CHANGED: files
MET / NOT MET: each Done-when line
PLACEHOLDERS: gaps left
NOTES: decisions for the director
```

## TICKET 01

Run this in Claude Code from `/Users/nurhangarifolla/Hackathon /`.

```
TICKET 01: Offline skeleton with all data, domain validation and configuration preflight

Context: First slice of Delivery Method A (02 §3). Data + validation + preflight only; no engine yet.
Specs: "/Users/nurhangarifolla/Hackathon /Projects/Wabtec – IGBT Test Cell/Specs/" (02 §3, §4, §11; 05 §1–§4, §9, §11).
Repo: "/Users/nurhangarifolla/Hackathon /igbt-test-cell/" (create it, git init).

Hard rules
- Classic <script src> only. No fetch(), no type="module", no http(s) URLs, no CDN.
- Copy every value and fixed text verbatim from 05. Do not edit the Specs folder.
- Do not build the engine, sequencer, report or run screens this round (stub files only).

1. Create the folder tree exactly as 02 §3 Method A, plus NOTES-FOR-NURKHAN.md. Script load order in index.html and selfcheck.html: data.js, validate.js, rng.js, models.js, engine.js, sequencer.js, report.js, ui.js. Stubs attach an empty namespace to window.IGBT.
2. js/data.js: one global window.APP_DATA with: case_references (05 §1.1, all 9), module_defaults (05 §2), profiles = [demo (05 §3, bench_conditions §2.1, all rules §3.3), production_unconfigured (same rules, all limits null, badge "PRODUCTION — NO APPROVED LIMITS CONFIGURED")], scenarios (05 §4, all 14 incl. CUSTOM, with priority), fixed texts (banner, limitations, chip legend, verdict labels: 05 §8–§9).
   - Rule field `required`: 05 §3.3 has no column for it. Set true for every non-info rule, false for Q16. Log this in NOTES under "Needs your decision".
3. js/validate.js: pure functions, no DOM.
   - validateModule, validateBench: type + domain per 05 §2/§2.1, null only for desat_trip_us; derived checks 05 §2.3 (v_safe_v < v_dc_test_v; discharge_timeout_s > R·C·ln(v_dc_test_v/v_safe_v) with R in Ω from kΩ and C in F from mF).
   - validateRule/validateProfile: 05 §3.1–§3.2; approval_status must be NOT_APPROVED (reject APPROVED); profile_status production_approved rejected; demo rule missing a limit = error; info rule with a limit = error; window min >= max = error; CASE_*/INVENTED_TOLERANCE need a reference_id that exists; INVENTED needs null.
   - validateOverrides: 05 §2.2, unknown keys rejected.
   - validateSetup: speed in {1,4,8,16}; operator non-empty; seed integer.
   - Every error = { field, value, rule } in plain words.
   - configPreflight(setup) → { status: "INVALID", errors } | { status: "CONFIG_BLOCKED", block_reason: "CONFIGURATION_PREFLIGHT" } | { status: "OK", resolved inputs }. S5 uses force_profile.
4. js/ui.js: SIMULATION banner (fixed, all screens), profile badge, Limitations link (05 §9 text, always reachable).
   - Screen 1 Setup (02 §11): module ID, profile, scenario (all 14; mark P1/P2 as "not built yet" and disabled), seed (default 20261018), speed (default 8), operator, generated run_id RUN-YYYYMMDD-NNNN. Custom shows the module-parameter table with units, editable.
   - CONTINUE runs configPreflight → Screen 1a (each error: field, value, rule; START disabled) or Screen 1b (text from 02 §11, overall NOT EVALUATED) or a placeholder "Pre-check: next ticket".
5. selfcheck.html: runs validation cases in the browser and prints each with PASS/FAIL and a total. Cases: defaults valid; every AC-14 case rejected (r_ce_mohm = −1, dclink_c_mf = 0, v_safe_v ≥ v_dc_test_v, speed = 0, window min ≥ max, info rule with a limit, demo rule missing a limit, unknown override key); approval_status APPROVED rejected; production_approved rejected; S5 → CONFIG_BLOCKED; every P0 scenario's overrides valid.
6. README.txt: one-paragraph launch line (unzip, double-click index.html, Chrome or Edge).

Done when:
- Folder copied to a new location opens via file:// with Wi-Fi off; banner and Setup visible; no console errors.
- Custom with r_ce_mohm = −1 shows Screen 1a listing field, value, rule.
- S5 shows Screen 1b with NOT EVALUATED.
- selfcheck.html shows all cases PASS (give the count).
- grep -rnE 'fetch\(|type="module"|https?://' igbt-test-cell returns nothing.
Commit "TICKET 01: skeleton, data, validation, preflight". Report in the standing format, with the selfcheck output pasted.
