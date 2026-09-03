# SteakPilot decision log

Record decisions that materially affect product scope, user safety, architecture, release, validation, or monetization. Append new entries; if a decision changes, mark the old entry superseded and link the replacement.

## D-001 — Freeze the Phase 1 feature boundary

**Date:** September 1, 2026  
**Status:** Active

Phase 1 is the completed engineering MVP described in `docs/V1_PRODUCT_SPEC.md`. New proteins, connected thermometers, accounts, watch surfaces, simultaneous steaks, and monetization remain out of scope until validation supports expansion.

**Reason:** A narrower product can be tested and trusted more quickly than a broad feature set with weak evidence.

## D-002 — Use evidence-tier language

**Date:** September 1, 2026  
**Status:** Active

All product reporting must distinguish implemented, structurally tested, field-tested, and broadly validated behavior.

**Reason:** Passing software tests proves plan structure and reliability, not universal cooking accuracy.

## D-003 — Keep time predictive rather than absolute

**Date:** September 1, 2026  
**Status:** Active

Generated timing is a prediction; correctly measured temperature is verification; darkening crust, burning butter, smoke, and firmness are override signals; real cook outcomes provide calibration data. SteakPilot must not guarantee doneness.

**Reason:** Steak geometry, starting condition, equipment, probe technique, and heat input vary materially.

## D-004 — Keep the core V1 flow free during validation

**Date:** September 1, 2026  
**Status:** Active

Do not place the existing safe cooking flow behind a paywall during Phase 2. Test future paid value around personalization and convenience after activation and retention can be measured.

**Reason:** Charging before demonstrating repeat value would obscure the main product risk and reduce learning.

## D-005 — Operate SteakPilot as a durable project

**Date:** September 3, 2026  
**Status:** Active

Use project-local product and handoff skills plus version-controlled state, roadmap, validation, business, and handoff documents. Chat history is context, not the durable source of truth.

**Reason:** The product now spans engineering, cooking evidence, store release, and business development; informal chat memory is no longer adequate.
