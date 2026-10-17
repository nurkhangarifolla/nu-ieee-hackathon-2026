---
title: Reference device and sponsor clarifications
tags:
  - wabtec
  - proposal
date: 2026-10-17
---

# Reference device and sponsor clarifications

Back to [[Projects/Wabtec – IGBT Test Cell/Brief|Brief]] · Specs: `Specs/02`–`05` (v0.3) · Background: `Specs/IGBT_Test_Cell_Analysis_Report.md` [A]

This note reviews the engineering proposal [A] and specs 02–05 against new sponsor clarifications. Per the sponsor, **the basic specifications on case slide #5 are the primary basis** (§2). A public reference IGBT (§4) is supporting context only: its ratings do not replace the slide #5 specifications.

This is a proposal: nothing here changes an application parameter, threshold, verdict, decision row or protected file. **Datasheet ratings are not acceptance limits.** The production profile stays blocked (S5, CONFIG_BLOCKED) until Wabtec supplies approved limits.

## 1. Sponsor clarifications (17 Oct, relayed by Said)

| # | Clarification | Effect on the proposal |
|---|---|---|
| C1 | Physical hardware is not mandatory. | A hardware build is optional. This does not confirm that our current simulation meets every judging requirement; the judging criteria are still unannounced. |
| C2 | The attached gate driver and the IGBT are one device; both must be tested. | Confirms the working DUT boundary ([A] §2.2 (b)); driver functions are part of the test scope. |
| C3 | Proprietary datasheets cannot be provided. | Wabtec ratings and limits stay unknown; production limits stay unconfigured. |
| C4 | Failures occur randomly across traction motors. | No position or motor to target; every spare needs the same check. Supplies no failure rate. |
| C5 | All positive modules are alike; all negative modules are alike. | Two module variants (positive and negative switch position), interchangeable within each variant. |
| C6 | We may pick a modern IGBT typically used in mainline locomotives as an illustrative reference. | §4, as supporting context only. |
| C7 | Presentation duration is still unannounced. | Pitch needs a short and a long version. |
| C8 | 21:56: "Basic specifications listed on slide #5 will guide you." | Slide #5 is the primary basis (§2). |

## 2. Slide #5 specifications mapped to our tests (primary basis)

The six basic specifications on slide #5 ([A] fact register F3–F8), the tests that use them, and the test conditions slide #5 does not give. In the app, slide #5 values carry the WS (Wabtec slide) source tag and stay NOT APPROVED.

| Slide #5 specification | Our tests | Missing test conditions |
|---|---|---|
| **Gate drive** +15 V ON / −15 V OFF; fully on above about +4 to +7 V (F3) | T03 gate levels (ON/OFF); T06 gate threshold; T10 gate OFF at safe state (Q18) | Tolerance on ±15 V; load and measurement point (gate terminals through the attached driver?); collector current and V_CE at which the threshold applies; approved gate access for T06 |
| **Driver power** up to 20 W (F4) | T02 driver supply, idle and switching | Idle versus switching split; switching frequency and duty during the check; supply conditions (25 kHz, 100 V rms per slide 8, F9) and their tolerance |
| **Max di/dt** 0–5000 A/µs (F5) | T08a double pulse (Q12) | Maximum permitted or typical range? DC-link voltage, current, gate resistance and temperature at which it applies; where di/dt is measured |
| **Freewheeling diode** 0.2–0.8 V forward, reverse open (F6) | T01 diode / terminal check (Q01, Q02) | Test current and method (reads like a low-current diode check); temperature; what "open" means as a leakage threshold |
| **Desaturation protection**: switch turns off within 10 µs after a saturation fault (F7) | T09 protection response (Q14) | Maximum or nominal? Measured from which event (fault onset, desat detection) to which (gate OFF, current zero)? Fault-emulation method acceptable to Wabtec; status-flag timing |
| **Busbar insulation**: leakage current up to 2 mA (F8) | T04 insulation leakage (Q08, rule basis CASE_TRANSFERRED) | Applies to the **busbar**, not established as a module requirement; test voltage, polarity, dwell and terminals; whether and how it transfers to the module + driver |

