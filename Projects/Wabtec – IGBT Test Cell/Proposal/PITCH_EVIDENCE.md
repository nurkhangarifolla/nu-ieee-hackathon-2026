# Pitch evidence — 17 October 2026

**Pitch proposition: a proposed bench for checking replacement modules before installation, demonstrated through a virtual workflow prototype. Physical performance and economics remain unvalidated.**

Baseline: commit `7349eb68bac8ef696cd862f695a86ad6b8329487`, app v0.5.0 ([N], “TICKET 05”). This condenses existing proposal [A]; specs 02–05 v0.3 govern conflicts. Decisions below remain unapproved.

## 1. Operational problem — case facts

Installing a faulty replacement from stock wastes labour and complicates diagnosis: is the replacement faulty, or is another locomotive component responsible? The case requests an off-locomotive test cell, chosen parameters, justified duration, instructions, approximate equipment cost and laptop reporting. No failure frequency or monetary loss is supplied. Sources: [C], §1 “Wabtec”, “What problem do we have?” and “The task itself”; [A], §§2.1–2.3. These are case statements, not independently measured field outcomes.

## 2. Architecture and testing method — proposal

Assume one switch-position module with its attached driver; confirm the physical boundary and interfaces. A laptop sequences/logs; a controller handles I/O and watchdog; an independent hardwired safety chain controls enclosure access, HV enable and discharge verification. Add lifting/fixture/ESD provision, driver-power and optical-command emulators, leakage instrumentation, pulsed Kelvin measurement, HV source/DC-link, inductor and isolated oscilloscope probes. [A], §§2.2, 4.1–4.2.

Tier 1 screens identification, diode/terminal integrity, driver supply, fibre/gate response and insulation. Insulation testing can itself involve HV despite the DC bus remaining uncharged. Tier 2 proposes pulsed conduction, blocking, switching and controlled protection-response tests. Double-pulse testing requires a known-good reference module **with driver**: its diode freewheels during DUT switching; roles swap to test DUT diode recovery. Driver interference, test voltages and fault-emulation feasibility remain unresolved. [T], §§1, 3–5; [S], §6. This is a concept, not a construction procedure.

## 3. Current software — implemented baseline, documented evidence

The offline app computes synthetic readings from parameters, applies explicit rules, gates stages, models abort/discharge/FAULT_LOCKED, and builds JSON/HTML reports with a print path. Custom resistance changes can flip the conduction verdict; optional seeded noise is implemented. S0 uses the qualified label **“PASS — DEMO PROFILE (illustrative, not-approved rules; not an acceptance decision)”**. Missing production limits block execution. T06 defaults to NOT_APPLICABLE; diode recovery T08b is NOT_MODELLED. [N], “TICKET 02”–“TICKET 05”; [T], §§4–5, 12; [R], §§3, 8.

[N], “TICKET 05”, records 222/222 checks; this brief does not claim a new test run. Baseline packaging integrity is verified separately. Real downloads, independent HTML, PDF output and second-laptop offline acceptance remain unverified in this session; AC-01 remains open ([T], §13).

## 4. Duration — estimates, not measured throughput

| Scope | Estimated physical cycle |
|---|---:|
| Tier 1; bus never charged | About 5 min |
| S0; gate threshold inapplicable, diode recovery omitted | About 8 min |
| Proposed cycle adding diode recovery | About 9 min |
| Also adding accessible-gate threshold test | About 9 min |

Rounded estimates for pitch use; component calculations remain in [T], §7: 150 s handling, 60 s placeholder insulation dwell, assumed stage dwells and calculated RC discharge. Added diode recovery is a 30 s placeholder; gate threshold adds 20 s. Animation acceleration is separate. The case’s approximately 3.5-minute check has unknown scope; no faster-than-baseline claim is justified ([A], §2.4).

## 5. Bench cost — corrected, unquoted USD estimates

