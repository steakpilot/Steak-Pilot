import { getGuidanceTier, makeCookingPlan } from '../src/engine';
import { makeManualCookingPlan } from '../src/manualPlan';
import {
  AROMATICS,
  COOKING_METHODS,
  COOKTOPS,
  CUTS,
  DEFAULT_MANUAL_TIMER,
  DEFAULT_SETTINGS,
  DONENESS,
  PANS,
  UNIT_SYSTEMS,
  CookingPlan,
} from '../src/types';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertFrozenIds(label: string, actual: { id: string }[], expected: string[]) {
  const actualIds = actual.map((item) => item.id);
  assert(
    JSON.stringify(actualIds) === JSON.stringify(expected),
    `${label}: V1 scope drifted. Expected ${expected.join(', ')}; received ${actualIds.join(', ')}`,
  );
}

assertFrozenIds('Cuts', CUTS, [
  'ribeyeBoneless',
  'ribeyeBoneIn',
  'tomahawk',
  'strip',
  'filet',
  'topSirloin',
  'tBone',
  'porterhouse',
  'flatIron',
  'denver',
  'picanha',
  'hanger',
  'flank',
  'skirt',
  'triTipSteak',
]);
assertFrozenIds('Doneness', DONENESS, ['blue', 'rare', 'mediumRare', 'medium', 'mediumWell', 'well']);
assertFrozenIds('Cooking methods', COOKING_METHODS, ['pan', 'gasGrill', 'charcoalGrill', 'pelletGrill', 'reverseSear']);
assertFrozenIds('Pans', PANS, ['castIron', 'stainless', 'carbonSteel', 'nonstick']);
assertFrozenIds('Cooktops', COOKTOPS, ['gas', 'electric', 'induction']);
assertFrozenIds('Aromatics', AROMATICS, ['thyme', 'rosemary', 'both', 'none']);
assertFrozenIds('Unit systems', UNIT_SYSTEMS, ['imperial', 'metric']);
assert(
  JSON.stringify(DEFAULT_MANUAL_TIMER) === JSON.stringify({ roundSeconds: [60, 60, 45, 45], restSeconds: 300 }),
  'Default Custom Timer drifted from the frozen V1 scope',
);

function validatePlan(plan: CookingPlan, context: string) {
  assert(plan.steps.length >= 2, `${context}: plan has too few steps`);
  assert(plan.steps.at(-1)?.phase === 'rest', `${context}: final step is not rest`);
  assert(new Set(plan.steps.map((step) => step.id)).size === plan.steps.length, `${context}: duplicate step id`);

  plan.steps.forEach((step, index) => {
    assert(Number.isInteger(step.durationSeconds), `${context}/${step.id}: duration is not an integer`);
    assert(step.durationSeconds > 0 && step.durationSeconds <= 7_200, `${context}/${step.id}: duration out of range`);
    assert(!/undefined|NaN/i.test(`${step.title} ${step.instruction}`), `${context}/${step.id}: broken text`);
    if (step.temperatureCue) assert(step.temperatureReference, `${context}/${step.id}: cue has no temperature`);
    if (step.requiresDecisionBeforeNext) {
      assert(plan.steps[index + 1]?.phase === 'rest', `${context}/${step.id}: decision gate is not before rest`);
    }
    if (step.skipTarget === 'rest') {
      assert(plan.steps.slice(index + 1).some((future) => future.phase === 'rest'), `${context}/${step.id}: no future rest step`);
    }
    if (step.skipTarget === 'baste') {
      assert(
        plan.steps.slice(index + 1).some((future) => future.id === 'lower-heat' || future.id === 'add-butter'),
        `${context}/${step.id}: no future basting transition`,
      );
    }
    if (step.skipTarget === 'sear') {
      assert(
        plan.steps.slice(index + 1).some((future) => future.id === 'prepare-final-sear'),
        `${context}/${step.id}: no future final sear`,
      );
    }
  });

  for (const step of plan.steps) {
    if (step.id === 'lower-heat' || step.id === 'reverse-lower-heat') {
      assert(step.durationSeconds === 10, `${context}/${step.id}: heat reduction is not 10 seconds`);
    }
    if (step.id === 'add-butter' || step.id === 'reverse-add-butter') {
      assert(step.durationSeconds === 20, `${context}/${step.id}: butter step is not 20 seconds`);
    }
  }
}

