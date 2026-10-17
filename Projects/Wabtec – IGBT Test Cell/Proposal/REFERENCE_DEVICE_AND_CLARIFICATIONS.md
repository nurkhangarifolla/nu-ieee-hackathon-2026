---
title: Reference device and sponsor clarifications
tags:
  - wabtec
  - proposal
date: 2026-10-17
---

# Reference device and sponsor clarifications

Back to [[Projects/Wabtec – IGBT Test Cell/Brief|Brief]] · Specs: `Specs/02`–`05` (v0.3) · Background: `Specs/IGBT_Test_Cell_Analysis_Report.md` [A]

This note reviews the engineering proposal [A] and specs 02–05 against new sponsor clarifications, and selects a public reference IGBT. It is a proposal: nothing here changes an application parameter, threshold, verdict, decision row or protected file. **Datasheet ratings are not acceptance limits.** The production profile stays blocked (S5, CONFIG_BLOCKED) until Wabtec supplies approved limits.

## 1. Sponsor clarifications (17 Oct, relayed by Said)

| # | Clarification | Effect on the proposal |
|---|---|---|
| C1 | Physical hardware is not mandatory. | A virtual prototype plus a bench proposal is an acceptable deliverable. |
| C2 | The attached gate driver and the IGBT are one device; both must be tested. | Confirms the working DUT boundary ([A] §2.2 (b)); driver functions are part of the test scope, not just a means to drive it. |
| C3 | Proprietary datasheets cannot be provided. | Wabtec ratings and limits stay unknown; production limits stay unconfigured. |
| C4 | Failures occur randomly across traction motors. | No position or motor to target; every spare needs the same check. Supplies no failure rate. |
| C5 | All positive modules are alike; all negative modules are alike. | Two module variants (positive and negative switch position), interchangeable within each variant. |
| C6 | We may pick a modern IGBT typically used in mainline locomotives as an illustrative reference. | Section 3. |
| C7 | Presentation duration is still unannounced. | Pitch needs a short and a long version. |

## 2. Earlier uncertainties: what is now resolved

Questions are from [A] §8 and §2.2.

| Earlier question | Status | Now known | Still open |
|---|---|---|---|
| Q1 Is a software prototype plus bench proposal acceptable? | **Resolved** (C1) | Hardware not required | Judging criteria, pitch length (C7), submission format |
| Q2 Unit under test and boundary | **Partly** (C2, C5) | IGBT module + attached driver, tested together; two variants | Heatsink inside the 25 kg?; connector pinout; fibre protocol; electrical difference between the variants |
| Q3 Scope of the 3.5 min PASS / NO PASS (IM-LE-0008) | Open | — | Unchanged; still no faster-than claim |
| Q4 Ratings, test voltages, datasheets | **Resolved, negative** (C3, C6) | No proprietary data; a public reference may be used illustratively | Rated DC-link voltage; approved test voltages, dwell times and limits |
| Q5 Which failures occur; new or repaired spares | **Partly** (C4) | Failures are spread randomly across motors | Failure modes, rates, escape rate, spare origin |
| Q6 Desat ≈10 µs: maximum or nominal? | Open (better supported) | The reference's 10 µs short-circuit withstand (§3) supports reading it as an upper bound | Wabtec confirmation; acceptable non-destructive method |
| Q7 Volumes, failed-installation cost, budget | Open | — | Savings and payback stay placeholders |
| Q8 Site constraints | Open | — | Unchanged |

## 3. Reference device: Mitsubishi Electric CM1500HC-66XB

**Choice:** Mitsubishi Electric **CM1500HC-66XB**, HVIGBT, 3300 V / 1500 A, single switch ("1-element in a pack"), insulated, CSTBT(III) IGBT with RFC freewheeling diode, 190 × 140 mm flat baseplate. Datasheet HVM-1147-B, Dec. 2025 [M1].

**This is not Wabtec's device.** Wabtec's actual module and driver are undisclosed (C3). The reference only lets us put realistic orders of magnitude and named test conditions beside our tests. No reference value is loaded into the app or used as an acceptance limit.

