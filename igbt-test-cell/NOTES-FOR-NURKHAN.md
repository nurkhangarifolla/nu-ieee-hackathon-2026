# Notes for Nurkhan

## Needs your decision
- **`required` flag on rules.** 05 §3.3 has no `required` column. I set `required: true` for every non-info rule and `false` for Q16 (info). This matches 03 §12. Logged in `Decisions.md` as Pending Said.
- **Presentation-laptop browser (D1).** Default Chrome or Edge. Tell me if it's Safari or Firefox; I'll test there.
- **TICKETS 02–03 in your own browser (3 min).** I tested `file://` in headless Chrome with the network off (screenshots in `../design/screenshots/t02-*` and `t03-*`). The app's built-in browser pane can't run it: the folder name ends in a space, so the pane shows a static copy without scripts. Please double-click `index.html` once with Wi-Fi off: run S0 and press Abort during T08a; then run S8 → VIEW RESULT → VIEW REPORT → Print / Save PDF and check every PDF page has the yellow banner and the black footer. Check the console is clean.
- **Abort and then a failed discharge (TICKET 02, Pending Said).** If a run is aborted *and* the safe state is then not verified, `abort_reason` keeps the trigger (e.g. `OPERATOR`) and the label is the "safe state not verified; enclosure kept locked" one. 05 §7 allows one reason only. Only reachable by aborting S8 by hand.

## Decisions I made
- **Scenario overrides shape.** Every scenario carries `overrides: { module, bench }`, `events: []` and `force_profile: null` even when empty, so the engine reads one shape. CUSTOM has `custom: true`; its overrides come from the Setup table.
- **Custom table sends only changed values** as module overrides. Text that isn't a number goes through as text so the validation screen shows it (e.g. `abc`). An empty `desat_trip_us` means `null` (never trips).
- **Module ID on Setup** overrides `module_parameters.module_id`. `module_note` is fixed text and read-only.
- **Profile forced by S5.** Picking S5 locks the profile selector to `production_unconfigured`. Picking that profile by hand with any scenario also blocks (same rule, 05 §3).
- **Preflight order.** Validation runs first; a profile block is only reported when every input is valid (02 §4: invalid data never produce a verdict).
- **Production profile** uses the same bench conditions as demo and the same rules with every limit `null`.
- **run_id counter** lives in `sessionStorage` (falls back to memory), so IDs stay unique across reloads in one browser session.
- **Extra data fields** (allowed by 05 header): `module_parameter_units`, `bench_parameter_units`, `built_priorities`, `speeds`, `seed_default`, `verdict_labels`, `fixed_texts` (banner, limitations, chip legend, Screen 1b text, FAULT_LOCKED banner, clock caption, report footer).
- **P1/P2 scenarios** are listed but disabled with "not built yet".
- **Design pass (01b).** Look follows `../DESIGN.md` (NVIDIA style; the project box at its top wins). Arial only (offline). Added a workflow strip (Setup → Report, display only), a black footer with the 05 report-footer text and version, a native `<dialog>` for Limitations (Escape closes), focus moves to each screen's heading, and the 1a message now says how to fix the inputs. Form borders use `mute` instead of `hairline` for contrast. No behaviour, value or fixed text changed.
- **Git.** The repo is now the vault root; this folder's TICKET 01 commit is kept in that history. `dev/` (TICKET 02) stays out of the zip.

