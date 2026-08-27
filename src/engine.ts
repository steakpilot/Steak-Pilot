import {
  AromaticId,
  CookingPlan,
  CookingStep,
  DonenessId,
  SteakSettings,
  TemperatureCue,
  SkipTarget,
  cookingMethodLabel,
  cutLabel,
  cutProfile,
  donenessLabel,
  panLabel,
} from './types';

export interface TemperatureProfile {
  preSear: string;
  baste: string;
  pull: string;
  finish: string;
  belowUSDA: boolean;
}

export interface GuidanceTier {
  label: string;
  detail: string;
  level: 'core' | 'guided' | 'estimate';
}

export const TEMPERATURES: Record<DonenessId, TemperatureProfile> = {
  blue: { preSear: '90–95°F', baste: '95–100°F', pull: '105–108°F', finish: '110–115°F', belowUSDA: true },
  rare: { preSear: '100–105°F', baste: '100–108°F', pull: '115–122°F', finish: '120–130°F', belowUSDA: true },
  mediumRare: { preSear: '108–115°F', baste: '108–115°F', pull: '123–128°F', finish: '130–135°F', belowUSDA: true },
  medium: { preSear: '118–125°F', baste: '118–125°F', pull: '133–138°F', finish: '138–145°F', belowUSDA: true },
  mediumWell: { preSear: '130–135°F', baste: '130–135°F', pull: '143–148°F', finish: '148–155°F', belowUSDA: false },
  well: { preSear: '140–145°F', baste: '140–145°F', pull: '153–158°F', finish: '158°F+', belowUSDA: false },
};

