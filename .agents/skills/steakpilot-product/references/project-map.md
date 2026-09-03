# SteakPilot project map

Read only the sources needed for the active request.

| Request | Required sources |
| --- | --- |
| Current status or next work | `docs/project/PROJECT_STATE.md`, `docs/project/ROADMAP.md` |
| Guided-cook scope or behavior | `docs/V1_PRODUCT_SPEC.md`, relevant `src/` files |
| Timing, doneness, thermometer, or chef-method claim | `docs/CHEF_METHOD_AUDIT.md`, `docs/project/VALIDATION.md`, current primary research when needed |
| Architecture, dependency, or implementation | `package.json`, relevant source/tests, `AGENTS.md` |
| Release or store submission | `docs/project/ROADMAP.md`, `docs/project/VALIDATION.md`, `CHANGELOG.md`, current official Apple/Google/Expo documentation |
| Pricing, growth, market, or profitability | `docs/project/BUSINESS.md`, `docs/project/DECISIONS.md`, current sourced market evidence |
| Handoff record or lost conversation | `.agents/skills/steakpilot-handoff-record/SKILL.md`, `docs/project/HANDOFF.md` |

The Git repository is the implementation source of truth. `PROJECT_STATE.md` is the current operating summary. `V1_PRODUCT_SPEC.md` is the frozen Phase 1 scope. A conversation is never the only durable record of a material decision.