**Why this part**
- Manufacturer-stated application: "Traction drives, High Reliability Converters / Inverters, DC choppers" [M1, p. 1]. Mitsubishi announced the XB series (2025) for "inverter systems in railway vehicles and other large industrial equipment" [M2].
- It matches the case's configuration: one switch per module, with 36 modules as 6 inverters × 3 phases × 2 switches (case deck, [A] F1). Mitsubishi is one of four chip suppliers named in Wabtec's troubleshooting-guide notes (F12).
- It is consistent with the case facts:
  - The datasheet tests at V_GE = ±15 V, the case's gate rails (F3).
  - The gate threshold, 5.80–6.80 V, falls inside the case's "about +4 to +7 V" (F3).
  - The short-circuit withstand is t_psc = 10 µs, matching "turns off within 10 µs" (F7).
- The datasheet is the current manufacturer document, read in full for the values below.

**Mainline relevance: evidence and its limit.** Hitachi Energy states that most locomotives use electric propulsion, lists "electric and diesel-electric locomotives" as applications of its traction IGBT modules, and says new converters are "mostly based on IGBT modules" [H1]. In 2021 its 3.3 kV HiPak modules went into Indian EMU converters, while a cargo electric locomotive platform used a 4.5 kV module [H2]. So high-voltage single-switch traction modules are the right class for a locomotive inverter, but **no public source ties this exact part number to a specific mainline locomotive, and Wabtec's voltage class is unknown.** If Wabtec's DC link points to another class (for example 4.5 kV), the reference changes, not the method. The predecessor CM1500HC-66R (2012) is an established fallback if a newly introduced part is unwelcome.

**What the datasheet establishes** [M1, pp. 2–3; maximum ratings, and typical/limit values at the stated conditions]

| Item | Datasheet value | Conditions |
|---|---|---|
| V_CES | 3300 V | V_GE = 0 V, T_j = −40 to +150 °C (3200 V at −50 °C) |
| V_GES | ±20 V | max rating |
| I_C / I_CRM | 1500 A / 3000 A | T_c = 100 °C DC / pulse |
| Isolation V_isol | 6000 V rms | 60 Hz, 1 min (rating) |
| Partial discharge Q_pd | 10 pC | 3500 / 2600 V rms, IEC 61287-1 |
| Short-circuit withstand t_psc | 10 µs | V_CC ≤ 2500 V, V_GE = ±15 V, L_s ≤ 100 nH |
| I_CES | ≤ 3.0 mA (25 °C); typ 26 mA, ≤ 75 mA (150 °C) | V_CE = 3300 V, V_GE = 0 V |
| V_GE(th) | 5.80 / 6.30 / 6.80 V (min/typ/max) | V_CE = 10 V, I_C = 150 mA, 25 °C |
| V_CE(sat) | typ 2.60 V (25 °C); typ 3.30 V, ≤ 3.70 V (150 °C) | I_C = 1500 A, V_GE = 15 V |
| V_EC (diode) | typ 2.30 V (25 °C); ≤ 3.20 V (150 °C) | I_E = 1500 A |
| Switching | t_d(off) ≤ 6.40 µs, t_f ≤ 0.70 µs, t_rr ≤ 1.20 µs; E_on 2.40 J, E_off 2.87 J (typ, 150 °C) | V_CC = 1800 V, I_C = 1500 A, L_s = 100 nH, R_G(on) = 2.0 Ω, R_G(off) = 27 Ω |
| Q_G | 8.2 µC | V_CC = 1800 V, I_C = 1500 A, V_GE = ±15 V |
| Mass | 1.3 kg | module only |

