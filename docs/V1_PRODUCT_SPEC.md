# SteakPilot Version 1 Product Specification

**Status:** IMPLEMENTATION FROZEN; COOKING VALIDATION OPEN  
**Updated on:** September 1, 2026  
**Phase 1:** CODE COMPLETE; REAL-COOK ACCEPTANCE PENDING

This document is the authoritative scope for SteakPilot Version 1. A behavior is not part of V1 unless it is listed here. Changes require an explicit product decision, an update to this document, and passing release checks.

## Product promise

SteakPilot guides a home cook, hands-free, from a measured raw beef steak through cooking and resting with clear timers, spoken instructions, background alerts, and recovery controls.

SteakPilot provides adaptive timing and temperature references. It does not sense the steak, control cooking equipment, or guarantee doneness.

## Target user and primary job

- A home cook preparing one whole-muscle beef steak.
- The user wants a repeatable plan based on the steak and equipment in front of them.
- The steak is fully thawed in the refrigerator and rested out for 20–30 minutes while the cook prepares.
- During cooking, the user should normally need only to listen and follow the current instruction.
- Manual controls remain available when the steak progresses faster or slower than the plan.

## V1 cook modes

### Chef-Guided Cook

The user selects the steak and equipment, reviews an automatically generated sequence, optionally adjusts individual timers, and starts a hands-free cook.

Supported inputs are frozen as follows:

- **Cuts (15):** Ribeye, Bone-In Ribeye, Tomahawk, New York Strip, Filet Mignon, Top Sirloin, T-Bone, Porterhouse, Flat Iron, Denver / Chuck Eye, Picanha, Hanger, Flank, Skirt, and Tri-Tip Steak.
- **Doneness (6):** Blue, Rare, Medium-Rare, Medium, Medium-Well, and Well-Done.
- **Methods (5):** Pan Sear, Gas Grill, Charcoal Grill, Pellet Grill, and Reverse Sear.
- **Pans (4):** Cast Iron, Stainless Steel, Carbon Steel, and Nonstick.
- **Cooktops (3):** Gas, Electric, and Induction.
- **Aromatics (4):** Thyme, Rosemary, Both, and No Herbs.
- **Units (2):** Imperial and Metric.
- **Engine input range:** 0.5–3 inches, displayed as inches or centimeters.
- **Beginner-guided thickness range:** 1–2 inches. Pan searing above 1.5 inches is labeled estimate-only and recommends reverse searing.
- **Weight:** 3–64 ounces, displayed as ounces or grams.

The generated sequence may include fat-cap rendering, first-side sears, scheduled flips, heat reduction, butter and aromatics, basting, direct or indirect grilling, reverse-sear transitions, temperature-reference checkpoints, a final decision gate, and resting. Pan plans schedule one basting round; further basting is conditional through guided 45-second rounds at the checkpoint.

### Custom Timer

The user creates a manual cooking sequence without doneness calculation.

- 1–20 cooking rounds.
- Each cooking round is 5–900 seconds.
- Round 1 starts on Side A; every later round announces a flip.
- The rest timer is 30–1,800 seconds.
- Voice guidance and background alerts use the same Cook Mode as Guided Cook.

## Cook Mode behavior contract

- The active instruction, remaining time, and next instruction are always visible.
- The screen remains awake during an active session.
- Voice guidance is on by default and can be muted.
- Stages advance automatically from absolute deadlines rather than accumulated one-second ticks.
- Local notifications announce upcoming actions when permission is granted.
- Denying notification permission does not block cooking; the app explains the limitation before starting.
- **Pause / Resume** preserves the remaining time and recalculates alerts.
- **Skip** advances to the contextually correct stage: the next stage, basting, final sear, resting, or completion.
- **Target Reached** immediately begins the rest stage when one exists.
- **Queue Flip +45** waits for the active timer to finish, then inserts a 45-second flip round carrying the current checkpoint guidance.
- Up to 10 extra flip rounds may be queued. The newest queued round can be removed before it begins.
- At the final cooking checkpoint, the user chooses to rest or start another 45-second flip/cook round.
- Contextual Undo is available for 15 seconds after supported manual actions.
- Ending or completing a session cancels its scheduled cooking notifications.