const steakProfiles = [
  { thickness: 0.5, weightOunces: 3 },
  { thickness: 0.65, weightOunces: 8 },
  { thickness: 0.75, weightOunces: 10 },
  { thickness: 1, weightOunces: 12 },
  { thickness: 1.5, weightOunces: 22 },
  { thickness: 2, weightOunces: 32 },
  { thickness: 3, weightOunces: 64 },
];

let generatedPlans = 0;
for (const cut of CUTS) {
  for (const doneness of DONENESS) {
    for (const cookingMethod of COOKING_METHODS) {
      for (const pan of PANS) {
        for (const cooktop of COOKTOPS) {
          for (const aromatic of AROMATICS) {
            for (const unitSystem of UNIT_SYSTEMS) {
              for (const profile of steakProfiles) {
                const context = [cut.id, doneness.id, cookingMethod.id, pan.id, cooktop.id, aromatic.id, unitSystem.id, profile.thickness].join('/');
                const plan = makeCookingPlan({
                  ...DEFAULT_SETTINGS,
                  ...profile,
                  cut: cut.id,
                  doneness: doneness.id,
                  cookingMethod: cookingMethod.id,
                  pan: pan.id,
                  cooktop: cooktop.id,
                  aromatic: aromatic.id,
                  unitSystem: unitSystem.id,
                });
                validatePlan(plan, context);
                if (pan.id === 'nonstick' && (cookingMethod.id === 'pan' || cookingMethod.id === 'reverseSear')) {
                  assert(
                    !plan.steps.some((step) => /high heat/i.test(step.instruction)),
                    `${context}: nonstick plan contains high-heat instruction`,
                  );
                }
                if (cookingMethod.id === 'pan' && cut.style !== 'thin' && profile.thickness > 0.65) {
                  assert(
                    plan.steps.filter((step) => step.phase === 'baste').length === 1,
                    `${context}: pan plan must schedule one basting round before the decision gate`,
                  );
                }
                generatedPlans += 1;
              }
            }
          }
        }
      }
    }
  }
}

assert(
  getGuidanceTier({ ...DEFAULT_SETTINGS, thickness: 0.75 }).level === 'estimate',
  'Thickness below 1 inch must be labeled estimate-only',
);
assert(
  getGuidanceTier({ ...DEFAULT_SETTINGS, thickness: 1.5 }).level === 'core',
  'The calibrated 1.5-inch cast-iron/gas ribeye setup must remain in the core zone',
);
assert(
  getGuidanceTier({ ...DEFAULT_SETTINGS, thickness: 2 }).level === 'estimate',
  'Pan-only guidance above 1.5 inches must recommend reverse searing',
);
assert(
  getGuidanceTier({ ...DEFAULT_SETTINGS, thickness: 2, cookingMethod: 'reverseSear' }).level === 'guided',
  'A 2-inch reverse-sear plan must remain in the beginner-guided range',
);

const manualCases = [
  { roundSeconds: [], restSeconds: Number.NaN },
  { roundSeconds: [5], restSeconds: 30 },
  { roundSeconds: [Number.NaN, -10, 9_999], restSeconds: 99_999 },
  { roundSeconds: Array.from({ length: 20 }, (_, index) => 5 + index * 45), restSeconds: 1_800 },
];

manualCases.forEach((settings, index) => {
  const plan = makeManualCookingPlan(settings);
  validatePlan(plan, `manual-${index}`);
  assert(plan.steps.length === Math.max(1, settings.roundSeconds.length) + 1, `manual-${index}: incorrect step count`);
});

assert(generatedPlans === 302_400, `Frozen V1 plan matrix changed: generated ${generatedPlans.toLocaleString()} plans`);

console.log(`Sanity passed: ${generatedPlans.toLocaleString()} guided plans and ${manualCases.length} manual edge cases.`);