| Equipment scope | Corrected estimate | Included functions |
|---|---:|---|
| Tier 1 | $21–67k | Enclosure/safety chain; fixture/lifting/ESD; driver/optical emulators; supplies, meters, insulation tester and controller |
| Additional Tier 2 | +$53–225k | HV source/DC-link/discharge; inductor/pulse generation; scope/probes/shunt; pulsed Kelvin measurement |
| Combined Tier 1 + Tier 2 | $74–292k | Both equipment tiers, subject to exclusions below |

**Excluded costs:** reference module/driver (unknown), contingency, deployment engineering, risk assessment, validation and training. Annual calibration/service is separate: 8–12% of capital is an unsupported assumption, not a vendor charge. Equipment totals are corrected line-item sums, not quotations; earlier totals are superseded. [A], correction note and §§6.1–6.2. Savings/payback inputs in §6.3 are placeholders: omit them from claimed results.

## 6. Limitations and next physical validation — proposed steps

1. Confirm hardware versus virtual-prototype judging expectations, DUT boundary, interfaces, ratings and approved test conditions with Wabtec ([A], §8).
2. Obtain qualified engineering risk review; design/calibrate measurement and independent interlock/discharge chains before energisation ([A], §§3.4, 4.2).
3. Validate low-energy checks against known-good/known-fault modules, then review controlled switching/protection methods. Measure repeatability, false rejects, fault coverage and cycle time before production decisions ([A], §§3.2–3.3, 6.3, 9.3).

No physical testing, detection rate, industrial-safety validation or manufacturer approval is established. Case-derived comparisons remain NOT APPROVED; the busbar leakage statement does not establish a module insulation limit ([R], §§1, 9).

## Appendix — internal review: Pending Said decisions

All eight remain pending in [D]; behavior: [N], “Decisions I made”, “TICKET 02”, “TICKET 03b”, “TICKET 05”. Resolutions are proposals.

| Current behavior / topic | Proposed resolution | Demo effect |
|---|---|---|
| Non-info rules required; Q16 informational | Retain explicit required flags | Verdict policy throughout |
| IL3 pre-check OK independent of general bench self-check | Document separate ground-bond assumption; require actual physical verification | S10/fault narrative; S0 unchanged |
| Abort trigger retained; unverified-state label dominates | Retain trigger plus stronger locked-state label | Abort during S8 |
| Failed discharge duration null; T10 counts timeout | Retain distinction from successful discharge | S8 timing/report |
| Full-precision judgment; display rounding | Retain; document floating-point cleanup | Boundary-value verdicts |
| Profiles require complete modelled rule sets | Retain rejection of incomplete profiles | Malformed-profile demos |
| Verification beyond closing dwell adds time | Retain extra waiting component | Custom delays; defaults unchanged |
| S8b reports modelled voltage despite unavailable meter | Report verification voltage null; preserve model estimate separately, explicitly labelled | S8b report; requires implementation/retest if adopted |

### Source key

- [A]: [IGBT_Test_Cell_Analysis_Report.md](../Specs/IGBT_Test_Cell_Analysis_Report.md), v1.1.
- [T]: [03_TEST_AND_ACCEPTANCE.md](../Specs/03_TEST_AND_ACCEPTANCE.md), v0.3.
- [S]: [02_SYSTEM_DESIGN.md](../Specs/02_SYSTEM_DESIGN.md), v0.3.
- [R]: [05_DATA_AND_REPORT_SCHEMA.md](../Specs/05_DATA_AND_REPORT_SCHEMA.md), v0.3.
- [D]: [Decisions.md](../Decisions.md), “Decisions: Wabtec” table.
- [N]: [NOTES-FOR-NURKHAN.md](../../../igbt-test-cell/NOTES-FOR-NURKHAN.md).
- [C]: [Sponsor talks transcript.md](../../../Originals/Sponsor%20talks%20transcript.md), §1; automatic transcript, terms may be imperfect.