## Recovery and local data contract

- No account or internet connection is required.
- Steak setup, Custom Timer setup, and an active cook session are stored only on the device.
- Reopening the app restores a valid active stage, deadline, paused/checkpoint state, queued flips, and voice setting.
- If time elapsed while the app was closed, Cook Mode catches up to the correct stage.
- An invalid or unpaused session older than 12 hours is discarded and stale alerts are cancelled.

## V1 user-facing boundaries

- No temperature entry is required.
- Temperature values are spoken verification checkpoints; SteakPilot does not require temperature entry or communicate with an ordinary thermometer.
- V1 timings use a fully refrigerator-thawed steak rested out for 20–30 minutes while preparation is completed. “Room temperature” is not used as a specification because it is ambiguous.
- Frozen, partially frozen, counter-thawed, or differently tempered steaks are outside the validated V1 timing baseline.
- Thickness is the primary measurement input; the user is instructed to measure the thickest point.
- Before cooking, offline visual guides show thickness measurement, surface drying, fat-cap orientation, shimmering oil, foaming butter, and side-entry thermometer placement.
- At temperature checkpoints, the user is instructed to lift the steak, insert from the side just beyond center, withdraw slowly for the lowest stable reading, and avoid fat, bone, and gristle.
- Time is a prediction, correctly measured temperature is verification, and blackening crust or dark/smoking butter overrides the timer.
- Nonstick plans avoid instructing an empty high-heat preheat.
- Pan-sear preparation standardizes a thin film of neutral high-smoke-point oil and uses visible shimmering as the readiness cue instead of assuming every stove reaches the same heat after a fixed time.
- Chef doneness targets below USDA consumer guidance are identified in the setup flow.
- Manual Timer never claims to calculate doneness.

## V1 business boundary

All functionality listed in this document remains available without an account or paywall during V1 validation.

Potential future Pro functionality is not part of V1 and may include personal stove/pan calibration, cook history, saved equipment profiles, simultaneous steaks, cloud sync, household sharing, watch experiences, and connected-probe integration. No existing V1 function will be moved behind a paywall without a separate monetization decision before public release.

## Explicitly out of scope

- Chicken, pork, fish, roasts, burgers, or other proteins.
- Automatic temperature sensing or Bluetooth probe support.
- Guaranteed doneness claims.
- User accounts, cloud storage, social features, or recipe feeds.
- AI chat or generated recipes.
- Multiple simultaneous guided cooks.
- Personal calibration or post-cook learning.
- Apple Watch, Live Activities, widgets, or CarPlay.
- Subscriptions, purchases, advertisements, or a paywall.
- Public Android-store launch work; Android follows validation of the iPhone product.

## Acceptance criteria

The implementation is complete only while all of the following are true:

1. Guided Cook and Custom Timer can each reach a completed rest stage.
2. Every supported input combination generates a structurally valid plan.
3. The frozen choice IDs and counts cannot change without failing the sanity check.
4. TypeScript compilation passes without errors.
5. Expo Doctor passes all checks applicable to the installed SDK.
6. The iOS JavaScript bundle exports successfully.
7. The product remains usable offline and without an account.

Phase 1 cooking validation is not complete until the defined 1–2 inch beginner-guided range has controlled real-cook coverage across its launch cuts, methods, equipment, and doneness targets, followed by observed beginner usability cooks. Passing software tests proves structural correctness; it does not prove doneness accuracy.

## Change-control rule

Bug fixes, accessibility improvements, safety corrections, copy clarification, performance work, release infrastructure, analytics, legal pages, and App Store assets may proceed without expanding product scope.

New cooking modes, proteins, integrations, account systems, paid features, or major workflow changes stay in the backlog until validation is complete. Any exception must update this specification first.
