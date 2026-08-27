import { CookingPlan, CookingStep, DEFAULT_SETTINGS, ManualTimerSettings } from './types';

function safeSeconds(seconds: number, minimum = 5, maximum = 900) {
  const normalized = Number.isFinite(seconds) ? Math.round(seconds) : minimum;
  return Math.max(minimum, Math.min(maximum, normalized));
}

export function makeManualCookingPlan(settings: ManualTimerSettings): CookingPlan {
  const rounds = settings.roundSeconds.length ? settings.roundSeconds : [45];
  const steps: CookingStep[] = rounds.map((seconds, index) => ({
    id: `manual-round-${index + 1}`,
    title: index === 0 ? 'Start First Side' : `Flip Round ${index}`,
    instruction:
      index === 0
        ? 'Place the steak on Side A. Follow your own heat and doneness plan.'
        : `Flip the steak now. This is your custom flip ${index}.`,
    durationSeconds: safeSeconds(seconds),
    phase: index === 0 ? ('sear' as const) : ('flip' as const),
    skipTarget: 'next' as const,
    icon: index === 0 ? 'Ⓐ' : '🔄',
  }));

  steps.push({
    id: 'manual-rest',
    title: 'Rest Steak',
    instruction: 'Remove the steak from the heat and rest it for your selected time.',
    durationSeconds: safeSeconds(settings.restSeconds, 30, 1_800),
    phase: 'rest',
    skipTarget: 'next',
    icon: '⏸',
  });

  return {
    name: 'Custom Steak Timer',
    settings: DEFAULT_SETTINGS,
    steps,
    advisory:
      'You control every round in Custom Timer. SteakPilot announces each flip and keeps time, but it does not calculate doneness or temperature checkpoints in this mode.',
  };
}
