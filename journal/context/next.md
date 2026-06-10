# Next — Context Bridge

_Empty buffer. The last entries (08:20 native-capabilities capture, 09:28 command-layer ship) were
consumed at the 2026-06-10 ~09:50 `/stop` (native-capabilities placement) and archived to
`journal/archive/next/2026-06-10/0950-stop-bundle-native-capabilities-placed.md`. Current state lives
in `journal/context/active.md`._

<!-- Append `/next` bridge entries below this line when moving between work sessions mid-thread. -->

### 2026-06-10 — Known-gap follow-up from review riders (Task 9)

- **Same-origin-iframe overlay dismiss gap:** `/dismiss` cannot reach buttons inside iframe overlays — child-frame actions carry no `overlayIndex` and are flagged `actionable` (not `covered`), so the tightened gate correctly excludes them. The old loose gate would have clicked them by accident; the new correct behavior is a known limitation.
- **Fix idea:** treat actions whose `frameId` belongs to a detected overlay iframe as overlay-related — assign them an implicit `overlayIndex` matching the iframe overlay entry so the gate passes.
- **Workaround (current):** for same-origin iframe consent dialogs, click the button directly by ref/selector or use `await-human`. This is already documented in both `api-reference.md` and `agent-playbook.md`.
- **(kind,name) mutation-sensitivity watch-item:** on multi-pane popups where the overlay's label changes between panes, the linked-pick `overlayGone` rule uses (kind,name) from the baseline — if the name mutates, the count check may misjudge. Docs already tell agents to trust `overlaysRemaining` (the raw count) over `dismissed.length` alone; no code change needed unless a real-world failure surfaces.