## 3. Earlier uncertainties: what is now resolved

Questions are from [A] §8 and §2.2.

| Earlier question | Status | Now known | Still open |
|---|---|---|---|
| Q1 Is a software prototype plus bench proposal acceptable? | **Partly** (C1) | Physical hardware is optional | Judging criteria, pitch length (C7), submission format; whether our simulation's scope meets them |
| Q2 Unit under test and boundary | **Partly** (C2, C5) | IGBT module + attached driver, tested together; two variants | Assembly contents within the 25 kg; connector pinout; fibre protocol; electrical difference between the variants |
| Q3 Scope of the 3.5 min PASS / NO PASS (IM-LE-0008) | Open | — | Unchanged; still no faster-than claim |
| Q4 Ratings, test voltages, datasheets | **Resolved, negative** (C3, C6, C8) | No proprietary data; slide #5 is the basis; a public reference may be used illustratively | Rated DC-link voltage; approved test voltages, dwell times and limits |
| Q5 Which failures occur; new or repaired spares | **Partly** (C4) | Failures are spread randomly across motors | Failure modes, rates, escape rate, spare origin |
| Q6 Desat 10 µs: maximum or nominal; how measured? | **Open** | — | Wabtec's timing definition (§2); acceptable non-destructive method |
| Q7 Volumes, failed-installation cost, budget | Open | — | Savings and payback stay placeholders |
| Q8 Site constraints | Open | — | Unchanged |

## 4. Reference device (supporting context): Mitsubishi Electric CM1500HC-66XB

**Choice:** Mitsubishi Electric **CM1500HC-66XB**, HVIGBT, 3300 V / 1500 A, single switch ("1-element in a pack"), insulated, CSTBT(III) IGBT with RFC freewheeling diode, 190 × 140 mm flat baseplate. Datasheet HVM-1147-B, Dec. 2025 [M1].

**This is not Wabtec's device**, which is undisclosed (C3). The reference only puts realistic orders of magnitude and named test conditions beside our tests. No reference value is loaded into the app, used as an acceptance limit, or used to replace or interpret a slide #5 specification.

**Why this part**
- Manufacturer-stated application: "Traction drives, High Reliability Converters / Inverters, DC choppers" [M1, p. 1]. Mitsubishi announced the XB series (2025) for "inverter systems in railway vehicles and other large industrial equipment" [M2].
- One switch per module, matching the case's 36 modules = 6 inverters × 3 phases × 2 switches ([A] F1). Mitsubishi is one of four chip suppliers named in Wabtec's troubleshooting-guide notes (F12).
- Its datasheet conditions use V_GE = ±15 V, the slide #5 gate rails. Its gate threshold, 5.80–6.80 V, lies inside the slide's "about +4 to +7 V".
- It is the current manufacturer document; the values below were read from it directly.

**Mainline relevance: evidence and its limit.** Hitachi Energy states that most locomotives use electric propulsion, lists "electric and diesel-electric locomotives" as applications of its traction IGBT modules, and says new converters are "mostly based on IGBT modules" [H1]. In 2021 its 3.3 kV HiPak modules went into Indian EMU converters, while a cargo electric locomotive platform used a 4.5 kV module [H2]. So high-voltage single-switch traction modules are the right class for a locomotive inverter, but **no public source ties this exact part number to a specific mainline locomotive, and Wabtec's voltage class is unknown.** If Wabtec's DC link points to another class (for example 4.5 kV), the reference changes, not the method. The predecessor CM1500HC-66R (2012) is an established fallback if a newly introduced part is unwelcome.

**What the datasheet establishes** [M1, pp. 2–3; maximum ratings, and typical/limit values at the stated conditions]

