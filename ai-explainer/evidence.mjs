// Shared, dependency-free projection. Never forward arbitrary report prose or metadata.
export const REPORT_LIMIT = 512 * 1024;
export const EVIDENCE_LIMIT = 32 * 1024;
export const VERDICT_REF = '/deterministic/overall/verdict';
export const VERIFY_REF = '/deterministic/safe_state/verification';
const quantityStages = {
  Q01: 'T01', Q02: 'T01', Q03: 'T02', Q03b: 'T02', Q04: 'T02',
  Q05: 'T03', Q06: 'T03', Q07: 'T03', Q08: 'T04', Q09: 'T05',
  Q10: 'T06', Q11: 'T07', Q12: 'T08a', Q13: 'T08a', Q14: 'T09', Q16: 'T08a', Q18: 'T10'
};
const stages = ['T00', 'T01', 'T02', 'T03', 'T06', 'T04', 'T05', 'T07', 'T08a', 'T08b', 'T09', 'T10'];
const stageStates = ['DONE', 'BLOCKED', 'NOT_APPLICABLE', 'NOT_MODELLED', 'NOT_RUN', 'INTERRUPTED'];
const eventTypes = ['ABORT_TRIGGER', 'DISCHARGE_START', 'DISCHARGE_NOT_REQUIRED', 'DISCHARGE_VERIFIED',
  'DISCHARGE_FAILED', 'VERIFICATION_UNAVAILABLE', 'FAULT_LOCKED', 'DOOR_UNLOCKED', 'RUN_END', 'CONFIG_BLOCKED'];
const oneOf = values => v => values.includes(v);
const numeric = v => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= 1e9;
const nullableNumber = v => v === null || numeric(v);
const boolean = v => typeof v === 'boolean';
const scalar = v => v === null || numeric(v) || boolean(v);
const nullableEnum = values => oneOf([null, ...values]);
const specs = {
  '/simulation': v => v === true,
  '/schema_version': v => v === '0.3',
  '/deterministic/overall/verdict': oneOf(['PASS', 'FAIL', 'ABORTED', 'INCOMPLETE', 'NOT EVALUATED']),
  '/deterministic/overall/is_acceptance_decision': v => v === false,
  '/deterministic/overall/abort_reason': nullableEnum(['OPERATOR', 'WATCHDOG', 'SAFE_STATE_NOT_VERIFIED', ...Array.from({ length: 7 }, (_, i) => `IL${i + 1}_OPEN`)]),
  '/deterministic/overall/block_reason': nullableEnum(['CONFIGURATION_PREFLIGHT']),
  '/deterministic/inputs/profile_id': oneOf(['demo', 'production_unconfigured']),
  '/deterministic/inputs/profile_status': oneOf(['demo', 'production_unconfigured']),
  '/deterministic/inputs/noise_rel_sigma': v => numeric(v) && v >= 0 && v <= 0.05,
  '/deterministic/physical_total_s': v => numeric(v) && v >= 0,
  [VERIFY_REF]: oneOf(['VERIFIED', 'DISCHARGE_FAILED', 'VERIFICATION_UNAVAILABLE']),
  '/deterministic/safe_state/trigger': oneOf(['NORMAL_COMPLETION', 'ABORT']),
  '/deterministic/safe_state/door': oneOf(['LOCKED', 'UNLOCKED']),
  '/deterministic/safe_state/final_state': oneOf(['SAFE', 'FAULT_LOCKED']),
  '/deterministic/safe_state/v_bus_at_start_v': nullableNumber,
  '/deterministic/safe_state/v_bus_at_verification_v': nullableNumber,
  '/deterministic/safe_state/discharge_time_s': nullableNumber,
  ...Object.fromEntries(['gate_off_commanded', 'gate_off_confirmed', 'hv_source_disabled', 'contactor_open', 'discharge_required']
    .map(k => [`/deterministic/safe_state/${k}`, boolean]))
};
const readingSpecs = {
  quantity_id: oneOf(Object.keys(quantityStages)), unit: oneOf(['V', 'W', 'mA', 'µs', 'A/µs', 'boolean', '', 'bool']),
  value: scalar, verdict: oneOf(['PASS', 'FAIL', 'INFO', 'NOT RUN']),
  observation: oneOf(['OBSERVED', 'NOT_OBSERVED_IN_WINDOW', 'NOT_MEASURED']),
  rule_basis: nullableEnum(['CASE_INFERRED', 'CASE_TRANSFERRED', 'INVENTED_TOLERANCE', 'INVENTED']),
  approval_status: v => v === 'NOT_APPROVED',
  'rule/type': oneOf(['window', 'max', 'min', 'bool', 'boolean', 'time_max', 'info']),
  'rule/min': nullableNumber, 'rule/max': nullableNumber, 'rule/expect': scalar
};
const get = (obj, ref) => ref.split('/').slice(1).reduce((v, key) => v?.[key], obj);
const size = value => new TextEncoder().encode(JSON.stringify(value)).length;
function invalid() { throw new Error('Invalid simulator JSON: expected a complete schema 0.3 synthetic report with supported fields.'); }
function specFor(ref) {
  if (Object.hasOwn(specs, ref)) return specs[ref];
  let m = ref.match(/^\/deterministic\/stages\/(\d|1[01])\/(test_id|status)$/);
  if (m) return m[2] === 'test_id' ? oneOf(stages) : oneOf(stageStates);
  m = ref.match(/^\/deterministic\/stages\/(\d|1[01])\/readings\/(\d|1\d)\/(quantity_id|unit|value|verdict|observation|rule_basis|approval_status|rule\/(?:type|min|max|expect))$/);
  if (m) return readingSpecs[m[3]];
  m = ref.match(/^\/deterministic\/events\/(\d{1,3})\/(type|stage|physical_time_s)$/);
  if (m && Number(m[1]) < 200) return m[2] === 'type' ? oneOf(eventTypes) : m[2] === 'stage' ? nullableEnum(stages) : v => numeric(v) && v >= 0;
  return null;
}

