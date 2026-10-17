# Optional synthetic report explainer

Separate from `igbt-test-cell/`: no simulator integration or changes. Node 22+ and Internet access are required for explanations. No dependencies, install, package manifest, database or accounts. The offline simulator remains independent.

## Start (PowerShell, from repository root)

Configure `OPENAI_API_KEY` securely in the **server process environment**, then run:

```powershell
$explainerKey = Read-Host 'OpenAI API key (hidden)' -AsSecureString
$env:OPENAI_API_KEY = [System.Net.NetworkCredential]::new('', $explainerKey).Password
Remove-Variable explainerKey
$env:OPENAI_MODEL = 'gpt-4.1-mini' # optional; must support Responses structured output
$env:PORT = '8787'                # optional
node ai-explainer/server.mjs
```

Open **http://127.0.0.1:8787** manually. Use the literal IP, not localhost or a LAN address. Stop with Ctrl+C. If you configured the key after opening the terminal, open a fresh terminal/restart the process. Never put a key in source, the browser, a report, a command shared in chat, or a committed file. Missing credentials produce a clear error; no fake explanation is shown.

1. Export JSON from the simulator; select that file here.
2. Review the outcome, verification warning and expandable **exact outgoing evidence**. File selection does not contact OpenAI.
3. Click **Explain result**. One request is sent; concurrent clicks are ignored. Errors never retry automatically. A later deliberate click makes a new request and may incur another API charge.

## Data and limits

Schema 0.3 synthetic reports only. Maximum source file 512 KiB; outgoing evidence 32 KiB/350 scalar fields; stages 12, events at most 200. Numeric values must be finite and within ±1e9. Unknown/free-text enum values are rejected. Unsupported report shapes fail closed.

Client-side projection and independent server validation allow only selected outcome, profile, stage/reading and safety-event facts with JSON Pointer references into the original report. Operator, module/run identifiers, dates, seed, full module/bench parameters, filenames, descriptions, hypotheses, equations and event details are not sent. Discarded free text can contain identifiers or prompt injections; no report text is treated as instructions. Identifiers deliberately encoded as numbers in evidence cannot be detected; review the exact payload before sending.

The fixed endpoint is `https://api.openai.com/v1/responses`; there is no configurable upstream URL. The request uses `store: false`, a strict JSON schema and a 1,400-token output cap. `store: false` is not a promise of zero provider retention. Maximum upstream wait 30 seconds; response body at most 96 KiB. A refusal, incomplete response, invalid JSON, invalid citation, timeout or network/API error is displayed as an error without fallback content. No report, key or response is logged or saved by this service. The model is read from `OPENAI_MODEL`, never supplied by the page.

Output contract: 1–6 evidence items (minimum 2 when verification exists), 1–4 limitations; summary up to 800 characters, each evidence explanation up to 320, each limitation up to 240. Schema array bounds and string-length patterns use the same constants as the validator. The prompt explicitly requires nonblank concise text, unique citations, the original case-sensitive verdict in summary, and the verdict/verification refs exactly once. These cross-item/content requirements remain strictly checked locally; unsupported `uniqueItems`/`contains` keywords are not sent. Models must support the documented base-model schema constraints; fine-tuned variants may not.

Loopback binding, exact Host/Origin checks, same-origin JSON POST, no CORS, CSP and text-only rendering bound the local surface. Do not expose it through a proxy/tunnel. Schema checks verify source references and preserve the original displayed verdict, but do not prove every AI sentence correct. Treat explanations as fallible commentary. No tools, hardware connection, certification or energisation instructions are provided.

For S8b, `VERIFICATION_UNAVAILABLE` means the retained voltage is a **model estimate, not independently verified**. Even `VERIFIED` only describes simulated verification. T10 DONE and Q18 PASS do not establish successful discharge. The explanation does not amend the original report or decide Pending Said items.

## Verify

```powershell
node --test ai-explainer/test/*.test.mjs
```

Tests generate S0/S4/S8/S8b reports using the existing Node runner, check field-level provenance/redaction and mock upstream failures. HTTP tests use loopback; page logic tests use a minimal DOM stub, not a browser. Mock outputs exist only in tests and are never available to the running page.

After configuring the real environment key, perform **one small live request**:

```powershell
node ai-explainer/live-check.mjs
```

This explicitly authorized smoke check generates S8b locally, selects only outcome/verification context, validates one real structured response and prints PASS/FAIL only. It never prints credentials, the report or AI response and never retries. A failed call must be investigated before any manual rerun.

### Safe failure diagnostics

Rejected responses include a `diagnostics` object in the HTTP error, displayed by the page and live-check script. It contains only a constant `codes` array and numeric `counts`. The first failed check is reported; no raw field refs, credentials, report/response prose or provider error messages are recorded. There is no response logging or new diagnostic storage.

- Count/text bounds: `EVIDENCE_COUNT`, `LIMITATIONS_COUNT`, `SUMMARY_TEXT_INVALID`, `EVIDENCE_TEXT_INVALID`, `LIMITATION_TEXT_INVALID`.
- Citation/verdict rules: `CITATION_UNKNOWN`, `CITATION_DUPLICATE`, `VERDICT_REFERENCE_MISSING`, `VERIFICATION_REFERENCE_MISSING`, `VERDICT_TEXT_MISSING`.
- Unavailable-verification qualification: `UNAVAILABLE_MODEL_ESTIMATE_MISSING`, `UNAVAILABLE_VERIFICATION_WORDING_MISSING`, `UNAVAILABLE_NOT_VERIFIED_MISSING`.
- Shape/envelope/JSON failures have separate `*_SHAPE`, `*_NOT_ARRAY`, `RESPONSE_*` or `OUTPUT_*` codes.

### Validation evidence and one manual S8 retest

Said reported a successful **reduced S8b** live-check on 17 October 2026. Subsequently the user-run **full S8 browser flow failed** after successful local loading (177 evidence fields, 12,087 bytes), with the generic validation error. The original response was not retained; which rule failed on that call remains unknown. Confirmed code defect: the previous schema omitted bounds enforced by the validator, and the prompt omitted count/uniqueness requirements. That contract mismatch is corrected; it is not proof of the specific call's cause. No paid request was made during this fix. Automated checks use mocks, including valid explanations of full projections.

For one **user-run**, post-fix S8 browser retest:

1. In the `said/ai-explainer` checkout, stop the service with Ctrl+C, run `git pull --ff-only origin said/ai-explainer`, then `node ai-explainer/server.mjs` in the same terminal with the existing environment key. Do not run live-check.mjs as well.
2. Reload http://127.0.0.1:8787 and select the same exported S8 JSON. Confirm ABORTED, DISCHARGE_FAILED and unchanged projection counts (177 / 12,087 for the reported file). Selection must send no OpenAI request.
3. Review, then click **Explain result exactly once**. Success must preserve ABORTED, cite the actual verdict and verification refs, describe the locked enclosure, and make no physical-verification or hardware-acceptance claim.
4. If rejected, stop and share only the displayed `diagnostics` codes/counts; do not share credentials, report text or model prose, and do not click again automatically.

Post-fix live/browser acceptance is pending. Agent browser/visual checks remain unperformed under the restriction. Physical-device and real simulator-download/print acceptance remain separate.

## API sources

- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses): Responses `text.format`, strict JSON schema, refusals and incomplete output handling.
- [GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini): default model; configurable because account access may differ.
