# Theme final review — acceptance blocked

TH-04 signoff contested / reopened; TH-05 BLOCKED, no deployment change.

Direct source review and actual execution of prepaint script extracted from index.html with node:vm:
scenario localStorage.getItem throws SecurityError and matchMedia matches=false (OS light) -> root class dark, colorScheme dark. ThemeContext getStoredTheme returns system on storage exception and resolves OS light -> light. Startup fallback mismatch creates wrong-theme transition. QA pass on context tests does not cover real head script. Developer must separate storage read error handling from OS resolution, match runtime fallback for missing/throwing matchMedia, and execute real source and built scripts in regression cases.

THEME_QA_REPORT.md section 4.2 measures dark tertiary metadata #64748b over #1e293b at 3.07:1 and labels acceptable accessory text. Informational small text is not exempt simply because secondary; this does not support blanket normal-text AA claim. Audit actual usage, use semantic tertiary dark token where needed (defined #7e8d9f), verify composited ratios at least4.5 for normal informational text in both themes. No certification/pixel-identical universal assertions without comparison evidence.

Previously personally verified build/typecheck45unit8gateway pass remains valid but does not discharge these acceptance criteria. Developer and QA notified asynchronously; delivery not yet confirmed. Retest identified frozen revision before acceptance.