| Item | Datasheet value | Conditions |
|---|---|---|
| V_CES | 3300 V | V_GE = 0 V, T_j = −40 to +150 °C (3200 V at −50 °C) |
| V_GES | ±20 V | max rating |
| I_C / I_CRM | 1500 A / 3000 A | T_c = 100 °C DC / pulse |
| Module isolation V_isol | 6000 V rms | 60 Hz, 1 min, charged part to baseplate (rating) |
| Partial discharge Q_pd | 10 pC | 3500 / 2600 V rms, IEC 61287-1 |
| Short-circuit withstand t_psc | 10 µs | V_CC ≤ 2500 V, V_GE = ±15 V, L_s ≤ 100 nH |
| I_CES | ≤ 3.0 mA (25 °C); typ 26 mA, ≤ 75 mA (150 °C) | V_CE = 3300 V, V_GE = 0 V |
| V_GE(th) | 5.80 / 6.30 / 6.80 V (min/typ/max) | V_CE = 10 V, I_C = 150 mA, 25 °C |
| V_CE(sat) | typ 2.60 V (25 °C); typ 3.30 V, ≤ 3.70 V (150 °C) | I_C = 1500 A, V_GE = 15 V |
| V_EC (diode) | typ 2.30 V (25 °C); ≤ 3.20 V (150 °C) | I_E = 1500 A |
| Switching | t_d(off) ≤ 6.40 µs, t_f ≤ 0.70 µs, t_rr ≤ 1.20 µs; E_on 2.40 J, E_off 2.87 J (typ, 150 °C) | V_CC = 1800 V, I_C = 1500 A, L_s = 100 nH, R_G(on) = 2.0 Ω, R_G(off) = 27 Ω |
| Q_G | 8.2 µC | V_CC = 1800 V, I_C = 1500 A, V_GE = ±15 V |
| Mass | 1.3 kg | module only |

**Two distinctions kept throughout**
- **Withstand is not response time.** t_psc = 10 µs is how long the *module* can survive a short circuit under the stated conditions. Slide #5's 10 µs is a *driver protection* turn-off after a saturation fault. They are different quantities, and the equal numbers do not show that one is derived from the other. Wabtec's timing definition stays open (§2, Q6).
- **Module isolation is not busbar insulation.** V_isol = 6000 V rms is a module isolation *rating*. Slide #5's 2 mA is a *busbar* leakage figure. Neither is a module test level or limit for our bench.

**What still needs an assumed driver/interface or Wabtec confirmation**
- **The driver is not in any IGBT datasheet.** Gate resistors, desat threshold and blanking, under-voltage lockout, the status signal and the fibre protocol belong to Wabtec's attached driver. We keep the case-stated interface as our assumption: slide #5 (±15 V, ≤ 20 W, 10 µs protection) and slide 8 (supply 25 kHz, 100 V rms; fibre command and status).
- **Datasheet conditions are not bench conditions.** Its switching figures use external 2.0 / 27 Ω gate resistors at 125–150 °C. Our bench uses the attached driver at ambient temperature, so its readings would be compared with a known-good unit, not with datasheet typicals.
- **Ratings are not test levels.** 6000 V rms isolation and 3300 V blocking are type ratings. Field test voltages, dwell times and limits need Wabtec approval.
- **The assembly is unknown.** The 25 kg phase module versus a 1.3 kg module does not establish what the assembly contains (heatsink, busbar, driver, number of modules). The boundary needs confirmation.

## 5. Our tests mapped to the proposed bench

Bench functions are from [A] §4.1. "Limit" says where an acceptance limit would have to come from; nothing in this column is a limit.

