/* ui.js: rendering and controls. TICKET 01: banner, profile badge, Limitations,
   Setup (Screen 1), Validation error (1a), Configuration blocked (1b). */
window.IGBT = window.IGBT || {};
window.IGBT.ui = (function () {
  var D, V;
  var runCounter = 0;
  var state = { runId: null, lastResult: null, userProfile: "demo" };

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "class") n.className = attrs[k];
      else if (k.indexOf("on") === 0) n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  function $(id) { return document.getElementById(id); }
  function pad(n, w) { n = String(n); while (n.length < w) n = "0" + n; return n; }
  function show(v) { return v === null ? "null" : v === undefined ? "(missing)" : typeof v === "string" ? "\"" + v + "\"" : String(v); }

  // RUN-YYYYMMDD-NNNN, unique within the browser session (05 §11)
  function nextRunId() {
    try {
      var stored = parseInt(window.sessionStorage.getItem("igbt_run_counter") || "0", 10);
      if (stored > runCounter) runCounter = stored;
    } catch (e) { /* storage unavailable: in-memory counter only */ }
    runCounter += 1;
    try { window.sessionStorage.setItem("igbt_run_counter", String(runCounter)); } catch (e) { }
    var d = new Date();
    return "RUN-" + d.getFullYear() + pad(d.getMonth() + 1, 2) + pad(d.getDate(), 2) + "-" + pad(runCounter, 4);
  }

  // ---- shared chrome: banner, badge, limitations ----
  function renderChrome() {
    $("sim-banner").textContent = D.fixed_texts.banner;
    $("limitations-text").textContent = D.fixed_texts.limitations;
    var legend = $("chip-legend");
    legend.innerHTML = "";
    D.fixed_texts.chip_legend.forEach(function (c) {
      legend.appendChild(el("li", null, [el("span", { class: "chip", text: c.chip }), " = " + c.meaning]));
    });
    $("open-limitations").addEventListener("click", function () { $("limitations").hidden = false; });
    $("close-limitations").addEventListener("click", function () { $("limitations").hidden = true; });
  }
  function setBadge(profileId) {
    var p = V.findProfile(profileId);
    var b = $("profile-badge");
    b.textContent = p ? p.profile_badge : "";
    b.className = "badge " + (p && p.profile_status === "demo" ? "badge-demo" : "badge-prod");
  }
  function showScreen(id) {
    ["screen-setup", "screen-invalid", "screen-blocked", "screen-ok"].forEach(function (s) { $(s).hidden = s !== id; });
    window.scrollTo(0, 0);
  }

  // ---- Screen 1: Setup ----
  function effectiveProfileId() {
    var sc = V.findScenario($("in-scenario").value);
    return sc && sc.force_profile ? sc.force_profile : $("in-profile").value;
  }
  function refreshSetup() {
    var sc = V.findScenario($("in-scenario").value);
    var forced = sc && sc.force_profile;
    // A forcing scenario (S5) sets the profile; leaving it restores the user's own choice
    $("in-profile").value = forced || state.userProfile;
    $("in-profile").disabled = !!forced;
    $("profile-forced").hidden = !forced;
    setBadge(effectiveProfileId());
    $("custom-panel").hidden = !(sc && sc.custom);
    var ov = $("scenario-overrides");
    ov.textContent = "";
    if (sc && !sc.custom) {
      var parts = [];
      ["module", "bench"].forEach(function (g) {
        Object.keys(sc.overrides[g] || {}).forEach(function (k) { parts.push(g + "." + k + " = " + show(sc.overrides[g][k])); });
      });
      (sc.events || []).forEach(function (e) { parts.push("event: " + e.trigger + " at " + Math.round(e.at_progress * 100) + "% of " + e.at_stage); });
      if (sc.force_profile) parts.push("force_profile = " + sc.force_profile);
      ov.textContent = parts.length ? "Scenario inputs: " + parts.join("; ") : "Scenario inputs: defaults (no overrides)";
    }
  }

  function buildSetup() {
    var scSel = $("in-scenario");
    D.scenarios.forEach(function (s) {
      var built = D.built_priorities.indexOf(s.priority) >= 0;
      var o = el("option", { value: s.scenario_id, text: s.scenario_id + " · " + s.name + " (" + s.priority + ")" + (built ? "" : " — not built yet") });
      if (!built) o.disabled = true;
      scSel.appendChild(o);
    });
    var pSel = $("in-profile");
    D.profiles.forEach(function (p) { pSel.appendChild(el("option", { value: p.profile_id, text: p.profile_id })); });
    var spSel = $("in-speed");
    D.speeds.forEach(function (s) { spSel.appendChild(el("option", { value: String(s), text: s + "×" })); });

    $("in-module-id").value = D.module_defaults.module_id;
    pSel.value = state.userProfile;
    scSel.value = "S0";
    $("in-seed").value = String(D.seed_default);
    spSel.value = String(V.findProfile("demo").bench_conditions.speed_default);

    buildCustomTable();
    scSel.addEventListener("change", refreshSetup);
    pSel.addEventListener("change", function () { state.userProfile = pSel.value; refreshSetup(); });
    $("btn-continue").addEventListener("click", onContinue);
    $("btn-reset-custom").addEventListener("click", function () { buildCustomTable(); });
    Array.prototype.forEach.call(document.querySelectorAll(".btn-back"), function (b) {
      b.addEventListener("click", function () { newRunId(); refreshSetup(); showScreen("screen-setup"); });
    });
    newRunId();
    refreshSetup();
  }
  function newRunId() { state.runId = nextRunId(); $("run-id").textContent = state.runId; }

  // Custom: editable module-parameter table with units (module_id is set above, module_note is fixed)
  function buildCustomTable() {
    var body = $("custom-body");
    body.innerHTML = "";
    var defs = D.module_defaults, units = D.module_parameter_units;
    Object.keys(defs).forEach(function (k) {
      if (k === "module_id") return;
      var input;
      if (k === "module_note") {
        input = el("span", { class: "fixed", text: defs[k] });
      } else if (typeof defs[k] === "boolean") {
        input = el("select", { "data-param": k, "data-kind": "bool" }, [el("option", { value: "true", text: "true" }), el("option", { value: "false", text: "false" })]);
        input.value = String(defs[k]);
      } else {
        input = el("input", { type: "text", "data-param": k, "data-kind": "num", value: String(defs[k]), inputmode: "decimal", size: "10" });
      }
      var hint = k === "desat_trip_us" ? "leave empty = never trips (null)" : "";
      body.appendChild(el("tr", null, [
        el("td", null, [el("code", { text: k })]),
        el("td", null, [input]),
        el("td", { text: units[k] }),
        el("td", { class: "muted", text: "default " + show(defs[k]) + (hint ? "; " + hint : "") })
      ]));
    });
  }
  // Read the table; return only parameters that differ from the defaults.
  // Unparseable text is passed through as text so validation reports it.
  function readCustomOverrides() {
    var mod = {};
    Array.prototype.forEach.call(document.querySelectorAll("#custom-body [data-param]"), function (inp) {
      var k = inp.getAttribute("data-param"), raw = inp.value, v;
      if (inp.getAttribute("data-kind") === "bool") v = raw === "true";
      else {
        var t = raw.trim().replace("−", "-");
        if (t === "") v = null;
        else if (/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(t)) v = parseFloat(t);
        else v = raw;
      }
      if (v !== D.module_defaults[k]) mod[k] = v;
    });
    return { module: mod, bench: {} };
  }

  function readSetup() {
    var seedTxt = $("in-seed").value.trim();
    var seed = /^[-+]?\d+$/.test(seedTxt) ? parseInt(seedTxt, 10) : (seedTxt === "" ? null : Number(seedTxt));
    var sc = V.findScenario($("in-scenario").value);
    var setup = {
      run_id: state.runId,
      module_id: $("in-module-id").value,
      profile_id: $("in-profile").value,
      scenario_id: $("in-scenario").value,
      seed: (typeof seed === "number" && isNaN(seed)) ? seedTxt : seed,
      speed: parseInt($("in-speed").value, 10),
      operator: $("in-operator").value
    };
    if (sc && sc.custom) setup.custom_overrides = readCustomOverrides();
    return setup;
  }

  function onContinue() {
    var setup = readSetup();
    var res = V.configPreflight(setup);
    state.lastResult = { setup: setup, result: res };
    if (res.status === "INVALID") renderInvalid(setup, res.errors);
    else if (res.status === "CONFIG_BLOCKED") renderBlocked(setup, res);
    else renderOk(setup, res);
  }

  // ---- Screen 1a: validation error ----
  function renderInvalid(setup, errors) {
    $("invalid-run").textContent = setup.run_id + " · scenario " + setup.scenario_id;
    var body = $("invalid-body");
    body.innerHTML = "";
    errors.forEach(function (e) {
      body.appendChild(el("tr", null, [el("td", null, [el("code", { text: e.field })]), el("td", null, [el("code", { text: show(e.value) })]), el("td", { text: e.rule })]));
    });
    $("invalid-count").textContent = errors.length + (errors.length === 1 ? " invalid input" : " invalid inputs") + ". No run and no verdict.";
    showScreen("screen-invalid");
  }

  // ---- Screen 1b: configuration blocked ----
  function renderBlocked(setup, res) {
    setBadge(res.inputs.profile_id);
    $("blocked-run").textContent = setup.run_id + " · scenario " + setup.scenario_id + " · profile " + res.inputs.profile_id;
    $("blocked-text").textContent = D.fixed_texts.config_blocked;
    $("blocked-label").textContent = D.verdict_labels.NOT_EVALUATED;
    $("blocked-reason").textContent = "block_reason: " + res.block_reason;
    showScreen("screen-blocked");
  }

  // ---- placeholder until TICKET 02 ----
  function renderOk(setup, res) {
    $("ok-run").textContent = setup.run_id + " · scenario " + setup.scenario_id + " · profile " + res.inputs.profile_id +
      " · seed " + setup.seed + " · speed " + setup.speed + "× · operator " + setup.operator;
    showScreen("screen-ok");
  }

  function init() {
    D = window.APP_DATA; V = window.IGBT.validate;
    renderChrome();
    if ($("screen-setup")) { buildSetup(); showScreen("screen-setup"); }
  }

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", function () { if ($("app")) init(); });
  }
  return { init: init, readCustomOverrides: readCustomOverrides };
})();
