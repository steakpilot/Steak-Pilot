---
name: steakpilot-handoff-record
description: "Maintain SteakPilot's durable, evidence-backed transfer record before work moves between tasks or conversations. Use when updating project state for a handoff, recovering lost SteakPilot context, or preparing verified continuation context; this skill records state but does not create the new Codex task."
---

# SteakPilot Handoff Record

Preserve enough verified state that another agent can continue without reconstructing the project from chat history.

## Procedure

1. Read `../../../docs/project/PROJECT_STATE.md` and `../../../docs/project/HANDOFF.md` completely.
2. Read `../../../docs/project/ROADMAP.md`, `../../../docs/project/DECISIONS.md`, and `../../../docs/project/VALIDATION.md` when the active work touches their contents.
3. Inspect the current Git branch, working tree, recent commits, and relevant changed files. Never assume a change is committed, pushed, tested, or released.
4. Reconcile the durable state with repository evidence and the current conversation. Resolve contradictions in favor of repository evidence, then note any remaining uncertainty.
5. Update `PROJECT_STATE.md` and replace `HANDOFF.md` using the format in `references/handoff-format.md`.
6. Update the decision or validation ledger if the current work created material evidence or a durable decision.
7. Run checks proportionate to the changes. Record exact results; do not convert a structural test into a field-validation claim.
8. Commit or push only when the user requested it or it is an ordinary authorized completion step for the active implementation. Otherwise identify uncommitted work explicitly.
9. Give the caller a concise verified handoff summary suitable for the personal `$handoff` router or another receiving task.

## Non-negotiable rules

- Never copy API keys, signing credentials, personal data, or other secrets into handoff files or prompts.
- Distinguish `implemented`, `structurally tested`, `field-tested`, and `broadly validated`.
- Include blockers, risks, failed attempts, and unanswered questions. A handoff is not marketing copy.
- Preserve exact file paths, commands, commit or tag names, and test outcomes when they matter to continuation.
- Do not call work complete merely because context is being handed off.
- Do not create a new task. The personal `$handoff` router owns task creation.
