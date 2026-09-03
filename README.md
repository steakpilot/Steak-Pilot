# SteakPilot — Expo version

This is the Windows-friendly SteakPilot app. It runs on a physical iPhone through the free Expo Go app and does not require a Mac for development or testing.

## Version 1 status

Phase 1 is complete and the Version 1 engineering-MVP scope is frozen. The professionally supported cooking workflow, field-tested core setup, guidance bands, behavior contract, free/future-Pro boundary, exclusions, and validation boundaries are recorded in [docs/V1_PRODUCT_SPEC.md](docs/V1_PRODUCT_SPEC.md).

Broader cook calibration continues in Phase 2 while production hardening and App Store preparation proceed. The sanity check enforces the frozen choice IDs and supported plan matrix so accidental scope drift fails visibly.

The project intentionally uses Expo SDK 54 because that is the version supported by the public Expo Go app currently distributed through Apple's App Store.

## Product operations

SteakPilot is managed as a durable product project rather than through chat memory alone:

- [Current project state](docs/project/PROJECT_STATE.md)
- [Gate-based roadmap](docs/project/ROADMAP.md)
- [Decision log](docs/project/DECISIONS.md)
- [Validation ledger](docs/project/VALIDATION.md)
- [Business hypotheses](docs/project/BUSINESS.md)
- [Latest handoff](docs/project/HANDOFF.md)

Project-local skills guide normal SteakPilot work and maintain its durable handoff record. A personal `$handoff steakpilot` router creates a fresh task in the saved SteakPilot project and transfers that record. Root instructions in [AGENTS.md](AGENTS.md) tell future Codex tasks when to load the project skills.

## Start it from Windows

Open PowerShell and run:

```powershell
cd "path\to\SteakPilot-Expo"
npx expo start
```

Scan the QR code with the normal iPhone Camera app. Tap the banner to open SteakPilot in Expo Go.

The Windows PC and iPhone should be on the same Wi-Fi network. If the phone cannot connect, stop Expo with `Ctrl+C` and run:

```powershell
npx expo start --tunnel
```

## During development

- Keep the PowerShell window open.
- Save a source file and Expo Go will refresh the app.
- Press `r` in PowerShell to reload manually.
- Press `j` to open the JavaScript debugger.
- Turn off iPhone silent mode before Cook Mode so spoken guidance can be heard.

## Included

- Original SteakPilot visual identity with production app icon, transparent brand mark, native splash, and Android adaptive icon
- Two cook modes: adaptive Chef-Guided Cook and user-built Custom Timer
- Custom Timer with 1–20 rounds, an independently editable timer for every round, voice flip cues, and an editable rest timer
- 15 common beef-steak cuts, including bone-in and thin-cut profiles
- Blue, rare, medium-rare, medium, medium-well, and well-done programs
- Typed thickness and weight in imperial or metric units
- Pan sear, gas grill, charcoal grill, pellet grill, and reverse-sear programs
- Cast iron, stainless steel, carbon steel, and gentler nonstick guidance
- Gas, electric, and induction cooktop adjustments
- Thyme, rosemary, both, or no herbs
- Fat-cap timer when appropriate
- Editable duration for every stage
- Automatic hands-free progression
- Spoken instructions, local alerts, and screen keep-awake
- Pause, Skip, Mute, Target Reached, and prominent contextual Undo controls
- Grouped Undo for repeated +45-second taps, plus separate removal of one queued round
- Context-aware extra 45-second flip rounds that queue behind the active timer and preserve the upcoming temperature checkpoint
- Persistent removal of queued extra rounds before they begin
- Early temperature-check signals and a final cook/rest decision gate
- Offline visual preparation guides and an in-cook side-entry thermometer diagram
- One scheduled pan-basting round followed by conditional guided +45-second rounds
- Explicit 1–2 inch beginner-guided range labels and estimate-only warnings outside it
- Locally saved steak setup
- Active-session recovery: reopening the app restores the running stage, absolute timer deadline, pause/checkpoint state, queued flips, and voice setting
- Automatic stale-alert cleanup when no valid active cooking session exists

## Release sanity check

Run the repeatable plan-engine audit with:

```powershell
npm run sanity
```

It validates every supported cut, doneness, method, pan, cooktop, aromatic, unit system, and representative thickness/weight profile, plus Custom Timer edge cases.

Temperature values and timings are adaptive references. Without a connected probe, the app cannot measure the steak itself. Whole-cut beef is generally recommended by USDA to reach 145°F followed by at least a 3-minute rest; chef doneness targets below that are identified in the setup screen.
