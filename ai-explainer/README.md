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

Manual browser follow-up (unperformed under the current browser restriction): selection sends nothing; reviewed payload excludes identifiers; one click sends one request; summary/citations render as text; unavailable verification is qualified; errors are clear. Browser, physical-device and real simulator-download/print acceptance remain separate.

## API sources

- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses): Responses `text.format`, strict JSON schema, refusals and incomplete output handling.
- [GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini): default model; configurable because account access may differ.
