/* ui.js: rendering and controls. Banner, profile badge, Limitations, Setup (Screen 1),
   Validation error (1a), Configuration blocked (1b), Pre-check (2), Run (3), Result (4),
   FAULT_LOCKED banner. The run itself lives in sequencer.js; this file only drives its
   clock (advance(speed × real dt)) and renders it. */
window.IGBT = window.IGBT || {};
window.IGBT.ui = (function () {
  var D, V, E, SEQ, REP, F;
  var runCounter = 0;
  var state = { runId: null, lastResult: null, userProfile: "demo", run: null, setup: null, report: null, blocked: null,
                timer: null, lastTick: 0, logCount: 0, focusKey: null };

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
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); return n; }
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

  // ---- shared chrome: banner, badge, limitations, footer, FAULT_LOCKED banner ----
  function renderChrome() {
    $("sim-banner").textContent = D.fixed_texts.banner;
    $("limitations-text").textContent = D.fixed_texts.limitations;
    var legend = clear($("chip-legend"));
    D.fixed_texts.chip_legend.forEach(function (c) {
      var cls = "chip" + (c.chip === "NOT APPROVED" ? " chip-na" : "");
      legend.appendChild(el("li", null, [el("span", { class: cls, text: c.chip }), " = " + c.meaning]));
    });
    if ($("footer-text")) $("footer-text").textContent = D.fixed_texts.report_footer;
    if ($("footer-version")) $("footer-version").textContent = "v" + D.software_version;
    if ($("fault-text")) $("fault-text").textContent = D.fixed_texts.fault_locked_banner;

    // Limitations: native modal dialog (Escape closes, focus returns); plain toggle where unsupported
    var dlg = $("limitations"), opener = $("open-limitations");
    opener.addEventListener("click", function () {
      if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    });
    function closeDialog() {
      if (typeof dlg.close === "function") dlg.close(); else dlg.removeAttribute("open");
      opener.focus();
    }
    $("close-limitations").addEventListener("click", closeDialog);
    dlg.addEventListener("click", function (e) { if (e.target === dlg) closeDialog(); });
  }
  function setBadge(profileId) {
    var p = V.findProfile(profileId);
    var b = $("profile-badge");
    b.textContent = p ? p.profile_badge : "";
    b.className = "badge " + (p && p.profile_status === "demo" ? "badge-demo" : "badge-prod");
  }
  // Workflow strip: which of the five steps (02 §11) a screen belongs to
  var screenShownOnce = false;
  var SCREENS = ["screen-setup", "screen-invalid", "screen-blocked", "screen-precheck", "screen-run", "screen-result"];
  var SCREEN_STEP = { "screen-setup": 1, "screen-invalid": 1, "screen-blocked": 1, "screen-precheck": 2, "screen-run": 3, "screen-result": 4 };
  function setStep(n) {
    Array.prototype.forEach.call(document.querySelectorAll("#workflow-steps li"), function (li) {
      var s = parseInt(li.getAttribute("data-step"), 10);
      li.className = s < n ? "done" : "";
      if (s === n) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
  }
  function showScreen(id) {
    SCREENS.forEach(function (s) { $(s).hidden = s !== id; });
    if ($("workflow-steps")) setStep(SCREEN_STEP[id] || 1);
    window.scrollTo(0, 0);
    // Move keyboard / screen-reader focus to the new screen's heading
    var h = $(id).querySelector("h2[tabindex]");
    if (h && screenShownOnce) h.focus({ preventScroll: true });
    screenShownOnce = true;
  }

  // ---- shared formatting ----
  function dpOf(q) { var d = D.display_decimals[q]; return d === undefined ? 2 : d; }
  function numText(q, x) { return F.fixed(x, dpOf(q)); }
  function unitOf(r) { return r.unit === "bool" ? "" : r.unit; }
  function valueText(r) {
    if (r.value === null || r.value === undefined) return "—";
    return typeof r.value === "number" ? numText(r.quantity_id, r.value) : String(r.value);
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
  function marginText(r) {
    if (r.margin === null || r.margin === undefined) return "—";
    return (r.margin > 0 ? "+" : "") + numText(r.quantity_id, r.margin) + (unitOf(r) ? " " + unitOf(r) : "");
  }
  // Provenance chips (05 §1): basis, case reference, NOT APPROVED; info rules say so
  function chipsFor(r) {
    var box = el("div", { class: "chips" });
    if (r.rule.type === "info") { box.appendChild(el("span", { class: "chip", text: "INFO · not judged" })); return box; }
    box.appendChild(el("span", { class: "chip", text: "ILLUSTRATIVE · " + r.rule_basis }));
    if (r.reference_id) box.appendChild(el("span", { class: "chip", text: "Case ref " + r.reference_id, title: r.reference_text || "" }));
    box.appendChild(el("span", { class: "chip chip-na", text: "NOT APPROVED" }));
    return box;
  }
  function verdictChip(v) {
    var cls = v === "PASS" ? "st st-pass" : v === "FAIL" ? "st st-fail" : "st";
    return el("span", { class: cls, text: v });
  }
  function statusClass(s) {
    return s === "RUNNING" ? "st st-run" : (s === "BLOCKED" || s === "INTERRUPTED") ? "st st-warn" : "st";
  }
  function stageVerdict(st) {
    if (st.status !== "DONE") return null;
    if (!st.readings.some(function (r) { return r.required; })) return null;
    return E.stagePass(st) ? "PASS" : "FAIL";
  }
  function sec(x) { return F.fixed(x, 2) + " s"; }
  function runMeta(setup, inputs) {
    return setup.run_id + " · scenario " + inputs.scenario_id + " (" + inputs.scenario_name + ") · profile " + inputs.profile_id +
      " · seed " + inputs.seed + " · speed " + inputs.speed + "× · operator " + setup.operator;
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
    Array.prototype.forEach.call(document.querySelectorAll(".btn-back"), function (b) { b.addEventListener("click", backToSetup); });
    newRunId();
    refreshSetup();
  }
  function newRunId() { state.runId = nextRunId(); $("run-id").textContent = state.runId; }
  function backToSetup() {
    stopTimer();
    state.run = null; state.report = null; state.blocked = null;
    $("fault-banner").hidden = true;
    newRunId(); refreshSetup(); showScreen("screen-setup");
  }

  // Custom: editable module-parameter table with units (module_id is set above, module_note is fixed)
  function buildCustomTable() {
    var body = clear($("custom-body"));
    var defs = D.module_defaults, units = D.module_parameter_units;
    Object.keys(defs).forEach(function (k) {
      if (k === "module_id") return;
      var input;
      if (k === "module_note") {
        input = el("span", { class: "fixed", text: defs[k] });
      } else if (typeof defs[k] === "boolean") {
        input = el("select", { "data-param": k, "data-kind": "bool", "aria-label": k }, [el("option", { value: "true", text: "true" }), el("option", { value: "false", text: "false" })]);
        input.value = String(defs[k]);
      } else {
        input = el("input", { type: "text", "data-param": k, "data-kind": "num", "aria-label": k + " (" + units[k] + ")", value: String(defs[k]), inputmode: "decimal", size: "10", autocomplete: "off", spellcheck: "false" });
      }
      var hint = k === "desat_trip_us" ? "leave empty = never trips (null)" : "";
      body.appendChild(el("tr", null, [
        el("td", null, [el("code", { text: k, translate: "no" })]),
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
    else renderPrecheck(setup, res);
  }

  // ---- Screen 1a: validation error ----
  function renderInvalid(setup, errors) {
    $("invalid-run").textContent = setup.run_id + " · scenario " + setup.scenario_id;
    var body = clear($("invalid-body"));
    errors.forEach(function (e) {
      body.appendChild(el("tr", null, [el("td", null, [el("code", { text: e.field, translate: "no" })]), el("td", null, [el("code", { text: show(e.value), translate: "no" })]), el("td", { text: e.rule })]));
    });
    $("invalid-count").textContent = errors.length + (errors.length === 1 ? " invalid input" : " invalid inputs") + ". No run and no verdict. Go back to setup, fix the values listed below, then press CONTINUE again.";
    showScreen("screen-invalid");
  }

  // ---- Screen 1b: configuration blocked; Download JSON exports the CONFIG_BLOCKED report ----
  function renderBlocked(setup, res) {
    setBadge(res.inputs.profile_id);
    $("blocked-run").textContent = setup.run_id + " · scenario " + setup.scenario_id + " · profile " + res.inputs.profile_id;
    $("blocked-text").textContent = D.fixed_texts.config_blocked;
    $("blocked-label").textContent = D.verdict_labels.NOT_EVALUATED;
    $("blocked-reason").textContent = "block_reason: " + res.block_reason;
    state.blocked = { setup: setup, res: res };
    showScreen("screen-blocked");
  }
  function exportBlocked() {
    if (!state.blocked) return;
    REP.download(REP.buildConfigBlockedJson(state.blocked.res, { run_id: state.blocked.setup.run_id, operator: state.blocked.setup.operator }));
  }

  // ---- Screen 2: Pre-check (IL1–IL7 lamps; START only when all OK) ----
  var IL_TOGGLES = {
    IL1: ["Open door", "Close door"],
    IL2: ["Press E-stop", "Release E-stop"],
    IL6: ["Lose heartbeat", "Restore heartbeat"]
  };
  function renderPrecheck(setup, res) {
    stopTimer();
    state.setup = setup; state.report = null;
    state.run = SEQ.create(res);
    $("precheck-run").textContent = runMeta(setup, res.inputs);
    renderLamps();
    showScreen("screen-precheck");
  }
  function renderLamps() {
    var run = state.run, list = clear($("lamps"));
    D.interlocks.forEach(function (il) {
      var ok = run.interlocks[il.id];
      var li = el("li", { class: "lamp " + (ok ? "ok" : "open") }, [
        el("span", { class: "lamp-dot", "aria-hidden": "true" }),
        el("span", { class: "lamp-name", text: il.id + " · " + il.name }),
        el("span", { class: "lamp-state", text: ok ? "OK" : "OPEN" }),
        el("span", { class: "lamp-src", text: "Demo control: " + il.demo_control })
      ]);
      if (IL_TOGGLES[il.id]) {
        var label = IL_TOGGLES[il.id][ok ? 0 : 1];
        li.appendChild(el("button", { type: "button", text: label, "aria-label": label + " (" + il.id + ")",
          onclick: function () { SEQ.setInterlock(run, il.id, !run.interlocks[il.id]); renderLamps(); } }));
      }
      list.appendChild(li);
    });
    var allOk = SEQ.allInterlocksOk(run);
    $("btn-start").disabled = !allOk;
    var open = D.interlocks.filter(function (il) { return !run.interlocks[il.id]; }).map(function (il) { return il.id; });
    $("precheck-status").hidden = allOk;
    $("precheck-status").textContent = allOk ? "" : "START disabled: " + open.join(", ") + " not OK.";
  }
  function onStart() {
    var res = SEQ.start(state.run);
    if (!res.ok) { $("precheck-status").hidden = false; $("precheck-status").textContent = "START refused: " + res.reason + "."; return; }
    showRun();
  }

  // ---- Screen 3: Run ----
  function now() { return window.performance && window.performance.now ? window.performance.now() : Date.now(); }
  function startTimer() {
    stopTimer();
    state.lastTick = now();
    state.timer = setInterval(tick, 100);
  }
  function stopTimer() { if (state.timer) { clearInterval(state.timer); state.timer = null; } }
  // Timer: advance(speed × real dt). A long gap (hidden tab) is capped at 0.5 s real time.
  function tick() {
    var t = now(), dt = Math.min(0.5, Math.max(0, (t - state.lastTick) / 1000));
    state.lastTick = t;
    SEQ.advance(state.run, state.run.inputs.speed * dt);
    renderRun();
    if (SEQ.isTerminal(state.run)) { stopTimer(); onRunFinished(); }
  }
  function showRun() {
    var run = state.run;
    $("run-meta").textContent = runMeta(state.setup, run.inputs);
    $("clock-caption").textContent = D.fixed_texts.clock_caption;
    $("clock-speed").textContent = run.inputs.speed + "×";
    clear($("log-body")); state.logCount = 0; state.focusKey = null;
    $("btn-view-result").disabled = true;
    $("btn-run-new").hidden = true;
    renderRun();
    showScreen("screen-run");
    startTimer();
  }
  function onRunFinished() {
    var run = state.run;
    state.report = REP.buildJson(run, { run_id: state.setup.run_id, operator: state.setup.operator });
    $("btn-view-result").disabled = false;
    $("btn-run-new").hidden = run.state === "FAULT_LOCKED";
    renderRun();
  }

  var STATE_CLASS = { RUNNING: "st st-run", SAFE_STATE_PROCEDURE: "st st-warn", SAFE: "st st-pass", FAULT_LOCKED: "st st-lock", ENDED: "st", RESET: "st" };
  function renderRun() {
    var run = state.run;
    if (!run) return;
    var rs = $("run-state");
    rs.textContent = run.state.replace(/_/g, " ");
    rs.className = STATE_CLASS[run.state] || "st";
    $("clock-phys").textContent = sec(run.t);
    $("clock-anim").textContent = sec(run.t / run.inputs.speed);
    renderStageList(run);
    renderActive(run);
    renderReadings(run);
    renderBench(run);
    renderLog(run);
    var live = run.state === "RUNNING" || run.state === "SAFE_STATE_PROCEDURE";
    ["btn-abort", "btn-door", "btn-heartbeat"].forEach(function (id) { $(id).disabled = !live; });
    $("fault-banner").hidden = !(run.safe && run.safe.locked && run.state !== "RESET");
  }

  function renderStageList(run) {
    var list = clear($("stage-list")), active = SEQ.activeStage(run), prog = SEQ.stageProgress(run);
    run.stages.forEach(function (st) {
      var isActive = !!active && active.test_id === st.test_id;
      var stat = el("span", { class: "stat" }, [el("span", { class: statusClass(st.status), text: st.status.replace(/_/g, " ") })]);
      var v = stageVerdict(st);
      if (v) stat.appendChild(verdictChip(v));
      var li = el("li", { class: (isActive ? "active" : "") + (st.status === "NOT_APPLICABLE" || st.status === "NOT_MODELLED" ? " skipped" : "") }, [
        el("span", { class: "id", text: st.test_id }),
        el("span", { class: "nm", text: st.name }),
        stat,
        el("span", { class: "cls", text: st["class"] })
      ]);
      if (isActive) li.setAttribute("aria-current", "step");
      if (isActive && prog !== null) {
        var pc = Math.round(prog * 100);
        var bar = el("div", { class: "progress", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": String(pc), "aria-label": st.test_id + " progress" }, [el("span")]);
        bar.firstChild.style.width = pc + "%";
        bar.style.gridColumn = "1 / -1";
        li.appendChild(bar);
      }
      list.appendChild(li);
    });
  }

  function renderActive(run) {
    var box = clear($("active-stage")), st = SEQ.activeStage(run), prog = SEQ.stageProgress(run);
    if (!st) {
      var o = run.overall;
      box.appendChild(el("p", { class: "active-name", text: run.state === "PRECHECK" ? "Not started" : "Run finished · final state " + run.state.replace(/_/g, " ") }));
      if (o) box.appendChild(el("p", { class: "active-meta", text: "Overall " + o.verdict + " · " + o.verdict_label }));
      return;
    }
    var def = E.stageDef(st.test_id);
    box.appendChild(el("p", { class: "active-name", text: st.test_id + " · " + st.name }));
    box.appendChild(el("p", { class: "active-meta", text: st["class"] + " · " + def.excitation + (prog !== null ? " · " + Math.round(prog * 100) + "%" : "") +
      (st.status_note ? " · " + st.status_note : "") }));
  }

  // Readings card: the active stage once it has readings (T10 after SS3), else the last DONE stage with readings
  function focusStage(run) {
    var a = SEQ.activeStage(run);
    if (a && a.readings.some(function (r) { return r.observation !== "NOT_MEASURED"; })) return a;
    var last = null;
    run.stages.forEach(function (s) { if (s.status === "DONE" && s.readings.length) last = s; });
    return last;
  }
  function renderReadings(run) {
    var st = focusStage(run);
    var key = st ? st.test_id + "|" + st.status + "|" + st.readings.map(function (r) { return r.verdict; }).join(",") : "none";
    if (key === state.focusKey) return;
    state.focusKey = key;
    var box = clear($("reading-cards")), eq = $("equation");
    $("readings-of").textContent = st ? "· " + st.test_id : "";
    if (!st) { box.appendChild(el("p", { class: "empty", text: "No readings yet. Readings appear when a stage with module readings completes." })); eq.hidden = true; return; }
    st.readings.forEach(function (r) {
      var u = unitOf(r);
      box.appendChild(el("div", { class: "rcard" }, [
        el("div", { class: "rcard-top" }, [el("span", { class: "rcard-label", text: r.quantity_id + " · " + r.label }), verdictChip(r.verdict)]),
        el("p", { class: "rcard-value" }, [valueText(r), u ? el("span", { class: "u", text: u }) : null]),
        el("p", { class: "rcard-rule", text: "Rule: " + ruleText(r) + " · margin " + marginText(r) + (r.observation !== "OBSERVED" ? " · " + r.observation : "") }),
        chipsFor(r),
        el("p", { class: "muted small", text: "Conditions: " + (r.conditions || "—") })
      ]));
    });
    var eqs = st.readings.filter(function (r) { return r.model_equation; }).map(function (r) { return r.model_equation; });
    if (st.model_equation) eqs.push(st.model_equation);
    clear(eq);
    eq.hidden = !eqs.length;
    if (eqs.length) {
      eq.appendChild(el("span", { class: "k", text: "Model equation (02 §8, values substituted)" }));
      eqs.forEach(function (t, i) { if (i) eq.appendChild(el("br")); eq.appendChild(document.createTextNode(t)); });
    }
  }

  function renderBench(run) {
    var b = SEQ.bench(run), bc = run.inputs.bench_conditions;
    var dl = clear($("bench"));
    var open = D.interlocks.filter(function (il) { return !run.interlocks[il.id]; }).map(function (il) { return il.id; });
    [["v_bus_v", F.fixed(b.v_bus_v, 1) + " V"],
     ["HV source", b.source_enabled ? "ENABLED" : "DISABLED"],
     ["Contactor", b.contactor_closed ? "CLOSED" : "OPEN"],
     ["Door", b.door_locked ? "LOCKED" : "UNLOCKED"],
     ["Gate command", b.gate_cmd],
     ["Gate measured", F.fixed(b.gate_meas_v, 1) + " V"],
     ["Interlocks", open.length ? open.join(", ") + " OPEN" : "IL1–IL7 OK"]
    ].forEach(function (p) { dl.appendChild(el("dt", { text: p[0] })); dl.appendChild(el("dd", { text: p[1] })); });
    var bar = $("bus-bar");
    bar.style.width = Math.max(0, Math.min(100, 100 * b.v_bus_v / bc.v_dc_test_v)) + "%";
    bar.className = b.v_bus_v <= bc.v_safe_v ? "low" : "";
    $("bus-scale").textContent = "Bar: v_bus_v on a 0 to " + F.num(bc.v_dc_test_v) + " V scale · v_safe " + F.num(bc.v_safe_v) + " V";
  }

  function renderLog(run) {
    var body = $("log-body"), wrap = $("log-wrap");
    if (state.logCount === run.events.length) return;
    var nearBottom = wrap.scrollHeight - wrap.scrollTop - wrap.clientHeight < 40;
    for (var i = state.logCount; i < run.events.length; i++) {
      var e = run.events[i];
      var cls = e.type === "WARNING" ? "ev-warn" : e.type === "ABORT_TRIGGER" ? "ev-abort" :
        (e.type === "FAULT_LOCKED" || e.type === "DISCHARGE_FAILED" || e.type === "VERIFICATION_UNAVAILABLE") ? "ev-lock" : "";
      body.appendChild(el("tr", { class: cls }, [
        el("td", { class: "num", text: String(e.seq) }),
        el("td", { class: "num", text: F.fixed(e.physical_time_s, 2) }),
        el("td", { class: "num", text: F.fixed(e.animation_time_s, 2) }),
        el("td", { text: e.stage || "—" }),
        el("td", { class: "type", text: e.type }),
        el("td", { text: e.detail })
      ]));
    }
    state.logCount = run.events.length;
    if (nearBottom) wrap.scrollTop = wrap.scrollHeight;
  }

  // Demo controls: abort triggers while RUNNING; logged and ignored during the safe-state procedure
  function demoAbort() { SEQ.abort(state.run, "OPERATOR"); renderRun(); }
  function demoInterlock(id, cause) {
    var run = state.run;
    if (run.interlocks[id]) SEQ.setInterlock(run, id, false);
    else SEQ.abort(run, cause);
    renderRun();
  }

  // ---- Screen 4: Result ----
  var VERDICT_CLASS = { PASS: "verdict verdict-pass", FAIL: "verdict verdict-fail", ABORTED: "verdict verdict-abort", INCOMPLETE: "verdict verdict-abort", "NOT EVALUATED": "verdict verdict-ne" };
  function showResult() {
    var rep = state.report, det = rep.deterministic, o = det.overall;
    $("result-meta").textContent = runMeta(state.setup, det.inputs);
    var v = $("result-verdict");
    v.textContent = o.verdict; v.className = VERDICT_CLASS[o.verdict] || "verdict verdict-ne";
    $("result-label").textContent = o.verdict_label;
    $("result-precedence").textContent = "Precedence: " + o.precedence_reason;
    var reasons = [];
    if (o.block_reason) reasons.push("block_reason: " + o.block_reason);
    if (o.abort_reason) reasons.push("abort_reason: " + o.abort_reason);
    reasons.push("is_acceptance_decision: false");
    $("result-reasons").textContent = reasons.join(" · ");

    var body = clear($("result-body"));
    det.stages.forEach(function (st) {
      st.readings.forEach(function (r) {
        var u = unitOf(r), dim = r.verdict === "NOT RUN" ? " notrun" : "";
        body.appendChild(el("tr", { class: "r-main" + dim }, [
          el("td", null, [el("strong", { text: st.test_id }), el("span", { class: "obs", text: st.status.replace(/_/g, " ") })]),
          el("td", { class: "q" }, [el("strong", { text: r.quantity_id }), el("span", { class: "obs", text: r.label })]),
          el("td", null, [valueText(r) + (u && r.value !== null ? " " + u : ""), r.observation !== "OBSERVED" ? el("span", { class: "obs", text: r.observation }) : null]),
          el("td", { text: ruleText(r) }),
          el("td", { class: "ch" }, [chipsFor(r)]),
          el("td", { text: marginText(r) }),
          el("td", null, [verdictChip(r.verdict)])
        ]));
        body.appendChild(el("tr", { class: "r-reason" + dim }, [
          el("td", { colspan: "7" }, [el("strong", { text: "Reason: " }), r.reason, r.hypothesis ? " · " + r.hypothesis : null])
        ]));
      });
    });

    var hyp = clear($("result-hyp"));
    if (!det.hypotheses.length) hyp.appendChild(el("li", { class: "muted", text: "No FAIL recorded; no hypothesis." }));
    det.hypotheses.forEach(function (h) {
      hyp.appendChild(el("li", { text: (h.source === "SAFE_STATE" ? "Safe state" : h.source + " (" + h.quantity_ids.join(", ") + ")") + ": " + h.text }));
    });

    var dl = clear($("result-safe")), ss = det.safe_state;
    if (!ss) dl.appendChild(el("dd", { class: "muted", text: "Safe-state procedure not run." }));
    else [["Trigger", ss.trigger + (o.abort_reason && ss.trigger === "ABORT" ? " (" + o.abort_reason + ")" : "")],
          ["Gate", "commanded OFF · measured " + F.fixed(ss.gate_measured_v, 1) + " V · " + (ss.gate_off_confirmed ? "confirmed" : "NOT confirmed")],
          ["HV source", ss.hv_source_disabled ? "disabled" : "enabled"],
          ["Contactor", ss.contactor_open ? "open" : "closed"],
          ["v_bus at start", F.fixed(ss.v_bus_at_start_v, 1) + " V"],
          ["Discharge", ss.discharge_required ? (ss.discharge_time_s === null ? "required; did not reach v_safe" : "required; " + sec(ss.discharge_time_s)) : "not required"],
          ["v_bus at verification", F.fixed(ss.v_bus_at_verification_v, 2) + " V"],
          ["Verification", ss.verification],
          ["Door", ss.door],
          ["Final state", ss.final_state]
    ].forEach(function (p) { dl.appendChild(el("dt", { text: p[0] })); dl.appendChild(el("dd", { text: p[1] })); });

    $("result-phys").textContent = sec(det.physical_total_s);
    $("result-anim").textContent = sec(rep.presentation.animation_total_s) + " at " + det.inputs.speed + "×";
    $("result-caption").textContent = rep.presentation.clock_caption;
    var cb = clear($("result-clock-body"));
    det.stages.forEach(function (st) {
      var comps = st.physical_components.map(function (c) { return c.basis + " " + F.num(c.seconds) + " s" + (c.note ? " (" + c.note + ")" : ""); }).join(" + ");
      cb.appendChild(el("tr", null, [el("td", { text: st.test_id + " · " + st.name }), el("td", { text: st.status.replace(/_/g, " ") }), el("td", { text: comps || "—" }), el("td", { text: F.fixed(st.physical_estimate_s, 2) })]));
    });
    var locked = !!state.run && state.run.state === "FAULT_LOCKED";
    $("btn-result-new").disabled = locked;
    $("btn-result-new").title = locked ? "FAULT_LOCKED: use Reset simulation in the red banner" : "";
    showScreen("screen-result");
  }

  function resetSimulation() {
    if (state.run && SEQ.reset(state.run)) backToSetup();
  }

  function init() {
    D = window.APP_DATA; V = window.IGBT.validate; E = window.IGBT.engine; SEQ = window.IGBT.sequencer; REP = window.IGBT.report;
    F = window.IGBT.models.fmt;
    renderChrome();
    if ($("screen-setup")) {
      buildSetup();
      $("btn-export-blocked").addEventListener("click", exportBlocked);
      $("btn-start").addEventListener("click", onStart);
      $("btn-abort").addEventListener("click", demoAbort);
      $("btn-door").addEventListener("click", function () { demoInterlock("IL1", "IL1_OPEN"); });
      $("btn-heartbeat").addEventListener("click", function () { demoInterlock("IL6", "WATCHDOG"); });
      $("btn-view-result").addEventListener("click", showResult);
      $("btn-run-new").addEventListener("click", backToSetup);
      $("btn-result-new").addEventListener("click", backToSetup);
      $("btn-download-json").addEventListener("click", function () { if (state.report) REP.download(state.report); });
      $("btn-reset-sim").addEventListener("click", resetSimulation);
      showScreen("screen-setup");
    }
  }

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", function () { if ($("app")) init(); });
  }
  return { init: init, readCustomOverrides: readCustomOverrides, state: state };
})();
