# SteakPilot handoff format

Replace `docs/project/HANDOFF.md` with a current snapshot using these sections:

1. **Handoff metadata** — update date, project path, repository, branch, release tag, and working-tree state.
2. **Current outcome** — one short paragraph describing the latest verified product state.
3. **Completed in this work period** — concrete changes and decisions, each paired with its evidence.
4. **Verification performed** — exact checks and results, separated into software, device, cooking, and store validation.
5. **Open risks and blockers** — unresolved issues ordered by user or launch impact.
6. **Next actions** — no more than five ordered actions, with a measurable completion condition for each.
7. **Files to read first** — the minimum set required to continue.
8. **Continuation prompt** — a self-contained prompt for a fresh task. It must tell the receiving agent to read `AGENTS.md` and `docs/project/PROJECT_STATE.md` before acting.

Keep the file concise. Link to the durable ledgers rather than duplicating their full contents.
