# SteakPilot project state

**Updated:** September 3, 2026  
**Status:** Phase 1 complete; Phase 2 ready to begin  
**Product goal:** Build a trusted iOS and Android steak-cooking assistant with evidence-based guidance and a credible path to profitability.  
**Repository:** `https://github.com/markrollinborja/steakpilot`  
**Local path:** `C:\Users\borja\OneDrive\Documents\Mark Projects - App\SteakPilot-Expo`  
**Primary branch:** `main`  
**Latest completed release:** `v1.0.0-phase1`

## Current outcome

The Phase 1 engineering MVP is complete and frozen. It includes Chef-Guided Cook, Custom Timer, offline operation, hands-free speech and notifications, session restoration, recovery controls, beginner preparation guides, and a structurally audited plan engine. The core ribeye/New York strip cast-iron workflow is field-tested by the founder; broad timing accuracy across all supported combinations is not validated.

## Current phase objective

Phase 2 must turn a technically complete MVP into a private-beta product that can credibly enter TestFlight and later App Store review. The priority is evidence and production reliability, not feature expansion.

## Next milestone

Prepare and run the first controlled private-beta cycle:

1. Define the cook-test matrix and result-capture format.
2. Add privacy-conscious event instrumentation only for the questions Phase 2 needs answered.
3. Complete production identity, legal/support surfaces, signing, and standalone iPhone build preparation.
4. Recruit a small beginner cohort and run observed first-cook usability tests.
5. Use results to calibrate or narrow claims before store submission.

## Evidence boundary

- **Implemented:** Phase 1 product scope in `docs/V1_PRODUCT_SPEC.md`.
- **Structurally tested:** 302,400 generated plans, manual-timer edge cases, TypeScript, Expo Doctor, iOS export, and GitHub Actions as recorded at Phase 1 completion.
- **Field-tested:** Founder cooks using the core ribeye/New York strip cast-iron workflow plus physical-iPhone timer and recovery tests.
- **Broadly validated:** Not yet achieved.

## Active risks

- Cooking accuracy outside the founder's core setup is based on professional-method support and adaptive estimates rather than controlled product data.
- The app currently lacks a documented private-beta dataset and beginner usability evidence.
- Store production requirements, privacy disclosures, support pages, signing, and listing assets still require completion and current-policy verification.
- Retention and willingness to pay are unmeasured; profitability is a goal, not yet a demonstrated outcome.

## Durable sources

- Frozen Phase 1 scope: `docs/V1_PRODUCT_SPEC.md`
- Chef-method evidence: `docs/CHEF_METHOD_AUDIT.md`
- Phase sequencing: `docs/project/ROADMAP.md`
- Material decisions: `docs/project/DECISIONS.md`
- Validation evidence: `docs/project/VALIDATION.md`
- Business hypotheses: `docs/project/BUSINESS.md`
- Latest transfer snapshot: `docs/project/HANDOFF.md`
