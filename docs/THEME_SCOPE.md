# Theme extension — scope and approval gate

Requested by Alex via hermes: Light theme, Dark/Light/System selector, localStorage persistence, all components readable in both modes. Preserve approved layout and existing API/gateway functionality. No deployment changes.

Approval recorded: Alex approved designer screenshots via @hermes and explicitly authorized implementation. TH-02/TH-03 now ASSIGNED / READY TO IMPLEMENT; earlier BLOCKED descriptions below are historical gate definitions, superseded by this approval. TH-04 awaits implementation handoff; TH-05 awaits QA. Deployment authorization unchanged.

TH-01 APPROVED: designer proposes semantic token matrix and desktop/mobile preview in THEME_DESIGN.md. Designer delivery and Alex visual approval precede production implementation.
TH-02 BLOCKED ON DESIGN APPROVAL: developer implement semantic CSS variables/Tailwind mapping; avoid scattered light overrides. Palette applied to all tabs, forms, modals, drawers, badge levels, errors/loading/empty, code/evidence, hover/disabled/focus. No source implementation assigned yet.
TH-03 BLOCKED ON DESIGN APPROVAL: accessible Dark/Light/System control. Persist preference enum dark|light|system separately from resolved theme. Default system only if no valid saved preference; ignore invalid values safely. React to OS media-query changes only in system mode; remove event listeners. localStorage failures must not crash or prevent toggling. Initial pre-paint theme resolution avoids wrong-theme flash; safe under current browser-only build, guard browser globals in tests. Color-scheme updates native controls. No remote fonts/CDN.
TH-04 BLOCKED ON IMPLEMENTATION: independent QA tests reload persistence, absent/invalid/throwing storage, OS changes in system and fixed modes, listener cleanup, keyboard/focus/name of control; each feature tab/modal desktop/mobile in both themes, colors including badges/errors/disabled, no hidden text. Real build/typecheck/unit/component tests plus browser verification. Contrast ratios calculated on actual foreground/background, not certification. Existing workspace isolation/SSE/API regressions must pass.
TH-05 FINAL REVIEW: tech lead verifies deliverables and tests. Theme acceptance separate from deployment authorization.

Designer owns preview/docs only during design phase. Developer starts only after Alex approves proposal. QA does not sign off on mockup/self-report. No changes to other profiles or agent runtime.