| Test | What it checks on module + driver (C2) | Slide #5 basis | Reference context [M1] | Bench function (proposed) | Limit must come from |
|---|---|---|---|---|---|
| T00 ID, visual, self-check | Variant (positive/negative, C5), label, damage | — | Outline, terminal torques | Scanner, fixture able to take both variants, lifting aid | Procedure |
| T01 Diode / terminal check | Shorted or open switch or diode | FWD 0.2–0.8 V, reverse open | V_EC is at 1500 A; not comparable with a low-current check | Low-current source + meter | Slide #5 value; test current from Wabtec |
| T02 Driver supply | **Driver** supply stage, idle and switching | ≤ 20 W | None (driver) | 25 kHz / 100 V rms supply emulator with power monitor | Slide #5 ceiling; idle/switching bands from Wabtec or a golden unit |
| T03 Fibre loop, gate levels | **Driver** optical receiver/transmitter, output stage | +15 / −15 V | V_GES ±20 V max | Optical TMC emulator, isolated gate probe | Slide #5 rails; tolerance and protocol from Wabtec |
| T04 Insulation | Isolation to baseplate of the module + driver | Busbar leakage ≤ 2 mA (busbar, not module) | V_isol 6000 V rms rating; Q_pd 10 pC | Hipot/leakage tester | Wabtec: isolation arrangement, test terminals, voltage and dwell. Driver attachment alone does not establish the hipot current path |
| T05 V_CE(sat) | Conduction drop | — | 2.60 V typ at 1500 A, 25 °C | Pulsed Kelvin source; current below rating | Golden-unit baseline + Wabtec |
| T06 Gate threshold | Gate oxide | About +4 to +7 V | 5.80–6.80 V at 150 mA | Precision source, **only with approved gate access/configuration** (method open; not necessarily driver detachment) | Stays NOT_APPLICABLE by default |
| T07 Blocking leakage | Blocking degradation | — | I_CES ≤ 3.0 mA at 3300 V, 25 °C | HV source; test voltage probably derated | Golden unit + Wabtec (no datasheet value at derated voltage) |
| T08a Double pulse, DUT switch | Switching **with its own driver** | di/dt up to 5000 A/µs | Switching at 1800 V / 1500 A, 150 °C | DC link, inductor, scope, freewheeling partner unit (assumed topology, below) | Golden-unit comparison; slide #5 di/dt |
| T08b Diode recovery | Freewheeling diode recovery | — | t_rr ≤ 1.20 µs, Q_rr, I_rr | Roles swapped with the partner unit | NOT_MODELLED in the app |
| T09 Protection response | **Driver** desat protection with the module | Turn-off within 10 µs after a saturation fault | Not used (t_psc is a withstand rating, §4) | Controlled fault emulation, status via fibre | Slide #5 value once Wabtec defines start/end events and method |
| T10 Safe state | Bench, not device | Gate −15 V OFF | — | Discharge + independent verification | Bench risk assessment (50 V is a demo value) |

**Double-pulse partner: a proposed assumption.** Our double-pulse concept pairs the DUT with a known-good partner module and driver acting as freewheeler. Using a unit of the *opposite* physical variant (positive with negative) is our proposed fixture/topology assumption. The sponsor's positive/negative clarification (C5) does not establish it. The number of reference units, and which variants they must be, stay provisional until Wabtec confirms interfaces and how the variants differ.

## 6. Simulation: what it shows and what hardware must still prove

**The current offline app (v0.5.0) demonstrates**
- The operator workflow: configuration preflight and blocking, interlocks, stage prerequisites, and a single safe-state procedure with abort and FAULT_LOCKED.
- Readings computed from parameters and judged by explicit rules. Slide #5 values serve as illustrative WS rules; each verdict carries its basis, case reference and NOT APPROVED.
- The production profile blocks without approved limits.
- Deterministic JSON/HTML reports, and first-order cycle-time estimates.
- **Its 600 V / 200 A bench and module values describe a fictional demo module** ([A] §5.5). They are not the CM1500HC-66XB and not Wabtec's device. At 200 A the reference's typical curve reads well below the demo's 2.4 V.

Physical hardware being optional (C1) does not confirm that this scope satisfies every judging requirement; that remains to be seen once criteria are announced.

