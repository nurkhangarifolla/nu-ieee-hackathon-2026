/* report.js: report JSON builder in the 05 §6 shape, with a fixed key order, and the
   CONFIG_BLOCKED variant (05 §6 notes); the HTML report in the 05 §10 layout, built from the
   same report object; shared display text used by the UI and the HTML report (AC-06).
   Downloads via Blob (02 §3). */
window.IGBT = window.IGBT || {};
window.IGBT.report = (function () {
  var E = window.IGBT.engine;
  function D() { return window.APP_DATA; }
  function F() { return window.IGBT.models.fmt; }

  // Copy obj with keys in the given order; any extra keys follow in their own order
  function ordered(obj, keys) {
    if (!obj) return obj;
    var o = {};
    keys.forEach(function (k) { if (obj.hasOwnProperty(k)) o[k] = obj[k]; });
    Object.keys(obj).forEach(function (k) { if (!o.hasOwnProperty(k)) o[k] = obj[k]; });
    return o;
  }
  function benchKeys() { return Object.keys(D().profiles[0].bench_conditions); }

  function inputsOut(inp) {
    return {
      scenario_id: inp.scenario_id, scenario_name: inp.scenario_name,
      module_parameters: ordered(inp.module_parameters, Object.keys(D().module_defaults)),
      profile_id: inp.profile_id, profile_version: inp.profile_version, profile_status: inp.profile_status,
      bench_conditions: ordered(inp.bench_conditions, benchKeys()),
      seed: inp.seed, noise_rel_sigma: inp.noise_rel_sigma, speed: inp.speed
    };
  }
  function overallOut(o) {
    return { verdict: o.verdict, verdict_label: o.verdict_label, block_reason: o.block_reason, abort_reason: o.abort_reason,
             precedence_reason: o.precedence_reason, is_acceptance_decision: false };
  }
  function readingOut(r) {
    return {
      quantity_id: r.quantity_id, label: r.label, unit: r.unit, value: r.value, observation: r.observation, conditions: r.conditions,
      rule: { type: r.rule.type, min: r.rule.min, max: r.rule.max, expect: r.rule.expect },
      required: r.required, rule_basis: r.rule_basis, reference_id: r.reference_id, reference_text: r.reference_text,
      approval_status: r.approval_status, verdict: r.verdict, margin: r.margin, reason: r.reason,
      hypothesis: r.hypothesis, model_equation: r.model_equation
    };
  }
  function stageOut(s) {
    return {
      test_id: s.test_id, name: s.name, "class": s["class"], status: s.status, blocked_reason: s.blocked_reason,
      status_note: s.status_note, conditions: s.conditions,
      readings: s.readings.map(readingOut),
      physical_components: s.physical_components.map(function (c) { return { basis: c.basis, seconds: c.seconds, note: c.note }; }),
      physical_estimate_s: s.physical_estimate_s, model_equation: s.model_equation
    };
  }
  function safeOut(ss) {
    if (!ss) return null;
    return {
      trigger: ss.trigger, gate_off_commanded: ss.gate_off_commanded, gate_measured_v: ss.gate_measured_v,
      gate_off_confirmed: ss.gate_off_confirmed, hv_source_disabled: ss.hv_source_disabled, contactor_open: ss.contactor_open,
      v_bus_at_start_v: ss.v_bus_at_start_v, discharge_required: ss.discharge_required, discharge_time_s: ss.discharge_time_s,
      v_bus_at_verification_v: ss.v_bus_at_verification_v, verification: ss.verification, door: ss.door, final_state: ss.final_state
    };
  }
  function hypOut(h) { return { source: h.source, quantity_ids: h.quantity_ids.slice(), text: h.text }; }
  // Deterministic events omit animation_time_s (05 §6)
  function eventOut(e) { return { seq: e.seq, stage: e.stage, type: e.type, physical_time_s: e.physical_time_s, detail: e.detail }; }

  function deterministicOut(inputs, res) {
    return {
      inputs: inputsOut(inputs),
      overall: overallOut(res.overall),
      stages: res.stages.map(stageOut),
      safe_state: safeOut(res.safe_state),
      hypotheses: (res.hypotheses || []).map(hypOut),
      events: res.events.map(eventOut),
      physical_total_s: res.physical_total_s
    };
  }

  // Case references cited by this run's readings or conditions, in register order
  function usedReferences(det) {
    var ids = {};
    det.stages.forEach(function (s) {
      s.readings.forEach(function (r) { if (r.reference_id) ids[r.reference_id] = true; });
      var m = s.conditions && s.conditions.match(/REF-[0-9]+/g);
      (m || []).forEach(function (id) { ids[id] = true; });
    });
    return D().case_references.filter(function (r) { return ids[r.reference_id]; }).map(function (r) {
      return { reference_id: r.reference_id, source: r.source, statement: r.statement, applies_to: r.applies_to };
    });
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  // Local time with offset, e.g. 2026-10-17T19:05:00+05:00
  function localIso(d) {
    var off = -d.getTimezoneOffset(), sign = off >= 0 ? "+" : "-";
    off = Math.abs(off);
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" +
      pad(d.getSeconds()) + sign + pad(Math.floor(off / 60)) + ":" + pad(off % 60);
  }

  function wrap(det, meta) {
    meta = meta || {};
    return {
      schema_version: D().schema_version,
      simulation: true,
      simulation_banner: D().fixed_texts.banner,
      metadata: {
        run_id: meta.run_id || null,
        created_local: meta.created_local || localIso(new Date()),
        software_version: D().software_version,
        operator: meta.operator === undefined ? null : meta.operator
      },
      deterministic: det,
      presentation: {
        animation_total_s: E.r2(det.physical_total_s / det.inputs.speed),
        clock_caption: D().fixed_texts.clock_caption
      },
      case_references: usedReferences(det),
      limitations: D().fixed_texts.limitations
    };
  }

  // buildJson(run, meta): a finished sequencer run → report object (05 §6)
  function buildJson(run, meta) {
    var res = {
      overall: run.overall, stages: run.stages, safe_state: run.safe_state, hypotheses: run.hypotheses,
      events: run.events, physical_total_s: window.IGBT.sequencer.physicalTotal(run)
    };
    return wrap(deterministicOut(run.inputs, res), meta);
  }
  // buildConfigBlockedJson(pre, meta): configPreflight CONFIG_BLOCKED result → report object
  function buildConfigBlockedJson(pre, meta) {
    return wrap(deterministicOut(pre.inputs, E.configBlockedResult(pre.inputs)), meta);
  }

  function serialise(obj) { return JSON.stringify(obj, null, 2); }
  function fileName(report, ext) { return "report_" + (report.metadata.run_id || "run") + "." + (ext || "json"); }
  // Browser download via Blob + link (works from file://)
  function saveBlob(text, type, name) {
    if (typeof document === "undefined") return false;
    var blob = new Blob([text], { type: type });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    return true;
  }
  function download(report) { return saveBlob(serialise(report) + "\n", "application/json", fileName(report, "json")); }
  function downloadHtml(report) { return saveBlob(buildHtml(report), "text/html", fileName(report, "html")); }

  // ---- Shared display text: the Result screen and the HTML report use these, so they agree ----
  function dpOf(q) { var d = D().display_decimals[q]; return d === undefined ? 2 : d; }
  function numText(q, x) { return F().fixed(x, dpOf(q)); }
  function unitOf(r) { return r.unit === "bool" ? "" : r.unit; }
  // Display precision, or full precision when rounding would make the value read the same as a
  // limit it differs from (3.20004 V against max 3.20 V)
  function valueText(r) {
    if (r.value === null || r.value === undefined) return "—";
    if (typeof r.value !== "number") return String(r.value);
    var t = numText(r.quantity_id, r.value), x = r.rule;
    var hidden = [x.min, x.max].some(function (l) { return typeof l === "number" && l !== r.value && numText(r.quantity_id, l) === t; });
    return hidden ? F().num(r.value) : t;
  }
  function ruleText(r) {
    var u = unitOf(r) ? " " + unitOf(r) : "", q = r.quantity_id, x = r.rule;
    switch (x.type) {
      case "window": return "window " + (x.min === null ? "?" : numText(q, x.min)) + " to " + (x.max === null ? "?" : numText(q, x.max)) + u;
      case "max": return "max " + (x.max === null ? "not configured" : numText(q, x.max) + u);
      case "min": return "min " + (x.min === null ? "not configured" : numText(q, x.min) + u);
      case "time_max": return "max " + (x.max === null ? "not configured" : numText(q, x.max) + u) + " (event within window)";
      case "boolean": return "expect " + (x.expect === null ? "not configured" : String(x.expect));
      case "info": return "info (not judged)";
    }
    return x.type;
  }
  // Signed margin; a non-zero margin that rounds to zero is shown at full precision (−0.00004 V)
  function marginText(r) {
    if (r.margin === null || r.margin === undefined) return "—";
    var t = numText(r.quantity_id, Math.abs(r.margin));
    if (r.margin !== 0 && Number(t) === 0) t = F().num(Math.abs(r.margin));
    return (r.margin > 0 ? "+" : r.margin < 0 ? "−" : "") + t + (unitOf(r) ? " " + unitOf(r) : "");
  }
  // Provenance chips (05 §1): basis, case reference, NOT APPROVED; info rules say so
  function chipTexts(r) {
    if (r.rule.type === "info") return ["INFO · not judged"];
    var c = ["ILLUSTRATIVE · " + r.rule_basis];
    if (r.reference_id) c.push("Case ref " + r.reference_id);
    c.push("NOT APPROVED");
    return c;
  }
  function secText(x) { return F().fixed(x, 2) + " s"; }
  // Noise state of a run (02 §10). σ = 0: off. σ > 0: seeded noise, with a note that 03 §12 assumes σ = 0.
  function noiseText(inp) {
    var s = inp.noise_rel_sigma;
    if (!(s > 0)) return "off (σ = 0)";
    return "on: σ = " + F().num(s) + " multiplicative Gaussian (Q14 σ = " + F().num(2 * s) + "), truncated at ±3σ, seed " + inp.seed +
      ". Readings differ from the 03 §12 values, which assume σ = 0.";
  }
  function statusText(s) { return String(s).replace(/_/g, " "); }
  function animationOf(physical, speed) { return E.r2(physical / speed); }
  var text = { numText: numText, unitOf: unitOf, valueText: valueText, ruleText: ruleText, marginText: marginText,
               chipTexts: chipTexts, secText: secText, statusText: statusText, animationOf: animationOf,
               overridesText: overridesText, noiseText: noiseText };

  // ---- HTML report (05 §10): one self-contained page; inline CSS, no script, no external URL ----
  function esc(s) {
    return String(s === null || s === undefined ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function showVal(v) { return v === null ? "null" : typeof v === "string" ? "\"" + v + "\"" : String(v); }
  function tag(name, attrs, inner) {
    var a = "";
    Object.keys(attrs || {}).forEach(function (k) { if (attrs[k] !== null && attrs[k] !== undefined) a += " " + k + "=\"" + esc(attrs[k]) + "\""; });
    return "<" + name + a + ">" + (inner === undefined ? "" : inner) + "</" + name + ">";
  }
  function row(cells, attrs) { return tag("tr", attrs, cells.join("")); }
  function td(inner, attrs) { return tag("td", attrs, inner); }
  function th(inner, attrs) { return tag("th", attrs, inner); }
  function kvTable(pairs, cls) {
    return tag("table", { "class": "kv" + (cls ? " " + cls : "") }, tag("tbody", null, pairs.map(function (p) {
      return row([th(esc(p[0]), { scope: "row" }), td(p[2] ? p[1] : esc(p[1]), p[3] ? { "class": p[3] } : null)]);
    }).join("")));
  }
  function chipHtml(t) { return tag("span", { "class": "chip" + (t === "NOT APPROVED" ? " chip-na" : "") }, esc(t)); }
  var VERDICT_CLASS = { PASS: "v-pass", FAIL: "v-fail", ABORTED: "v-abort", INCOMPLETE: "v-abort", "NOT EVALUATED": "v-ne" };
  function verdictHtml(v) { return tag("span", { "class": "st " + (v === "PASS" ? "st-pass" : v === "FAIL" ? "st-fail" : "") }, esc(v)); }
  function section(n, title, inner) { return tag("section", { "class": "sec" }, tag("h2", null, n + ". " + esc(title)) + inner); }

  // Inputs that differ from the data-file defaults (module defaults, the profile's bench conditions),
  // plus scenario events and a forced profile. Display only.
  function overridesText(inp) {
    var parts = [], prof = D().profiles.filter(function (p) { return p.profile_id === inp.profile_id; })[0];
    Object.keys(inp.module_parameters).forEach(function (k) {
      if (inp.module_parameters[k] !== D().module_defaults[k]) parts.push("module." + k + " = " + showVal(inp.module_parameters[k]));
    });
    if (prof) Object.keys(inp.bench_conditions).forEach(function (k) {
      if (inp.bench_conditions[k] !== prof.bench_conditions[k]) parts.push("bench." + k + " = " + showVal(inp.bench_conditions[k]));
    });
    var sc = D().scenarios.filter(function (s) { return s.scenario_id === inp.scenario_id; })[0];
    if (sc) {
      (sc.events || []).forEach(function (e) { parts.push("event: " + e.trigger + " at " + Math.round(e.at_progress * 100) + "% of " + e.at_stage); });
      if (sc.force_profile) parts.push("force_profile = " + sc.force_profile);
    }
    return parts.length ? parts.join("; ") : "none (defaults)";
  }
  function paramList(obj, units) {
    return Object.keys(obj).map(function (k) {
      var u = units && units[k] && units[k] !== "–" && units[k] !== "bool" ? " " + units[k] : "";
      return tag("code", null, esc(k)) + " = " + esc(showVal(obj[k]) + u);
    }).join(tag("span", { "class": "sep" }, " · "));
  }

  // ---- Outcome helpers shared by the Result screen and the HTML report (display only; never change a verdict) ----
  // Counts: readings by verdict, stages by status. "Evaluated" readings are those judged PASS or FAIL.
  function countsOf(det) {
    var r = { PASS: 0, FAIL: 0, "NOT RUN": 0, INFO: 0, total: 0 }, s = { total: 0 };
    det.stages.forEach(function (st) {
      s.total++; s[st.status] = (s[st.status] || 0) + 1;
      st.readings.forEach(function (x) { r.total++; r[x.verdict] = (r[x.verdict] || 0) + 1; });
    });
    r.evaluated = r.PASS + r.FAIL;
    return { readings: r, stages: s };
  }
  function countsText(det) {
    var c = countsOf(det), r = c.readings, s = c.stages, rp = [], sp = [];
    rp.push(r.evaluated + " evaluated (" + r.PASS + " passed, " + r.FAIL + " failed)");
    if (r["NOT RUN"]) rp.push(r["NOT RUN"] + " not run");
    if (r.INFO) rp.push(r.INFO + " info only");
    sp.push((s.DONE || 0) + " of " + s.total + " done");
    ["BLOCKED", "INTERRUPTED", "NOT_RUN", "NOT_APPLICABLE", "NOT_MODELLED"].forEach(function (k) {
      if (s[k]) sp.push(s[k] + " " + statusText(k).toLowerCase());
    });
    return { readings: "Readings: " + rp.join(" · "), stages: "Stages: " + sp.join(" · ") };
  }
  // Why a run stopped, in plain words (from the overall abort reason and the ABORT_TRIGGER event)
  function abortText(det) {
    var reason = det.overall.abort_reason;
    if (!reason || reason === "SAFE_STATE_NOT_VERIFIED") return "";
    var trig = det.events.filter(function (e) { return e.type === "ABORT_TRIGGER"; })[0];
    var where = trig ? " during " + (trig.stage || "the run") + " at " + secText(trig.physical_time_s) : "";
    if (reason === "OPERATOR") return "Stopped by the operator" + where + ".";
    if (reason === "WATCHDOG") return "Controller heartbeat lost" + where + "; the bench stopped the run.";
    var il = D().interlocks.filter(function (x) { return x.id + "_OPEN" === reason; })[0];
    if (il) return "Interlock " + il.id + " opened (" + il.short + ")" + where + "; the bench stopped the run.";
    return "Stopped: " + reason + where + ".";
  }
  // Safe-state verification in words. With the meter unavailable, the retained voltage is a model estimate.
  function verificationText(ss) {
    if (!ss) return "not run";
    if (ss.verification === "VERIFIED") return "discharge verified · bus " + F().fixed(ss.v_bus_at_verification_v, 2) + " V at verification";
    if (ss.verification === "DISCHARGE_FAILED") return "discharge not verified · bus " + F().fixed(ss.v_bus_at_verification_v, 2) + " V at verification (did not reach the safe level)";
    if (ss.verification === "VERIFICATION_UNAVAILABLE") return "discharge not verified · verification meter unavailable; not measured";
    return ss.verification;
  }
  function vBusVerifyText(ss) {
    if (ss.verification === "VERIFICATION_UNAVAILABLE")
      return "not measured (verification unavailable) · model estimate " + F().fixed(ss.v_bus_at_verification_v, 2) + " V";
    return F().fixed(ss.v_bus_at_verification_v, 2) + " V";
  }
  // Key findings, most urgent first: unresolved safe state, failed checks, interruption, configuration block,
  // checks that did not run. Each has a kind (safety, fail, stop, block, note) and plain text.
  function keyFindings(det) {
    var f = [], o = det.overall, ss = det.safe_state;
    if (ss && ss.final_state === "FAULT_LOCKED") f.push({ kind: "safety", text: "Safe state not verified: " +
      (ss.verification === "VERIFICATION_UNAVAILABLE" ? "the verification meter was unavailable, so the discharge could not be confirmed"
        : "the bus did not discharge to the safe level within the timeout") + ". Enclosure kept locked; access locked out." });
    det.stages.forEach(function (st) {
      st.readings.forEach(function (r) {
        if (r.verdict !== "FAIL") return;
        var u = unitOf(r) && r.value !== null ? " " + unitOf(r) : "";
        f.push({ kind: "fail", text: st.test_id + " · " + r.label + ": " + valueText(r) + u + " against " + ruleText(r) + " (margin " + marginText(r) + ")." });
      });
    });
    var stop = abortText(det);
    if (stop) f.push({ kind: "stop", text: "Run interrupted. " + stop + " No module verdict." });
    if (o.block_reason) f.push({ kind: "block", text: D().fixed_texts.config_blocked });
    var blocked = det.stages.filter(function (st) { return st.status === "BLOCKED"; });
    if (blocked.length) f.push({ kind: "note", text: "Not run because a prerequisite did not pass: " +
      blocked.map(function (st) { return st.test_id + (st.blocked_reason ? " (" + st.blocked_reason + ")" : ""); }).join(", ") + "." });
    return f;
  }
  text.countsOf = countsOf; text.countsText = countsText; text.abortText = abortText;
  text.verificationText = verificationText; text.vBusVerifyText = vBusVerifyText; text.keyFindings = keyFindings;

  // Report styling: light, print-first, restrained. Banner and footer repeat on every printed page
  // (fixed elements plus the spacer rows of the page table).
  var CSS = [
    "*{box-sizing:border-box}",
    "html{-webkit-print-color-adjust:exact;print-color-adjust:exact}",
    "body{margin:0;font:400 12.5px/1.5 -apple-system,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif;color:#1d1d1f;background:#fff}",
    "h1,h2,h3{color:#1d1d1f;font-weight:600;line-height:1.25;margin:0}",
    "h1{font-size:22px;letter-spacing:-.01em}",
    "h2{font-size:14px;margin:0 0 10px;padding-bottom:6px;border-bottom:1px solid #d2d2d7}",
    ".pbanner{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:center;gap:8px;background:#f2f2f4;color:#3a3a3c;font-weight:600;font-size:11.5px;text-align:center;padding:5px 12px;border-bottom:1px solid #d2d2d7}",
    ".pbanner:before{content:\"\";flex:none;width:6px;height:6px;border-radius:50%;background:#6e6e73}",
    ".pfooter{display:flex;flex-wrap:wrap;justify-content:space-between;gap:2px 16px;border-top:1px solid #d2d2d7;background:#fff;color:#6e6e73;font-size:10.5px;padding:5px 12px}",
    ".page{width:100%;border-collapse:collapse}.page>thead>tr>td,.page>tfoot>tr>td,.page>tbody>tr>td{padding:0;border:none}",
    ".hspace,.fspace{display:none}",
    ".wrap{max-width:980px;margin:0 auto;padding:22px 24px 32px}",
    ".rhead{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px 32px;padding-bottom:14px;border-bottom:2px solid #1d1d1f}",
    ".kicker{margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#6e6e73}",
    ".ident{display:grid;grid-template-columns:auto auto;gap:2px 14px;margin:0;font-size:12px}.ident dt{color:#6e6e73}.ident dd{margin:0;font-weight:600}",
    ".sec{margin-top:22px}",
    ".tech{margin-top:30px;padding-top:4px;border-top:2px solid #1d1d1f}.tech>h2.part{border:none;font-size:16px;margin:10px 0 0}",
    ".muted{color:#6e6e73}.small{font-size:11.5px}",
    ".summary{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:12px 28px;padding:14px 16px;border:1px solid #d2d2d7;border-left:4px solid #8e8e93;border-radius:6px}",
    ".summary.k-pass{border-left-color:#3f8500}.summary.k-fail,.summary.k-safety{border-left-color:#d91c1c}.summary.k-stop,.summary.k-block{border-left-color:#df6500}",
    ".summary p{margin:0}.summary .side{border-left:1px solid #e5e5e7;padding-left:16px}",
    ".verdict{display:inline-block;font-size:13px;font-weight:700;padding:3px 10px;border:1.5px solid #8e8e93;border-radius:999px;color:#1d1d1f}",
    ".v-pass{border-color:#3f8500;color:#2f6a00}.v-fail{border-color:#d91c1c;color:#8a0f0f}.v-abort{border-color:#df6500;color:#1d1d1f}.v-ne{border-color:#8e8e93}",
    ".label{font-weight:600;margin:8px 0 2px!important}",
    ".enc{font-size:15px;font-weight:600}.enc.locked{color:#8a0f0f}.enc.safe{color:#2f6a00}",
    ".lock{margin:10px 0 0;padding:6px 10px;background:#d91c1c;color:#fff;font-weight:700;border-radius:4px}",
    ".findings{list-style:none;margin:0;padding:0}",
    ".findings li{position:relative;margin:0 0 6px;padding:6px 10px 6px 14px;border-left:3px solid #8e8e93;background:#f7f7f8;break-inside:avoid}",
    ".findings .f-safety,.findings .f-fail{border-left-color:#d91c1c}.findings .f-stop,.findings .f-block{border-left-color:#df6500}",
    ".findings .tag{display:inline-block;min-width:68px;margin-right:6px;font-size:10px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;color:#6e6e73}",
    "table{border-collapse:collapse;width:100%}",
    "th,td{text-align:left;vertical-align:top;padding:5px 7px;border-bottom:1px solid #e5e5e7}",
    "thead th{font-size:10.5px;font-weight:600;color:#6e6e73;border-bottom:1px solid #8e8e93;white-space:nowrap}",
    "thead{display:table-header-group}tr{break-inside:avoid}",
    "td{font-variant-numeric:tabular-nums}.num{text-align:right;white-space:nowrap}.nw{white-space:nowrap}",
    ".kv th{width:200px;font-weight:400;color:#6e6e73}.kv td{font-weight:600}.kv td.plain{font-weight:400}",
    ".kv td.red{color:#8a0f0f}",
    "code{font:600 11.5px/1.4 ui-monospace,Consolas,monospace;color:#1d1d1f}.sep{color:#aeaeb2}",
    ".stage td{padding-top:12px;border-bottom:1px solid #8e8e93;font-weight:600}",
    ".stage .sn{font-weight:400;color:#6e6e73}",
    ".nr td{color:#8e8e93}",
    "table.results{table-layout:fixed}.results td{overflow-wrap:anywhere}.results thead th{white-space:normal}",
    ".c-check{width:25%}.c-val{width:8%}.c-unit{width:7%}.c-ref{width:19%}.c-mar{width:11%}.c-st{width:9%}.c-basis{width:21%}",
    ".chips .chip{white-space:normal}",
    ".chip{display:inline-block;margin:0 3px 2px 0;font-size:9.5px;font-weight:600;letter-spacing:.02em;padding:1px 5px;border:1px solid #c7c7cc;border-radius:3px;color:#3a3a3c;white-space:nowrap}",
    ".chip-na{border-color:#b85c5c;color:#8a0f0f}",
    ".st{display:inline-block;font-size:10px;font-weight:700;letter-spacing:.02em;text-transform:uppercase;padding:1px 6px;border:1px solid #c7c7cc;border-radius:3px;color:#3a3a3c;white-space:nowrap}",
    ".st-pass{border-color:#3f8500;color:#2f6a00}.st-fail{border-color:#d91c1c;color:#8a0f0f}",
    ".box{padding:8px 12px;background:#f7f7f8;border-radius:4px}.box ul{margin:0;padding-left:18px}",
    ".log td{font-size:11px}.ty{font-weight:600;white-space:nowrap}",
    ".ev-warn td.ty{color:#9a4a00}.ev-red td.ty{color:#8a0f0f}",
    ".clocks{display:flex;flex-wrap:wrap;gap:6px 32px;margin:0 0 6px}.clocks b{display:block;font-size:17px}",
    ".caption{font-size:11px;color:#6e6e73;margin:0 0 8px}",
    ".evid td{font-size:11px}.evid td:first-child{white-space:nowrap;font-weight:600}",
    ".legend{margin:0 0 10px;padding:0;list-style:none}.legend li{margin:0 0 3px}",
    "@page{size:A4 portrait;margin:10mm 11mm}",
    "@media print{",
    "  .pbanner{position:fixed;top:0;left:0;right:0}.pfooter{position:fixed;bottom:0;left:0;right:0}",
    "  .hspace{display:block;height:30px}.fspace{display:block;height:44px}",
    "  .wrap{max-width:none;padding:4px 0 0}.sec{margin-top:16px}h2{break-after:avoid}.tech{break-before:page;margin-top:0;border-top:none}",
    "  .summary{break-inside:avoid}",
    "}"
  ].join("\n");

  function buildHtml(report) {
    var det = report.deterministic, inp = det.inputs, o = det.overall, md = report.metadata, ss = det.safe_state;
    var prof = D().profiles.filter(function (p) { return p.profile_id === inp.profile_id; })[0];
    var locked = !!ss && ss.final_state === "FAULT_LOCKED";
    var findings = keyFindings(det), counts = countsText(det);
    var out = [];

    // Header: report identity, module, operator, date, software
    out.push(tag("header", { "class": "rhead" },
      tag("div", null, tag("p", { "class": "kicker" }, "IGBT test cell · module test report") +
        tag("h1", null, "Run report " + esc(md.run_id)) +
        tag("p", { "class": "muted small" }, "Scenario " + esc(inp.scenario_id + " · " + inp.scenario_name))) +
      tag("dl", { "class": "ident" },
        tag("dt", null, "Module") + tag("dd", null, esc(inp.module_parameters.module_id)) +
        tag("dt", null, "Operator") + tag("dd", null, esc(md.operator === null || md.operator === "" ? "—" : md.operator)) +
        tag("dt", null, "Date") + tag("dd", null, esc(md.created_local)) +
        tag("dt", null, "Software") + tag("dd", null, "v" + esc(md.software_version) + " · schema " + esc(report.schema_version)))));

    // Outcome summary: verdict, qualification, reason, block / abort reason, enclosure
    var kind = locked ? "k-safety" : o.verdict === "FAIL" ? "k-fail" : o.verdict === "PASS" ? "k-pass" : o.block_reason ? "k-block" : "k-stop";
    var reasons = [];
    if (o.block_reason) reasons.push("block_reason: " + o.block_reason);
    if (o.abort_reason) reasons.push("abort_reason: " + o.abort_reason);
    reasons.push("is_acceptance_decision: " + o.is_acceptance_decision);
    var encl = !ss ? tag("p", { "class": "enc" }, "Not energised") + tag("p", { "class": "muted small" }, "Safe-state procedure not run.")
      : tag("p", { "class": "enc " + (ss.door === "LOCKED" ? "locked" : ss.final_state === "SAFE" ? "safe" : "") }, "Door " + esc(ss.door)) +
        tag("p", { "class": "muted small" }, "Final state " + esc(statusText(ss.final_state)) + " · " + esc(verificationText(ss)));
    out.push(tag("section", { "class": "sec" }, tag("h2", null, "Outcome") +
      tag("div", { "class": "summary " + kind },
        tag("div", null,
          tag("p", null, tag("span", { "class": "verdict " + (VERDICT_CLASS[o.verdict] || "v-ne"), "data-verdict": o.verdict }, esc(o.verdict))) +
          tag("p", { "class": "label" }, esc(o.verdict_label)) +
          tag("p", null, "Why: " + esc(o.precedence_reason)) +
          tag("p", { "class": "muted small" }, esc(reasons.join(" · ")))) +
        tag("div", { "class": "side" }, tag("p", { "class": "muted small" }, "Enclosure") + encl)) +
      (locked ? tag("p", { "class": "lock" }, esc(D().fixed_texts.fault_locked_banner)) : "")));

    // Key findings, most urgent first
    var KIND_TAG = { safety: "Safe state", fail: "Failed", stop: "Stopped", block: "Blocked", note: "Not run" };
    var fl = findings.length ? tag("ul", { "class": "findings" }, findings.map(function (x) {
      return tag("li", { "class": "f-" + x.kind }, tag("span", { "class": "tag" }, KIND_TAG[x.kind]) + esc(x.text));
    }).join("")) : tag("p", null, ss && ss.verification === "VERIFIED" ? "No failed checks. Safe state verified; enclosure unlocked." : "No failed checks.");
    out.push(tag("section", { "class": "sec" }, tag("h2", null, "Key findings") + fl +
      tag("p", { "class": "muted small" }, esc(counts.readings) + "<br>" + esc(counts.stages))));

    // Test results grouped by stage. Row attributes data-stage / data-status / data-q / data-verdict are relied on by selfcheck.
    var rows = [];
    det.stages.forEach(function (st) {
      var note = st.blocked_reason ? " — " + st.blocked_reason : st.status_note ? " — " + st.status_note : "";
      rows.push(row([td(esc(st.test_id) + " " + tag("span", { "class": "sn" }, esc(st.name + " · " + st["class"])) + " · " +
        tag("span", { "class": "st" }, esc(statusText(st.status))) + tag("span", { "class": "sn" }, esc(note)), { colspan: "7" })],
        { "class": "stage", "data-stage": st.test_id, "data-status": st.status }));
      if (!st.readings.length) rows.push(row([td(tag("span", { "class": "muted" }, "No module readings in this stage."), { colspan: "7" })]));
      st.readings.forEach(function (r) {
        rows.push(row([
          td(tag("b", null, esc(r.quantity_id)) + " " + esc(r.label) + (r.observation !== "OBSERVED" ? " " + tag("span", { "class": "muted" }, "(" + esc(r.observation) + ")") : "")),
          td(esc(valueText(r)), { "class": "v num" }),
          td(esc(unitOf(r) || "—"), { "class": "nw" }),
          td(esc(ruleText(r))),
          td(esc(marginText(r)), { "class": "num" }),
          td(verdictHtml(r.verdict)),
          td(chipTexts(r).map(chipHtml).join(""), { "class": "chips" })
        ], { "class": "rd" + (r.verdict === "NOT RUN" ? " nr" : ""), "data-q": r.quantity_id, "data-verdict": r.verdict }));
      });
    });
    out.push(tag("section", { "class": "sec" }, tag("h2", null, "Test results") +
      tag("table", { "class": "results" },
        tag("colgroup", null, ["c-check", "c-val", "c-unit", "c-ref", "c-mar", "c-st", "c-basis"].map(function (c) { return "<col class=\"" + c + "\">"; }).join("")) +
        tag("thead", null, row(["Check", "Value", "Unit", "Configured reference / range", "Margin", "Status", "Rule basis"].map(function (h) { return th(h, { scope: "col" }); }))) +
        tag("tbody", null, rows.join(""))) +
      tag("p", { "class": "caption" }, "References and ranges are the demo profile's illustrative rules, not approved acceptance limits. Conditions, reasons and model equations: Reading evidence.")));

    // Hypotheses, kept apart from verdicts
    var hyp = det.hypotheses.length ? det.hypotheses.map(function (h) {
      return tag("li", null, esc((h.source === "SAFE_STATE" ? "Safe state" : h.source + " (" + h.quantity_ids.join(", ") + ")") + ": " + h.text));
    }).join("") : tag("li", { "class": "muted" }, "No FAIL recorded; no hypothesis.");
    out.push(tag("section", { "class": "sec" }, tag("h2", null, "Hypotheses (not diagnoses)") + tag("div", { "class": "box" }, tag("ul", null, hyp))));

    // Safe-state record; locked states in red text
    var safe;
    if (!ss) safe = tag("p", { "class": "muted" }, "Safe-state procedure not run" + (o.block_reason ? " (configuration blocked: nothing was energised)." : "."));
    else safe = kvTable([
      ["Trigger", ss.trigger + (o.abort_reason && ss.trigger === "ABORT" ? " (" + o.abort_reason + ")" : "")],
      ["Gate", "commanded " + (ss.gate_off_commanded ? "OFF" : "—") + " · measured " + F().fixed(ss.gate_measured_v, 1) + " V · " + (ss.gate_off_confirmed ? "OFF confirmed" : "OFF NOT confirmed")],
      ["HV source", ss.hv_source_disabled ? "disabled" : "enabled"],
      ["Contactor", ss.contactor_open ? "open" : "closed"],
      ["v_bus at start", F().fixed(ss.v_bus_at_start_v, 1) + " V"],
      ["Discharge", ss.discharge_required ? (ss.discharge_time_s === null ? "required; did not reach v_safe" : "required; " + secText(ss.discharge_time_s)) : "not required (DISCHARGE_NOT_REQUIRED)"],
      ["v_bus at verification", vBusVerifyText(ss)],
      ["Verification", ss.verification, false, locked ? "red" : null],
      ["Door", ss.door, false, locked ? "red" : null],
      ["Final state", ss.final_state, false, locked ? "red" : null]
    ]);
    out.push(tag("section", { "class": "sec" }, tag("h2", null, "Safe-state record") + safe));

    // Key event timeline (selected event types; the full log with both clocks is in the technical sections)
    var KEY = ["RUN_START", "CONFIG_BLOCKED", "PREREQUISITE_BLOCK", "BUS_CHARGE_START", "BUS_AT_SETPOINT", "ABORT_TRIGGER", "SAFE_STATE_START",
      "DISCHARGE_START", "DISCHARGE_VERIFIED", "DISCHARGE_FAILED", "VERIFICATION_UNAVAILABLE", "DOOR_UNLOCKED", "FAULT_LOCKED", "RUN_END"];
    var keyEv = det.events.filter(function (e) { return KEY.indexOf(e.type) >= 0; }).map(function (e) {
      var red = e.type === "ABORT_TRIGGER" || e.type === "FAULT_LOCKED" || e.type === "DISCHARGE_FAILED" || e.type === "VERIFICATION_UNAVAILABLE";
      return row([td(F().fixed(e.physical_time_s, 2) + " s", { "class": "num" }), td(esc(e.stage || "—")), td(esc(e.type), { "class": "ty" }), td(esc(e.detail))],
        { "class": red ? "ev-red" : null });
    }).join("");
    out.push(tag("section", { "class": "sec" }, tag("h2", null, "Key events") + tag("table", { "class": "log" },
      tag("thead", null, row(["Physical time", "Stage", "Event", "Detail"].map(function (h) { return th(h, { scope: "col" }); }))) +
      tag("tbody", null, keyEv))));

    // Estimated timing with caption and per-stage physical components
    var comps = det.stages.map(function (st) {
      var c = st.physical_components.map(function (x) { return x.basis + " " + F().num(x.seconds) + " s" + (x.note ? " (" + x.note + ")" : ""); }).join(" + ");
      return row([td(esc(st.test_id + " · " + st.name)), td(esc(statusText(st.status))), td(esc(c || "—")), td(F().fixed(st.physical_estimate_s, 2), { "class": "num" })]);
    }).join("");
    out.push(tag("section", { "class": "sec" }, tag("h2", null, "Estimated timing") +
      tag("div", { "class": "clocks" }, tag("span", null, "Estimated physical total" + tag("b", null, secText(det.physical_total_s))) +
        tag("span", null, "Animation total" + tag("b", null, secText(report.presentation.animation_total_s) + " at " + inp.speed + "×"))) +
      tag("p", { "class": "caption" }, esc(report.presentation.clock_caption)) +
      tag("table", null, tag("thead", null, row(["Stage", "Status", "Physical components", "Estimate s"].map(function (h) { return th(h, { scope: "col" }); }))) +
        tag("tbody", null, comps))));

    // ---- Technical details: configuration, complete evidence, full event log, references, provenance and limitations ----
    var tech = [];
    tech.push(tag("section", { "class": "sec" }, tag("h2", null, "Configuration") + kvTable([
      ["Module ID", inp.module_parameters.module_id],
      ["Scenario", inp.scenario_id + " · " + inp.scenario_name],
      ["Overrides", overridesText(inp)],
      ["Profile", inp.profile_id + " · version " + inp.profile_version + " · status " + inp.profile_status],
      ["Profile badge", prof ? prof.profile_badge : "—"],
      ["Module parameters", paramList(inp.module_parameters, D().module_parameter_units), true, "plain"],
      ["Bench conditions", paramList(inp.bench_conditions, D().bench_parameter_units), true, "plain"],
      ["Seed", String(inp.seed)],
      ["Noise σ (noise_rel_sigma)", String(inp.noise_rel_sigma) + (inp.noise_rel_sigma > 0 ? " — seeded noise " + noiseText(inp) : "")],
      ["Speed", inp.speed + "×"]
    ])));
    var evid = [];
    det.stages.forEach(function (st) {
      st.readings.forEach(function (r) {
        evid.push(row([td(esc(st.test_id + " · " + r.quantity_id)),
          td(tag("b", null, "Conditions: ") + esc(r.conditions || "—") + "<br>" + tag("b", null, "Reason: ") + esc(r.reason) +
            (r.model_equation ? "<br>" + tag("b", null, "Model: ") + esc(r.model_equation) : "") +
            (r.hypothesis ? "<br>" + tag("b", null, "Hypothesis: ") + esc(r.hypothesis) : ""))]));
      });
      if (st.model_equation) evid.push(row([td(esc(st.test_id)), td(tag("b", null, "Model: ") + esc(st.model_equation))]));
    });
    tech.push(tag("section", { "class": "sec" }, tag("h2", null, "Reading evidence") + tag("table", { "class": "evid" },
      tag("thead", null, row([th("Reading", { scope: "col" }), th("Conditions, reason and model", { scope: "col" })])) + tag("tbody", null, evid.join("")))));
    var ev = det.events.map(function (e) {
      var cls = e.type === "WARNING" ? "ev-warn" : (e.type === "ABORT_TRIGGER" || e.type === "FAULT_LOCKED" || e.type === "DISCHARGE_FAILED" || e.type === "VERIFICATION_UNAVAILABLE") ? "ev-red" : null;
      return row([td(String(e.seq), { "class": "num" }), td(F().fixed(e.physical_time_s, 2), { "class": "num" }),
        td(F().fixed(animationOf(e.physical_time_s, inp.speed), 2), { "class": "num" }), td(esc(e.stage || "—")),
        td(esc(e.type), { "class": "ty" }), td(esc(e.detail))], { "class": cls, "data-seq": e.seq });
    }).join("");
    tech.push(tag("section", { "class": "sec" }, tag("h2", null, "Event log") + tag("table", { "class": "log" },
      tag("thead", null, row(["#", "Physical s", "Animation s", "Stage", "Event", "Detail"].map(function (h) { return th(h, { scope: "col" }); }))) +
      tag("tbody", null, ev))));
    var refs = report.case_references.length ? tag("table", null,
      tag("thead", null, row(["Reference", "Source", "Statement (paraphrase)", "Applies to (per case)"].map(function (h) { return th(h, { scope: "col" }); }))) +
      tag("tbody", null, report.case_references.map(function (r) {
        return row([td(tag("b", null, esc(r.reference_id))), td(esc(r.source)), td(esc(r.statement)), td(esc(r.applies_to))]);
      }).join(""))) : tag("p", { "class": "muted" }, "No case reference cited in this run.");
    tech.push(tag("section", { "class": "sec" }, tag("h2", null, "Case references used in this run") + tag("p", { "class": "caption" },
      "A case reference records what the hackathon slides state; it is not an acceptance criterion.") + refs));
    tech.push(tag("section", { "class": "sec" }, tag("h2", null, "Rule provenance and limitations") +
      tag("ul", { "class": "legend" }, D().fixed_texts.chip_legend.map(function (c) { return tag("li", null, chipHtml(c.chip) + " = " + esc(c.meaning)); }).join("")) +
      tag("p", null, esc(report.limitations))));
    out.push(tag("div", { "class": "tech" }, tag("h2", { "class": "part" }, "Technical details") + tech.join("\n")));

    // Banner and footer on every printed page
    var banner = tag("div", { "class": "pbanner", role: "note" }, esc(report.simulation_banner));
    var footer = tag("div", { "class": "pfooter" }, tag("span", null, esc(D().fixed_texts.report_footer)) +
      tag("span", null, esc(report.simulation_banner)) + tag("span", null, esc(md.run_id + " · v" + md.software_version)));
    var page = tag("table", { "class": "page", role: "presentation" },
      tag("thead", null, row([td(tag("div", { "class": "hspace" }))])) +
      tag("tbody", null, row([td(tag("div", { "class": "wrap" }, out.join("\n")))])) +
      tag("tfoot", null, row([td(tag("div", { "class": "fspace" }))])));

    return "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n" +
      "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n" +
      "<title>" + esc("Report " + md.run_id + " — SIMULATION") + "</title>\n<style>\n" + CSS + "\n</style>\n</head>\n<body>\n" +
      banner + "\n" + page + "\n" + footer + "\n</body>\n</html>\n";
  }

  return { buildJson: buildJson, buildConfigBlockedJson: buildConfigBlockedJson, serialise: serialise,
           fileName: fileName, download: download, downloadHtml: downloadHtml, buildHtml: buildHtml,
           text: text, localIso: localIso };
})();