### TICKET 02 (engine, sequencer, safe state, S0 + JSON)
- **IL3 (ground-bond) shows OK at Pre-check and is not tied to `bench_selfcheck_ok`.** If it were, a self-check failure would open IL3 and end ABORTED, but 03 §12 wants S10 to end INCOMPLETE. Pending Said in `Decisions.md`.
- **Number hygiene.** Stored reading values are rounded to 4 dp, and stored seconds and volts (event times, stage times, bus voltages) to 2 dp, before judging and serialising. This removes float noise (2.4000000000000004 → 2.4) and keeps N3's 11.000 mΩ exactly on the 3.2 V limit (PASS). Margins are 4 dp. Pending Said in `Decisions.md`.
- **Display precision** per quantity (`display_decimals` in `data.js`) is read off the 03 §12 key values (Q01 0.35, Q06 15.0, Q12 1800, …). Display only; stored values keep 4 dp.
- **Reason text** follows the 03 §8 templates with the full rule label. The 05 §6 example uses a shorter label and adds "at I = 200 A pulse"; I kept 03 §8. PASS reasons mirror the FAIL template ("≤ max", "within"). Chips are also added to `time_max` reasons. Readings not run say "`<label>`: not measured (stage `<status>`)".
- **Extra fields** (allowed by the 05 header): `reading.conditions`, `stage.status_note`, `stage.model_equation` (T07 bus charge; T10 t_safe and E), `deterministic.hypotheses` (a list kept apart from verdicts). Stage `conditions` = the stage's reading conditions joined with "; ".
- **Safe-state timing.** SS1–SS6 events share the moment the procedure starts; verification is at t_safe + `verify_delay_s` (or `discharge_timeout_s` on failure). T10 = COMPUTED discharge + DWELL 20 s, so the 2 s verification sits inside the 20 s. On a failed discharge `discharge_time_s` is `null` (the bus never reached v_safe) and the COMPUTED part is the 120 s timeout.
- **An abort in T00 still runs the safe-state procedure** (02 §5: every abort enters it). T10 is skipped only after a T00 self-check failure (03 §5); that run ends in state `ENDED` with the door unlocked and no discharge events (nothing was energised).
- **Demo controls.** Heartbeat loss opens IL6 with abort cause `WATCHDOG`; Open door opens IL1 (`IL1_OPEN`). A control pressed during the safe-state procedure logs a WARNING and is ignored. Pre-check has toggles for IL1, IL2 and IL6 so you can show START being disabled.
- **Gate command/measured** on the bench panel is set per stage for display only (not in the JSON).
- **Run timer**: ticks every 100 ms and advances `speed × real dt`, with a cap of 0.5 s real time per tick (a hidden tab slows the run instead of jumping). Every boundary is processed at its exact planned time, so the browser run gives the same deterministic section as `node dev/run-node.js` (checked).
- **Run → Result** needs a click on VIEW RESULT, so the final event log stays readable. In FAULT_LOCKED, New run is disabled; the red banner's "Reset simulation" is the only exit and logs a WARNING event (05 §5 has no RESET event type).
- **`case_references` in the JSON** = references cited by this run's readings, plus REF-09 when it appears in conditions text. The CONFIG_BLOCKED JSON has a single `CONFIG_BLOCKED` event.
- **Noise.** `rng.n` returns x unchanged for σ = 0 and never touches a PRNG. σ > 0 (P1) throws "not built"; nothing in the UI can set it.
- **Result table** puts each reason on its own line under the reading, so the table fits without sideways scrolling.

### TICKET 03 (S1–S8 checks, HTML report, Report screen)
- **One copy of the checks.** The 03 §12 expected table lives only in `selfcheck.html`. `node dev/selfcheck-node.js` reads that same `<script id="checks">` block and also prints the AC-11 actual-vs-expected table. Where 03 §12 says only "T10 DONE" (S1, S4, S8), the check asks for status DONE; Q18 is checked under key values.
- **S8 "timeout 120 s"** is checked as DISCHARGE_FAILED exactly 120 s after DISCHARGE_START, with the bus still at 600 V at verification.
- **Shared display text.** Value, rule, margin and chip text moved from `ui.js` into `report.js` (`IGBT.report.text`). The Result screen and the HTML report use the same helpers, so they can't disagree (AC-06).
- **HTML report layout.** 05 §10 order. A4 landscape. Banner and footer repeat on every printed page (fixed elements plus repeating table header/footer spacers; checked: every page of the S0, S1, S4, S5, S8 PDFs). The footer also carries the banner text and run ID. Each stage gets its own row (status, blocked reason) above its readings; each reading has a second line with conditions, reason and model equation. Hypotheses appear only in section 5. S8 shows the FAULT_LOCKED text in red under Overall and in the safe-state block.
- **"Overrides" in the report inputs** = values that differ from the data-file defaults, plus the scenario's events and forced profile (read from `data.js` by scenario ID, display only, never used for a verdict).
- **No deterministic hash in the footer.** It's P2 in 04 §1 (05 §6.2 only suggests it). Easy to add later if Said wants it for AC-02.
- **Screen 5 Report.** Preview in an iframe. Print / Save PDF prints the preview only; if the frame can't be reached it opens the report in a new tab with a note. New run is disabled in FAULT_LOCKED, as on Result. VIEW REPORT is now the Result screen's main button; 1b has View report too.
- **1b report** is built once when 1b opens, so its JSON and HTML downloads share the same `created_local`.
