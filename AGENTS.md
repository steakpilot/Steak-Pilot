# SteakPilot project rules

SteakPilot is a product project whose long-term goal is a profitable, trusted iOS and Android cooking assistant. The durable project state lives in `docs/project/PROJECT_STATE.md`; do not rely on chat memory as the source of truth.

For every SteakPilot product, engineering, culinary-method, validation, release, store, growth, pricing, or monetization request, read and follow `.agents/skills/steakpilot-product/SKILL.md` before acting.

When the user says `/handoff` or `$handoff`, asks to hand off or continue the project elsewhere, reports lost chat context, or asks to preserve the current state, also read and follow `.agents/skills/handoff/SKILL.md`.

- The project currently targets Expo SDK 54. Before changing Expo APIs or dependencies, consult the exact installed SDK documentation and run Expo Doctor.
- Before a release commit, run TypeScript compilation, the full plan-engine sanity audit, Expo Doctor, and an iOS export.
- Preserve the distinction between implemented, structurally tested, field-tested, and broadly validated behavior.
- Treat generated cooking time as a prediction, correctly measured temperature as verification, sensory danger cues as immediate overrides, and real cook results as calibration data.
- Never claim guaranteed doneness or broaden the beginner-validated range without evidence.
- Record material scope, safety, architecture, release, and monetization decisions in `docs/project/DECISIONS.md`.
- Update the project state and relevant ledger after completing a meaningful milestone; keep speculative ideas separate from committed scope.