**What still needs an assumed driver/interface or Wabtec confirmation**
- **The driver is not in any IGBT datasheet.** Gate resistors, desat threshold and blanking, under-voltage lockout, the status signal and the fibre protocol belong to Wabtec's attached driver. We keep the case-stated interface as our assumption: ±15 V; ≤ 20 W; supply 25 kHz, 100 V rms; fibre command and status; desat turn-off ≤ 10 µs (F3, F4, F7, F9).
- **Datasheet conditions are not bench conditions.** Its switching figures use external 2.0 / 27 Ω gate resistors at 125–150 °C. Our bench uses the attached driver at ambient temperature, so its readings must be compared with a known-good unit, not with datasheet typicals.
- **Ratings are not test levels.** 6000 V rms isolation and 3300 V blocking are type ratings. Field test voltages, dwell times and limits need Wabtec approval.
- The 25 kg phase module versus a 1.3 kg module means the replaceable unit includes much more (heatsink, busbar, driver, possibly several modules). The boundary needs confirmation.

## 4. Our tests mapped to the reference device and proposed bench

Bench functions are from [A] §4.1. "Limit" says where an acceptance limit would have to come from; nothing in this column is a limit.

| Test | What it checks on module + driver (C2) | Reference datasheet anchor | Bench function | Limit must come from |
|---|---|---|---|---|
| T00 ID, visual, self-check | Variant (positive/negative, C5), label, damage | Mass, outline, terminal torques | Scanner, fixture for **both variants**, lifting aid | Procedure |
| T01 Diode / terminal check | Shorted or open switch or diode | V_EC is specified at 1500 A, not comparable with the case's low-current 0.2–0.8 V diode check | Low-current source + meter | Case value (WS), test current from Wabtec |
| T02 Driver supply | **Driver** supply stage, idle and switching | None (driver) | 25 kHz / 100 V rms supply emulator with power monitor | Wabtec or golden unit (≤ 20 W ceiling is WS) |
| T03 Fibre loop, gate levels | **Driver** optical receiver/transmitter, output stage | V_GES ±20 V max; tests at ±15 V | Optical TMC emulator, isolated gate probe | Wabtec (protocol unknown) |
| T04 Insulation | Module and driver isolation to baseplate | V_isol 6000 V rms rating; Q_pd 10 pC | Hipot/leakage tester | Wabtec test voltage and dwell; 2 mA is a **busbar** figure (WS) |
| T05 V_CE(sat) | Conduction drop | 2.60 V typ at 1500 A, 25 °C (curve gives typicals at lower current) | Pulsed Kelvin source; current below rating | Golden-unit baseline + Wabtec |
| T06 Gate threshold | Gate oxide | 5.80–6.80 V at 150 mA | Precision source; **only if the driver can be detached** | Stays NOT_APPLICABLE by default |
| T07 Blocking leakage | Blocking degradation | I_CES ≤ 3.0 mA at 3300 V, 25 °C | HV source; test voltage probably derated | Golden unit + Wabtec (no datasheet value at derated voltage) |
| T08a Double pulse, DUT switch | Switching **with its own driver** | Switching times and energies at 1800 V / 1500 A, 150 °C | DC link, inductor, scope, **reference unit of the opposite variant** as freewheeler | Golden-unit comparison; di/dt ≤ 5000 A/µs (WS) |
| T08b Diode recovery | Freewheeling diode recovery | t_rr ≤ 1.20 µs, Q_rr, I_rr | Roles swapped with the reference unit | NOT_MODELLED in the app |
| T09 Desat response | **Driver** protection with the module | t_psc 10 µs withstand | Controlled fault emulation, status via fibre | ≤ 10 µs (WS); method to be approved by Wabtec |
| T10 Safe state | Bench, not device | — | Discharge + independent verification | Bench risk assessment (50 V is a demo value) |

## 5. Simulation: what it shows and what hardware must still prove

**The current offline app (v0.5.0) demonstrates**
- The operator workflow: configuration preflight and blocking, interlocks, stage prerequisites, and a single safe-state procedure with abort and FAULT_LOCKED.
- Readings computed from parameters and judged by explicit rules. Each verdict carries its basis, case reference and NOT APPROVED.
- The production profile blocks without approved limits.
- Deterministic JSON/HTML reports, and first-order cycle-time estimates.
- **Its 600 V / 200 A bench and module values describe a fictional demo module** ([A] §5.5). They are not the CM1500HC-66XB and not Wabtec's device. At 200 A the reference's typical curve reads well below the demo's 2.4 V.

