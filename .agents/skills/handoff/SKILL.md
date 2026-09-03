---
name: handoff
description: "Create a durable, evidence-backed SteakPilot handoff between tasks or conversations. Use when the user says /handoff or $handoff, asks to hand off or continue SteakPilot elsewhere, reports lost context, wants a new task to take over, or asks to preserve the current project state before stopping."
---

# SteakPilot Handoff

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
9. Give the user a concise handoff summary. If the user explicitly asks to create or continue another task, use the task-management tools and include the project path plus the contents of `HANDOFF.md` in the follow-up prompt.

## Non-negotiable rules

- Never copy API keys, signing credentials, personal data, or other secrets into handoff files or prompts.
- Distinguish `implemented`, `structurally tested`, `field-tested`, and `broadly validated`.
- Include blockers, risks, failed attempts, and unanswered questions. A handoff is not marketing copy.
- Preserve exact file paths, commands, commit or tag names, and test outcomes when they matter to continuation.
- Do not call work complete merely because context is being handed off.
- Do not create a new task unless the user explicitly requests one.
