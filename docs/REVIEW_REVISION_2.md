# Tech lead review of developer remediation revision

Release remains BLOCKED. Latest developer and QA DMs failed target_busy: these review instructions were NOT delivered. This shared artifact preserves the findings; no source changes by coordinator while agents may be editing.

Personally executed against delivered revision: npm run typecheck, npm run build, npm test (15/15), npm run test:gateway (5/5), exit 0. Live 9-test suite not independently rerun.

## Remaining acceptance blockers
DEV-01: scripts/generate-types.mjs reads OpenAPI only for version/count logging and writes a static template, not schema-driven types. Use real generation, integrate generated types into actual client contracts, and test schema fixture change produces changed output. RepresentationResponse.representation must match authoritative string schema rather than unknown.
Origin validation in server/index.mjs permits ports 80/443 as well as gateway port and does not enforce an exact configured trusted origin including scheme. Restrict explicit trusted origins, test different localhost port, malformed/null/non-http origins and Host values on real HTTP.
Regression suite has same 15 frontend tests; add reproducible tests workspace switch during inference, upstream/client abort and suppression of late callbacks/evidence, modal initial focus/Tab/ShiftTab/Escape/focus restoration, semantic premise activation.
Default body limit 2MiB does not cover every Honcho-allowed batch 100*25000 characters, especially multibyte text. Document dashboard subset clearly or increase bound compatibly. Check declared and chunked body limits against local upstream stub, not live payload stress.

QA must evaluate frozen identified revision, preserve independent evidence scripts/logs and correct report overclaims as listed in REWORK_HANDOFF.md. No acceptance of RESOLVED labels without retest. HCS-09 remains blocked on independent QA and authorized deployment/access policy.
