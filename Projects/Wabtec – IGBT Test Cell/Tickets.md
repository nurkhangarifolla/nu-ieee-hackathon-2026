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
| 01b | Design pass: `DESIGN.md` (NVIDIA style) applied to banner, header, Setup, 1a, 1b | – | **Done** (selfcheck 28/28; screenshots in `design/screenshots/`) |
| 02 | Engine, sequencer, safe-state, S0 end-to-end + JSON | M1 15:30 | **Done** (S0 matches 03 §12; AC-02 diff empty; AC-12 in headless Chrome over `file://`, offline; selfcheck 59/59; Nurkhan's own-browser check still to do) |
| 03 | S1, S2, S3, S4, S5, S8 match 03 §12 + HTML report | M2 17:30 | Not written |
| 04 | Custom (AC-03), AC-14 set, AC-01 on a second laptop | M3 18:30 | Not written |

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

## TICKET 02

Run this in Claude Code from `/Users/nurhangarifolla/Hackathon /`. Since 17 Oct the git repo is the vault root; the app lives in `igbt-test-cell/`.

```
TICKET 02: Engine, sequencer, safe-state procedure, S0 end to end + JSON export (M1, 15:30)

Context: Second slice (04 §3 M1). Readings computed from parameters, rule engine with chips,
prerequisites, explicit bus model, the single safe-state procedure, Pre-check / Run / Result
screens and JSON export. σ = 0 only. HTML report and the S1–S8 checks are TICKET 03; Custom
flip (AC-03) is TICKET 04.
Specs: 02 §4–§9, §11; 03 §5–§10, §12 (S0 row); 05 §5–§8, §11. Look and feel: DESIGN.md (vault root).
App: "/Users/nurhangarifolla/Hackathon /igbt-test-cell/".

Hard rules
- Everything from TICKET 01 still holds (classic <script src>, offline, values verbatim, no spec edits).
- engine.js, models.js and sequencer.js contain no scenario ID (S0–S10, CUSTOM), not even in
  comments. Scenario effects arrive only as overrides and scenario_events from configPreflight.
- σ = 0: rng.js returns x unchanged and never consults the PRNG (02 §10).
- If S0 does not match 03 §12, stop and log it in Decisions.md as "Pending Said". Never change a
  value, limit or expected outcome to make it match.

1. data.js: add, verbatim from the specs:
   - stages in the 02 §6 order (T00, T01, T02, T03, T06, T04, T05, T07, T08a, T08b, T09, T10),
     each with name (03 §1 "Test" column) and class (02 §6).
   - physical_components per stage (03 §7: basis, seconds, note). The COMPUTED parts of T07
     and T10 are filled in by the engine.
   - conditions templates (03 §6), hypotheses (03 §10, incl. "Safe state not verified"),
     interlocks IL1–IL7 with their demo control (02 §5).
2. models.js (pure): the 02 §8 micro-models (V_CE(sat), t1, V_peak, t_charge, t_safe, E) and a
   model_equation string built from the actual values, e.g.
   "V_CE(sat) = 1.00 V + 0.007 Ω × 200 A = 2.40 V". Never hard-code 600 V or 200 A.
3. engine.js (pure, no DOM):
   - Readings per 03 §6, incl. the dependency rule (driver_idle_w < 1.0 → gate readings 0 V;
     gate_turns_off_ok = false → gate stays at gate_on_v after OFF).
   - evaluateRule per 03 §8: verdict PASS / FAIL / INFO / NOT RUN; reason templates with chips
     "ILLUSTRATIVE · <basis>, NOT APPROVED" (+ "Case ref REF-xx"); margin = signed distance to the
     nearest numeric limit, positive inside, null when value or limit is missing;
     reference_text from case_references.
   - Stage PASS = every required reading PASS. Prerequisites per 03 §5: BLOCKED with a reason
     naming the failed stages; T06 NOT_APPLICABLE when gate_accessible = false; T08b always
     NOT_MODELLED and out of the roll-up.
   - Roll-up per 03 §9, in that order, with precedence_reason and verdict_label (05 §8).
     is_acceptance_decision is always false. Hypotheses per 03 §10, kept separate from verdicts.
   - Number hygiene: round stored reading values to 4 dp, and stored seconds and volts to 2 dp,
     before judging and serialising (removes float noise like 2.4000000000000004; keeps N3's
     11.000 mΩ exactly on the 3.2 V limit). Log this in NOTES under "Decisions I made".
4. sequencer.js (pure state machine on a physical clock; no DOM, no timers):
   - States per 02 §4. All interlocks OK to START. IL3 shows OK at Pre-check and is not tied to
     bench_selfcheck_ok (S10 must end INCOMPLETE, not ABORTED, 03 §12). Log in NOTES.
   - Explicit bench state 02 §7.1 (v_bus_v, source_enabled, contactor_closed, door_locked,
     gate_cmd, gate_meas_v). Bus: linear ramp from T07 start, hold through T09, exponential decay
     only inside the safe-state procedure; v_bus_v stays 0 V before T07.
   - advance(dt_physical) moves the run; abort(cause) with OPERATOR, IL1_OPEN…IL7_OPEN or
     WATCHDOG; scenario_events fire at {at_stage, at_progress}. On abort the running stage becomes
     INTERRUPTED (its elapsed fraction counts), later stages NOT_RUN (NOT_APPLICABLE and
     NOT_MODELLED keep their status).
   - One safe-state procedure, SS1–SS9 (02 §7.2), entered on completion or abort, exactly once
     per run. Triggers during it are logged as WARNING and ignored. Verification at
     t_safe + verify_delay_s after DISCHARGE_START (or at discharge_timeout_s on failure), also at
     0 V. Verified → DOOR_UNLOCKED → SAFE; otherwise FAULT_LOCKED (door stays locked; a logged
     "Reset simulation" is the only exit). T10's stage record is this procedure's record.
   - Events per 05 §5: seq, stage, type, physical_time_s (cumulative from RUN_START),
     animation_time_s = physical / speed, detail.
   - runToEnd() for node and selfcheck uses the same code path as the UI.
5. report.js: buildJson(run) in the 05 §6 shape: metadata; deterministic {inputs, overall, stages
   with readings and physical components, safe_state, events without animation_time_s,
   physical_total_s}; presentation; case_references used in this run; limitations text. Also the
   CONFIG_BLOCKED shape (05 §6 notes). Fixed key order. Download via Blob as report_<run_id>.json.
6. ui.js + index.html, styled per DESIGN.md:
   - Screen 2 Pre-check: IL1–IL7 lamps (text + colour, never colour alone); START enabled only
     when all are OK.
   - Screen 3 Run: stage list (status + class); active reading card (value, unit, rule, basis
     chip, reference chip, NOT APPROVED chip, margin); equation with values; bench panel (v_bus_v,
     source, contactor, door, gate command vs measured); event log with both clocks; the two
     clocks and the caption; demo controls Abort / Open door / Heartbeat loss. A timer calls
     advance(speed × real dt).
   - Screen 4 Result: overall verdict, label, precedence reason; per-reading table with chips;
     hypotheses box ("not diagnoses"); safe-state summary; clocks; Download JSON.
   - FAULT_LOCKED red banner (fixed text) with "Reset simulation". 1b's Export button now
     downloads the CONFIG_BLOCKED JSON.
7. dev/run-node.js (not loaded by index.html; leave dev/ out of the zip): loads data.js,
   validate.js, rng.js, models.js, engine.js, sequencer.js, report.js with a window shim, runs one
   scenario to the end and prints the deterministic section.
   Usage: node dev/run-node.js S0 > s0.json
8. selfcheck.html: add S0 engine checks (every S0 key value, stage statuses, safe-state block,
   499.85 s physical, 62.48 s animation at speed 8, exactly one DISCHARGE_START).

Done when:
- node dev/run-node.js S0 matches every S0 cell of 03 §12: all stages DONE PASS, T06
  NOT_APPLICABLE, T08b NOT_MODELLED; Q01 0.35 V · Q02 true · Q03/Q03b 6.0 W · Q04 11.0 W ·
  Q05 true · Q06 15.0 V · Q07 −15.0 V · Q08 0.05 mA · Q09 2.40 V · Q11 0.05 mA · Q16 100 µs ·
  Q12 1800 A/µs · Q13 780 V · Q14 6.5 µs · Q18 −15.0 V; v0 600 V, discharge 24.85 s, verified
  40.94 V, SAFE; overall PASS with the 05 §8 label; physical_total_s 499.85; animation 62.48 s at
  speed 8.
- AC-02: two node runs of S0 give byte-identical deterministic sections (empty diff).
- AC-12, in the browser: S0 with a manual Abort during T08a gives exactly one DISCHARGE_START;
  more Abort clicks only add WARNING events; the door unlocks only after DISCHARGE_VERIFIED.
- Browser, file://, Wi-Fi off: Setup → Pre-check → Run → Result for S0 with no console errors;
  every judged reading shows basis, reference (if any) and NOT APPROVED; Q08 shows
  CASE_TRANSFERRED; the banner is on every screen.
- The downloaded report_<run_id>.json parses and has "simulation": true and the banner text.
- grep -nE '\bS[0-9]+b?\b|CUSTOM' igbt-test-cell/js/engine.js igbt-test-cell/js/models.js
  igbt-test-cell/js/sequencer.js returns nothing; grep -rnE 'fetch\(|type="module"|https?://'
  igbt-test-cell returns nothing.
- selfcheck.html: all cases PASS (give the count).
Commit "TICKET 02: engine, sequencer, safe state, S0 + JSON". Report in the standing format,
with the S0 actual-vs-expected table.
```
