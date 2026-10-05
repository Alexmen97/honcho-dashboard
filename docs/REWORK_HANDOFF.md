# Rework handoff — delivery blocked

Developer and QA operational DMs have repeatedly failed with target_busy. Queue acknowledgements are not delivery. Do not claim agents received these instructions or fixes were applied. Release HCS-09 remains blocked; QA HCS-08 rejected per QA_REPORT.md and KANBAN.md override.

## Developer action required once available
Resolve SEC-01..04, UI-01..03, DEV-01 from QA_REPORT.md with regression tests. Prioritize trusted Host/Origin validation and workspace chat isolation. Reset chat/evidence/config on workspace changes, abort active inference on switch/unmount and prevent stale callbacks. Bound both declared and chunked bodies, documenting limit compatible with supported batches. Remove schedule_dream from dashboard gateway allowlist (valid Honcho endpoint, but outside dashboard scope). Validate raw paths before URL normalization; missing assets return 404. Modal Escape, initial focus, focus containment and trigger focus restoration; semantic buttons for premise drilldown. Reproducible OpenAPI generation must feed actual client types. Validate upstream config protocol and userinfo. Communicate frozen revision and real test commands/results before independent QA retest. No LAN exposure.

## QA report precision and retest requirements
POST list is a read operation, not a mutation. urllib Host/Origin 200 establishes absent restrictions, not a universal browser exploit; explain preflight/PNA/rebinding prerequisites. Oversized forwarding proves missing request limit, not buffer overflow. Missing focus containment is not itself proof of WCAG keyboard trap criterion 2.1.2; no certification granted. Clarify report SSE call against historical alex versus guardrails; future inference exclusively synthetic qa-peer in dedicated sandbox. Provide executable test scripts/logs and measured upstream abort evidence rather than inference from code. Payload stress tests use local upstream stub, not live Honcho. Retest after developer freeze; do not approve based on self-report.

## Coordinator
@tech-lead must verify frozen artifacts and real executions before accepting HCS-01..08. Team DM contention is a coordination blocker, not proof implementation is idle. Do not kill agent processes or edit source concurrently without an explicit ownership handoff.
