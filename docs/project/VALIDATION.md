# SteakPilot validation ledger

This ledger records evidence, not confidence. New entries must identify the build or commit, setup, procedure, result, and limitations whenever available.

## Evidence levels

- **Implemented:** Code or content exists.
- **Structurally tested:** Automated or deterministic checks verify internal behavior.
- **Field-tested:** A real device or real cook exercised a stated setup.
- **Broadly validated:** Repeated representative users and setups meet predefined success thresholds. SteakPilot has not reached this level.

## Current evidence

| Date | Area | Level | Evidence | Boundary |
| --- | --- | --- | --- | --- |
| 2026-09-01 | Plan engine | Structurally tested | Sanity audit passed 302,400 supported guided combinations plus manual-timer edge cases | Does not prove doneness accuracy |
| 2026-09-01 | Build quality | Structurally tested | TypeScript, Expo Doctor, iOS export, and GitHub Actions passed for Phase 1 | Does not replace App Store production signing or device coverage |
| 2026-09-01 | Session reliability | Field-tested | Physical iPhone testing covered restoration, stale-notification cleanup, queued flips, grouped Undo, voice controls, and launch-screen corrections | Founder/device coverage only |
| 2026-09-01 | Core cooking method | Field-tested | Founder reported successful ribeye and New York strip cooks on the familiar cast-iron setup | Informal sample; not a controlled multi-user calibration |
| 2026-09-01 | Professional method support | Research support | Structured audit of 55 named chefs, meat specialists, and culinary teachers | Literature support is not product field validation |
| 2026-09-03 | Project operations | Structurally tested | Both project-local skills passed validation; TypeScript and the 302,400-plan sanity audit also passed after the operating files were added | Verifies continuity infrastructure, not app-store or cook accuracy |

## Phase 2 data requirement

Each controlled cook should record, when practical:

- app version and anonymous test ID;
- cut, thickness, weight, doneness, starting condition, and steak geometry notes;
- method, pan or grill, cooktop, pan size, and observable heat cue;
- actual timestamps for each stage and every manual intervention;
- thermometer model, calibration result, probe method, and lowest readings from multiple locations;
- pull temperature and one-minute carryover readings;
- final result using temperature, texture, juiciness, and a consistently lit slice photo;
- whether the cook understood each instruction and where live help was needed;
- defects, safety overrides, outcome rating, and whether the user would cook with SteakPilot again.

## Evidence still required before public-launch confidence

- A predefined launch matrix with sufficient repeated controlled cooks.
- Observed beginner cooks without live founder coaching.
- Representative iPhone/device and iOS-version coverage.
- TestFlight installation, update, background, notification, speech, and crash evidence.
- Verified privacy/support/listing materials and App Store review readiness.
- Baseline activation, completion, repeat-use, and outcome-feedback metrics.
