# Notes for Nurkhan

## Needs your decision
- **`required` flag on rules.** 05 §3.3 has no `required` column. I set `required: true` for every non-info rule and `false` for Q16 (info). This matches 03 §12. Logged in `Decisions.md` as Pending Said.
- **Presentation-laptop browser (D1).** Default Chrome or Edge. Tell me if it's Safari or Firefox; I'll test there.

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