**A physical implementation would still have to validate**
- Interfaces: driver connector, fibre protocol, supply emulation, the isolation arrangement, and a fixture for both variants.
- That each test separates known-good from known-faulty modules. This needs golden units, repeatability, false-reject and fault-coverage data, and cycle time.
- Safe energy levels: derated test voltages, stored energy, the discharge and interlock chain, and a qualified HV risk review.
- A non-destructive protection-response check acceptable to Wabtec, and any thermal or partial-discharge effects the bench does not reproduce.
- Every acceptance limit, from Wabtec.

## 7. Material mismatches needing action before pitching

1. **Demo numbers next to a 3.3 kV reference.** Slides and script must label the app's 600 V / 200 A / 3.2 V values as a *fictional demo module*. Lead with the slide #5 specifications; show CM1500HC-66XB only as "illustrative public reference", never as the same device or as Wabtec's. *Action: wording only (Darkhan, Ramazan); no app change.*
2. **Missing slide #5 test conditions (§2).** Every slide #5 value lacks conditions: tolerance, test current, measurement events, test voltage. *Action: present them as case values with stated open conditions, and put the six condition questions to Wabtec.*
3. **Two variants and reference units (C5).** The fixture should take both variants. How many reference units the double-pulse test needs, and of which variant, is provisional (§5). The reference-unit cost is still excluded ([A] §6.2). *Action: say "reference units, quantity to be confirmed". Ask Wabtec how the variants differ.*
4. **Insulation test method (C2, F8).** With the driver attached, the isolation arrangement and the hipot current path are unknown. The 2 mA figure is for the busbar, and 6000 V rms is a module rating. *Action: present T04 as "method, terminals and voltage to be approved by Wabtec"; do not quote either figure as a module test level.*
5. **Tier 2 energy scale.** If the real device is in the 3.3 kV class, switching at datasheet-like conditions means about 1.8 kV and kA-level pulses. Our Tier 2 bench and its +$53–225k range assumed no voltage class. *Action: pitch Tier 2 as reduced-energy comparison against a golden unit. Flag the HV source and stored energy as items to size once Wabtec gives the DC-link class.*
6. **"Random failures" is not a failure rate (C4).** Use it only to justify testing every spare identically. Keep detection-rate, downtime and payback claims out, as in 03 §14.

Not material (no action): the demo's healthy gate threshold (5.5 V) sits below the reference minimum (5.80 V), but it is inside slide #5's range, T06 is NOT_APPLICABLE by default, and the demo module is fictional. The slide #5 diode reading (0.2–0.8 V) and the datasheet V_EC (2.30 V at 1500 A) measure different things.

## Sources

- [M1] Mitsubishi Electric, *CM1500HC-66XB* HVIGBT datasheet, HVM-1147-B, Dec. 2025, pp. 1–4 read: https://www.mitsubishielectric.com/semiconductors/powerdevices/datasheets/hv/xb_series/cm1500hc-66xb_e.pdf
- [M2] Mitsubishi Electric press release, "Mitsubishi Electric to Ship Samples of XB Series HVIGBT Module", 8 Apr. 2025: https://www.mitsubishielectric.com/en/pr/2025/0408/
- [H1] Hitachi Energy, *Traction* (semiconductors) page: https://www.hitachienergy.com/products-and-solutions/semiconductors/traction
- [H2] Hitachi Energy, IGBT HiPak orders for the Indian traction market, 6 Jul. 2021: https://www.hitachienergy.com/news-and-events/features/2021/07/igbt-hipak-orders-indian-traction-market
- [A] `Specs/IGBT_Test_Cell_Analysis_Report.md` v1.1 (fact register F1–F14, §2.2, §4, §5.5, §6.2, §8); case deck summary `Sources/Summary – Wabtec case deck.md` (slide #5 specifications).
- Search-level only, not relied on: a PCIM Europe 2024 paper on a 1250 kW locomotive converter with 3.3 kV IGBT modules (abstract unreachable); a 3.3 kV / 1500 A predecessor, CM1500HC-66R (2012).