**A physical implementation would still have to validate**
- Interfaces: driver connector, fibre protocol, supply emulation, and the fixture for both variants.
- That each test separates known-good from known-faulty modules. This needs golden units of both variants, repeatability, false-reject and fault-coverage data, and cycle time.
- Safe energy levels: derated test voltages, kV-class stored energy, the discharge and interlock chain, and a qualified HV risk review.
- A non-destructive desat check acceptable to Wabtec, and any thermal or partial-discharge effects the bench does not reproduce.
- Every acceptance limit, from Wabtec.

## 6. Material mismatches needing action before pitching

1. **Demo numbers next to a 3.3 kV reference.** Slides and script must label the app's 600 V / 200 A / 3.2 V values as a *fictional demo module*. Present CM1500HC-66XB on a separate "illustrative reference" slide. Never show the two as the same device or as Wabtec's. *Action: wording only (Darkhan, Ramazan); no app change.*
2. **Two variants (C5) are not in the bench description.** The fixture must take both positive and negative modules. Double-pulse testing needs a known-good unit of the *opposite* variant, with driver, as the freewheeling partner, so the bench needs reference units of both variants. That cost is still excluded ([A] §6.2). *Action: add to bench and cost wording. Ask Wabtec whether the variants differ electrically or only mechanically.*
3. **Insulation test with the driver attached (C2).** T04 assumed shorted gate terminals; with the driver fixed to the module, the hipot path passes through driver electronics. *Action: state that the driver isolation path and test voltage need Wabtec's approved method. Do not quote 6000 V rms as a test level.*
4. **Tier 2 energy scale.** If the real device is in the 3.3 kV class, switching at datasheet-like conditions means about 1.8 kV and kA-level pulses. Our Tier 2 bench and its +$53–225k range assumed no voltage class. *Action: pitch Tier 2 as reduced-energy comparison against a golden unit, not datasheet-condition testing. Flag the HV source and stored energy as items to size once Wabtec gives the DC-link class.*
5. **"Random failures" is not a failure rate (C4).** Use it only to justify testing every spare identically. Keep detection-rate, downtime and payback claims out, as in 03 §14.

Not material (no action): the demo's healthy gate threshold (5.5 V) sits below the reference minimum (5.80 V), but T06 is NOT_APPLICABLE by default and the demo module is fictional. The diode-check reading (0.2–0.8 V, low current) and the datasheet V_EC (2.30 V at 1500 A) measure different things.

## Sources

- [M1] Mitsubishi Electric, *CM1500HC-66XB* HVIGBT datasheet, HVM-1147-B, Dec. 2025, pp. 1–4 read: https://www.mitsubishielectric.com/cn/semiconductors/powerdevices/datasheets/hv/xb_series/cm1500hc-66xb_e.pdf
- [M2] Mitsubishi Electric press release, "Mitsubishi Electric to Ship Samples of XB Series HVIGBT Module", 8 Apr. 2025: https://www.mitsubishielectric.com/en/pr/2025/0408/
- [H1] Hitachi Energy, *Traction* (semiconductors) page: https://www.hitachienergy.com/products-and-solutions/semiconductors/traction
- [H2] Hitachi Energy, IGBT HiPak orders for the Indian traction market, 6 Jul. 2021: https://www.hitachienergy.com/news-and-events/features/2021/07/igbt-hipak-orders-indian-traction-market
- [A] `Specs/IGBT_Test_Cell_Analysis_Report.md` v1.1 (fact register F1–F14, §2.2, §4, §5.5, §6.2, §8); case deck summary `Sources/Summary – Wabtec case deck.md`.
- Search-level only, not relied on: a PCIM Europe 2024 paper on a 1250 kW locomotive converter with 3.3 kV IGBT modules (abstract unreachable); a 3.3 kV / 1500 A predecessor, CM1500HC-66R (2012).