const DONENESS_RANK: Record<DonenessId, number> = {
  blue: 0,
  rare: 1,
  mediumRare: 2,
  medium: 3,
  mediumWell: 4,
  well: 5,
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function roundToFive(value: number) {
  return Math.round(value / 5) * 5;
}

function aromaticSpokenName(aromatic: AromaticId) {
  if (aromatic === 'both') return 'thyme and rosemary';
  if (aromatic === 'none') return '';
  return aromatic;
}

function makeStep(
  id: string,
  title: string,
  instruction: string,
  durationSeconds: number,
  phase: CookingStep['phase'],
  icon: string,
  options: {
    temperatureReference?: string;
    temperatureCue?: TemperatureCue;
    skipTarget?: SkipTarget;
    requiresDecisionBeforeNext?: boolean;
  } = {},
): CookingStep {
  return { id, title, instruction, durationSeconds, phase, icon, ...options };
}

function panTimingFactor(settings: SteakSettings) {
  const panFactor = {
    castIron: 1,
    stainless: 1.04,
    carbonSteel: 1.02,
    nonstick: 1.18,
  }[settings.pan];
  const cooktopFactor = { gas: 1, electric: 1.06, induction: 0.96 }[settings.cooktop];
  const weightFactor = settings.weightOunces >= 28 ? 1.1 : settings.weightOunces >= 20 ? 1.05 : settings.weightOunces <= 10 ? 0.95 : 1;
  return panFactor * cooktopFactor * weightFactor * cutProfile(settings.cut).timeFactor;
}

function baseSearSeconds(thickness: number) {
  if (thickness <= 0.75) return 45;
  if (thickness <= 1) return 60;
  if (thickness <= 1.25) return 70;
  if (thickness <= 1.5) return 75;
  if (thickness <= 1.75) return 85;
  if (thickness <= 2) return 95;
  return 110;
}

function flipInterval(thickness: number) {
  if (thickness <= 1) return 30;
  if (thickness <= 1.75) return 45;
  return 60;
}

function herbIngredients(settings: SteakSettings) {
  const herb = aromaticSpokenName(settings.aromatic);
  return herb
    ? `two tablespoons of unsalted butter, garlic, and ${herb}`
    : 'two tablespoons of unsalted butter and garlic';
}

function addRest(steps: CookingStep[], settings: SteakSettings, temperatures: TemperatureProfile) {
  const restSeconds = DONENESS_RANK[settings.doneness] <= 1 ? 5 * 60 : DONENESS_RANK[settings.doneness] >= 4 ? 8 * 60 : 7 * 60;
  steps.push(
    makeStep(
      'rest',
      'Rest the Steak',
      `Remove the steak from the heat and rest it whole. Expected finish: ${temperatures.finish}.`,
      restSeconds,
      'rest',
      '⏱️',
      { temperatureReference: temperatures.finish },
    ),
  );
}

function makeThinPanPlan(settings: SteakSettings, temperatures: TemperatureProfile) {
  const steps: CookingStep[] = [];
  const factor = panTimingFactor(settings);
  const sideSeconds = roundToFive(clamp(baseSearSeconds(settings.thickness) * factor, 30, 90));
  const extraCycles = Math.max(0, DONENESS_RANK[settings.doneness] - 1);
  const interval = 30;

  steps.push(
    makeStep('side-a', 'Sear Side A', 'Lay the steak flat in the pan and build the first crust.', sideSeconds, 'sear', 'Ⓐ'),
    makeStep(
      'side-b',
      'Sear Side B',
      `Flip the steak. Begin checking the center; the pull reference is ${temperatures.pull}.`,
      sideSeconds,
      'sear',
      'Ⓑ',
      { temperatureReference: temperatures.pull, temperatureCue: 'pull', skipTarget: 'rest', requiresDecisionBeforeNext: extraCycles === 0 },
    ),
  );

  for (let index = 1; index <= extraCycles; index += 1) {
    steps.push(
      makeStep(
        `quick-flip-${index}`,
        `Quick Flip ${index}`,
        `Flip and check the thickest center. Pull at ${temperatures.pull}.`,
        interval,
        'flip',
        '🔄',
        {
          temperatureReference: temperatures.pull,
          temperatureCue: 'pull',
          skipTarget: 'rest',
          requiresDecisionBeforeNext: index === extraCycles,
        },
      ),
    );
  }
  addRest(steps, settings, temperatures);
  return steps;
}

function makePanPlan(settings: SteakSettings, temperatures: TemperatureProfile) {
  const cut = cutProfile(settings.cut);
  if (cut.style === 'thin' || settings.thickness <= 0.65) return makeThinPanPlan(settings, temperatures);

  const steps: CookingStep[] = [];
  const factor = panTimingFactor(settings);
  const sideSeconds = roundToFive(clamp(baseSearSeconds(settings.thickness) * factor, 40, 125));
  const interval = flipInterval(settings.thickness);
  const ingredients = herbIngredients(settings);
  const highCycles = settings.thickness > 1.75 ? 3 : 2;
  const gentleByDoneness: Record<DonenessId, number> = {
    blue: 0,
    rare: 0,
    mediumRare: 0,
    medium: 2,
    mediumWell: 5,
    well: 7,
  };
  const thicknessAdjustment = settings.thickness >= 2 ? 1 : 0;
  const gentleCycles = gentleByDoneness[settings.doneness] + thicknessAdjustment + (cut.boneIn ? 1 : 0);
  const totalCycles = highCycles + gentleCycles;

  if (cut.hasFatCap) {
    const fatSeconds = settings.thickness >= 1.25 || settings.weightOunces >= 16 ? 60 : 45;
    steps.push(
      makeStep('fat-cap', 'Render Fat Cap', 'Hold the steak upright with the fat cap against the pan.', fatSeconds, 'fatCap', '🔥'),
    );
  }

  const panHeat = settings.pan === 'nonstick' ? 'medium' : 'medium-high';
  steps.push(
    makeStep('side-a', 'Sear Side A', `Lay Side A flat in the ${panHeat} pan. Leave it undisturbed.`, sideSeconds, 'sear', 'Ⓐ'),
    makeStep('side-b', 'Sear Side B', `Flip to Side B and continue over ${panHeat} heat.`, sideSeconds, 'sear', 'Ⓑ'),
  );

  for (let index = 0; index < totalCycles; index += 1) {
    if (index === highCycles) {
      steps.push(
        makeStep(
          'lower-heat',
          'Lower the Heat',
          'The crust is established. Lower the heat to medium-low and keep the butter out for now.',
          10,
          'transition',
          '🔥',
        ),
      );
    }
    const checkNow = index >= Math.max(0, totalCycles - 2);
    const gentle = index >= highCycles;
    steps.push(
      makeStep(
        `pre-baste-flip-${index + 1}`,
        gentle ? `Gentle Flip ${index - highCycles + 1}` : `Crust Flip ${index + 1}`,
        checkNow
          ? `Flip now. During the final 15 seconds, check the center from the side. Start butter-basting at ${temperatures.baste}.`
          : gentle
            ? 'Flip over medium-low heat. Do not add butter yet.'
            : 'Flip the steak and continue building an even crust.',
        interval,
        'flip',
        '🔄',
        checkNow
          ? { temperatureReference: temperatures.baste, temperatureCue: 'baste', skipTarget: 'baste' }
          : {},
      ),
    );
  }

  if (gentleCycles === 0) {
    steps.push(
      makeStep(
        'lower-heat',
        'Lower the Heat',
        'The crust is established. Lower the heat to medium-low before adding butter.',
        10,
        'transition',
        '🔥',
      ),
    );
  }

  steps.push(
    makeStep(
      'add-butter',
      'Add Butter & Aromatics',
      `Keep the heat at medium-low. Add ${ingredients}. Let the butter foam.`,
      20,
      'transition',
      '🧈',
      { temperatureReference: temperatures.baste },
    ),
  );

  // One basting round is scheduled. More heat is conditional at the checkpoint,
  // because butter, pan heat, and steak geometry vary too much for blind rounds.
  const basteCycles = 1;
  for (let index = 1; index <= basteCycles; index += 1) {
    const startChecking = true;
    const finalCycle = index === basteCycles;
    steps.push(
      makeStep(
        `baste-${index}`,
        `Baste & Flip ${index}`,
        startChecking
          ? `Baste with foaming butter. Flip as guided, then lift the steak and check the center from the side. Pull at ${temperatures.pull}.`
          : 'Baste continuously with the foaming butter. Flip when this timer ends.',
        interval,
        'baste',
        '🥄',
        startChecking
          ? {
              temperatureReference: temperatures.pull,
              temperatureCue: 'pull',
              skipTarget: 'rest',
              requiresDecisionBeforeNext: finalCycle,
            }
          : { requiresDecisionBeforeNext: finalCycle },
      ),
    );
  }

  addRest(steps, settings, temperatures);
  return steps;
}

function grillEstimateSeconds(settings: SteakSettings) {
  const thickness = settings.thickness;
  const mediumBaseline = thickness <= 0.75 ? 5 * 60 : thickness <= 1 ? 7 * 60 : thickness <= 1.25 ? 10 * 60 : thickness <= 1.5 ? 14 * 60 : thickness <= 2 ? 17 * 60 : 22 * 60;
  const donenessFactor: Record<DonenessId, number> = {
    blue: 0.62,
    rare: 0.74,
    mediumRare: 0.88,
    medium: 1,
    mediumWell: 1.15,
    well: 1.3,
  };
  const methodFactor = settings.cookingMethod === 'charcoalGrill' ? 0.96 : settings.cookingMethod === 'pelletGrill' ? 1.12 : 1;
  return roundToFive(mediumBaseline * donenessFactor[settings.doneness] * methodFactor * cutProfile(settings.cut).timeFactor);
}

function makeGrillPlan(settings: SteakSettings, temperatures: TemperatureProfile) {
  const steps: CookingStep[] = [];
  const total = grillEstimateSeconds(settings);
  const thick = settings.thickness > 1.5;
  const directSide = thick ? 120 : roundToFive(clamp(total * 0.22, 60, 150));
  const interval = thick ? 120 : 60;
  const methodName = cookingMethodLabel(settings.cookingMethod).toLowerCase();

  steps.push(
    makeStep('grill-side-a', 'Grill Side A', `Place Side A over the hot zone of the ${methodName}. Close the lid if appropriate.`, directSide, 'sear', 'Ⓐ'),
    makeStep('grill-side-b', 'Grill Side B', 'Flip to a fresh hot area of the grill.', directSide, 'sear', 'Ⓑ'),
  );

  const remaining = Math.max(interval, total - directSide * 2);
  const cycles = Math.max(1, Math.ceil(remaining / interval));
  for (let index = 1; index <= cycles; index += 1) {
    const checkNow = index >= Math.max(1, cycles - 1);
    const finalCycle = index === cycles;
    steps.push(
      makeStep(
        `grill-finish-${index}`,
        thick ? `Indirect Finish ${index}` : `Grill Flip ${index}`,
        checkNow
          ? `Check the thickest center now. Pull at ${temperatures.pull}.`
          : thick
            ? 'Move to indirect heat and close the lid. Turn when this timer ends.'
            : 'Flip to a fresh section of the grate for even cooking.',
        interval,
        thick ? 'indirect' : 'flip',
        thick ? '♨️' : '🔄',
        checkNow
          ? {
              temperatureReference: temperatures.pull,
              temperatureCue: 'pull',
              skipTarget: 'rest',
              requiresDecisionBeforeNext: finalCycle,
            }
          : { requiresDecisionBeforeNext: finalCycle },
      ),
    );
  }

  addRest(steps, settings, temperatures);
  return steps;
}

function makeReverseSearPlan(settings: SteakSettings, temperatures: TemperatureProfile) {
  const steps: CookingStep[] = [];
  const cut = cutProfile(settings.cut);
  const donenessFactor = 0.8 + DONENESS_RANK[settings.doneness] * 0.11;
  const estimatedOvenSeconds = clamp(roundToFive(12 * settings.thickness * settings.thickness * 60 * donenessFactor * cut.timeFactor), 15 * 60, 65 * 60);
  const checkWindow = 6 * 60;
  const initialOven = Math.max(8 * 60, estimatedOvenSeconds - checkWindow);
  const ingredients = herbIngredients(settings);
  const nonstickFinish = settings.pan === 'nonstick';

  steps.push(
    makeStep(
      'reverse-oven',
      'Gentle Oven Cook',
      'Place the steak on a rack in a 225°F oven. Let the center rise slowly and evenly.',
      initialOven,
      'indirect',
      '♨️',
    ),
    makeStep(
      'reverse-check-1',
      'Check Before Searing',
      `Check the center now. Begin the final sear at ${temperatures.preSear}.`,
      3 * 60,
      'indirect',
      '🌡️',
      { temperatureReference: temperatures.preSear, temperatureCue: 'preSear', skipTarget: 'sear' },
    ),
    makeStep(
      'reverse-check-2',
      'Recheck Center',
      `Recheck the center. Begin the final sear at ${temperatures.preSear}.`,
      3 * 60,
      'indirect',
      '🌡️',
      { temperatureReference: temperatures.preSear, temperatureCue: 'preSear', skipTarget: 'sear' },
    ),
    makeStep(
      'prepare-final-sear',
      'Heat the Searing Pan',
      nonstickFinish
        ? 'Remove the steak from the oven. Add a thin film of high-smoke-point oil to the nonstick pan, then heat it over medium heat. Do not preheat it empty.'
        : `Remove the steak from the oven. Heat the ${panLabel(settings.pan).toLowerCase()} pan for the final sear, then add a thin film of neutral high-smoke-point oil.`,
      nonstickFinish ? 90 : settings.pan === 'castIron' ? 3 * 60 : 2 * 60,
      'transition',
      '🔥',
    ),
    makeStep(
      'reverse-sear-a',
      'Final Sear Side A',
      nonstickFinish ? 'Sear Side A over medium heat without overheating the pan.' : 'Sear Side A over high heat.',
      nonstickFinish ? 60 : 45,
      'sear',
      'Ⓐ',
    ),
    makeStep('reverse-sear-b', 'Final Sear Side B', 'Flip and sear Side B.', nonstickFinish ? 60 : 45, 'sear', 'Ⓑ'),
  );

  steps.push(
    makeStep(
      'reverse-lower-heat',
      'Lower the Heat',
      'The final crust is established. Lower the heat to medium-low.',
      10,
      'transition',
      '🔥',
    ),
    makeStep(
      'reverse-add-butter',
      'Quick Butter Finish',
      `Keep the heat at medium-low. Add ${ingredients}.`,
      20,
      'transition',
      '🧈',
    ),
    makeStep(
      'reverse-baste',
      'Baste & Check',
      `Baste briefly and check the center. Pull at ${temperatures.pull}.`,
      30,
      'baste',
      '🥄',
      {
        temperatureReference: temperatures.pull,
        temperatureCue: 'pull',
        skipTarget: 'rest',
        requiresDecisionBeforeNext: true,
      },
    ),
  );

  addRest(steps, settings, temperatures);
  return steps;
}

export function getTemperatureProfile(doneness: DonenessId) {
  return TEMPERATURES[doneness];
}

export function getGuidanceTier(settings: SteakSettings): GuidanceTier {
  const inBeginnerRange = settings.thickness >= 1 && settings.thickness <= 2;
  const coreCut = settings.cut === 'ribeyeBoneless' || settings.cut === 'strip';
  const coreEquipment = settings.cookingMethod === 'pan' && settings.pan === 'castIron' && settings.cooktop === 'gas';

  if (!inBeginnerRange) {
    return {
      label: 'Experimental timing estimate',
      detail: 'Outside the 1–2 inch beginner-guided range. Use temperature and visible cooking cues; do not rely on time alone.',
      level: 'estimate',
    };
  }
  if (settings.cookingMethod === 'pan' && settings.thickness > 1.5) {
    return {
      label: 'Reverse sear recommended',
      detail: 'A pan-only cook above 1.5 inches is an estimate. Reverse searing gives a beginner more control over the center and crust.',
      level: 'estimate',
    };
  }
  if (coreCut && coreEquipment && settings.thickness >= 1.25 && settings.thickness <= 1.5) {
    return {
      label: 'Core calibration zone',
      detail: 'Closest to the tested SteakPilot setup. It is timer-guided, but still needs broader real-cook validation.',
      level: 'core',
    };
  }
  return {
    label: 'Beginner-guided estimate',
    detail: 'Inside the 1–2 inch guided range. Equipment, cut shape, and starting temperature can still shift the finish.',
    level: 'guided',
  };
}

export function makeCookingPlan(settings: SteakSettings): CookingPlan {
  const normalized: SteakSettings = {
    ...settings,
    thickness: clamp(settings.thickness || 1, 0.5, 3),
    weightOunces: clamp(settings.weightOunces || 8, 3, 64),
  };
  const temperatures = TEMPERATURES[normalized.doneness];
  const steps = normalized.cookingMethod === 'pan'
    ? makePanPlan(normalized, temperatures)
    : normalized.cookingMethod === 'reverseSear'
      ? makeReverseSearPlan(normalized, temperatures)
      : makeGrillPlan(normalized, temperatures);
  const measurement = normalized.unitSystem === 'metric'
    ? `${(normalized.thickness * 2.54).toFixed(1)} cm`
    : `${normalized.thickness.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}\"`;
  const method = cookingMethodLabel(normalized.cookingMethod);
  const advisory = normalized.pan === 'nonstick' && normalized.cookingMethod === 'pan'
    ? 'Nonstick mode uses gentler heat. Do not preheat an empty nonstick pan over high heat.'
    : normalized.thickness > 1.5 && normalized.cookingMethod === 'pan'
      ? 'For this thickness, reverse searing offers more even doneness and a lower risk of burning the exterior.'
      : 'Times are adaptive predictions. Correctly measured temperature verifies the cook; visible burning or smoking overrides the timer.';

  return {
    name: `${measurement} ${cutLabel(normalized.cut)} — ${donenessLabel(normalized.doneness)}`,
    settings: normalized,
    steps,
    advisory: `${method}: ${advisory}`,
  };
}

export function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds} sec`;
  return seconds === 0 ? `${minutes} min` : `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
