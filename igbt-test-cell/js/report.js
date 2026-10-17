/* report.js: report JSON builder in the 05 §6 shape, with a fixed key order, and the
   CONFIG_BLOCKED variant (05 §6 notes). Download via Blob (02 §3). The HTML report is TICKET 03. */
window.IGBT = window.IGBT || {};
window.IGBT.report = (function () {
  var E = window.IGBT.engine;
  function D() { return window.APP_DATA; }

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
  function fileName(report) { return "report_" + (report.metadata.run_id || "run") + ".json"; }
  // Browser download via Blob + link (works from file://)
  function download(report) {
    if (typeof document === "undefined") return false;
    var blob = new Blob([serialise(report) + "\n"], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = fileName(report);
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    return true;
  }

  return { buildJson: buildJson, buildConfigBlockedJson: buildConfigBlockedJson, serialise: serialise,
           fileName: fileName, download: download, localIso: localIso };
})();