// Also run at the server boundary: client-supplied paths and text are not trusted.
export function validateEvidence(payload) {
  if (!payload || Object.keys(payload).sort().join(',') !== 'evidence' || !Array.isArray(payload.evidence) ||
      payload.evidence.length < 10 || payload.evidence.length > 350 || size(payload) > EVIDENCE_LIMIT) invalid();
  const seen = new Set();
  for (const item of payload.evidence) {
    if (!item || Object.keys(item).sort().join(',') !== 'ref,value' || typeof item.ref !== 'string' || seen.has(item.ref)) invalid();
    const check = specFor(item.ref);
    if (!check || !check(item.value)) invalid();
    seen.add(item.ref);
  }
  for (const ref of ['/simulation', '/schema_version', VERDICT_REF, '/deterministic/overall/is_acceptance_decision',
    '/deterministic/overall/abort_reason', '/deterministic/overall/block_reason', '/deterministic/inputs/profile_id',
    '/deterministic/inputs/profile_status', '/deterministic/inputs/noise_rel_sigma', '/deterministic/physical_total_s']) {
    if (!seen.has(ref)) invalid();
  }
  const fields = new Map(payload.evidence.map(e => [e.ref, e.value]));
  const verification = fields.get(VERIFY_REF);
  if (fields.has('/deterministic/safe_state/v_bus_at_verification_v') && !verification) invalid();
  if (verification) {
    const safe = verification === 'VERIFIED';
    if (fields.get('/deterministic/safe_state/door') !== (safe ? 'UNLOCKED' : 'LOCKED') ||
        fields.get('/deterministic/safe_state/final_state') !== (safe ? 'SAFE' : 'FAULT_LOCKED') ||
        (!safe && fields.get(VERDICT_REF) !== 'ABORTED')) invalid();
  }
  return payload;
}

export function prepareReport(report) {
  if (!report || size(report) > REPORT_LIMIT || !Array.isArray(report.deterministic?.stages) ||
      report.deterministic.stages.length !== stages.length || !Array.isArray(report.deterministic.events) ||
      report.deterministic.events.length > 200) invalid();
  const evidence = [];
  const add = ref => { const value = get(report, ref); if (value === undefined) invalid(); evidence.push({ ref, value }); };
  for (const ref of Object.keys(specs)) {
    if (ref.startsWith('/deterministic/safe_state/') && report.deterministic.safe_state === null) continue;
    add(ref);
  }
  report.deterministic.stages.forEach((stage, i) => {
    const prefix = `/deterministic/stages/${i}`;
    if (stage.test_id !== stages[i] || !Array.isArray(stage.readings) || stage.readings.length > 20) invalid();
    add(prefix + '/test_id'); add(prefix + '/status');
    const ids = new Set();
    stage.readings.forEach((reading, j) => {
      if (quantityStages[reading.quantity_id] !== stage.test_id || ids.has(reading.quantity_id)) invalid();
      ids.add(reading.quantity_id);
      const keys = ['quantity_id', 'unit', 'value', 'verdict', 'observation', 'rule_basis', 'approval_status'];
      if (reading.verdict === 'FAIL') keys.push('rule/type', 'rule/min', 'rule/max', 'rule/expect');
      keys.forEach(key => add(`${prefix}/readings/${j}/${key}`));
    });
  });
  report.deterministic.events.forEach((event, i) => {
    if (eventTypes.includes(event.type)) ['type', 'stage', 'physical_time_s'].forEach(key => add(`/deterministic/events/${i}/${key}`));
  });
  return validateEvidence({ evidence });
}

export function reviewSummary(payload) {
  validateEvidence(payload);
  const values = new Map(payload.evidence.map(e => [e.ref, e.value]));
  const verification = values.get(VERIFY_REF) || 'Procedure not run';
  return {
    verdict: values.get(VERDICT_REF), verification, facts: payload.evidence.length, bytes: size(payload),
    voltage_context: verification === 'VERIFICATION_UNAVAILABLE'
      ? 'Bus voltage is a model estimate; verification is unavailable. It is not an independently verified reading.'
      : 'All readings are synthetic. VERIFIED describes only the simulated verification step, not a physical measurement.'
  };
}
