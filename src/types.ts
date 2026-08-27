export type CutId =
  | 'ribeyeBoneless'
  | 'ribeyeBoneIn'
  | 'tomahawk'
  | 'strip'
  | 'filet'
  | 'topSirloin'
  | 'tBone'
  | 'porterhouse'
  | 'flatIron'
  | 'denver'
  | 'picanha'
  | 'hanger'
  | 'flank'
  | 'skirt'
  | 'triTipSteak';

export type DonenessId = 'blue' | 'rare' | 'mediumRare' | 'medium' | 'mediumWell' | 'well';
export type AromaticId = 'thyme' | 'rosemary' | 'both' | 'none';
export type CookingMethodId = 'pan' | 'gasGrill' | 'charcoalGrill' | 'pelletGrill' | 'reverseSear';
export type PanId = 'castIron' | 'stainless' | 'carbonSteel' | 'nonstick';
export type CooktopId = 'gas' | 'electric' | 'induction';
export type UnitSystem = 'imperial' | 'metric';
export type Phase = 'fatCap' | 'sear' | 'flip' | 'transition' | 'baste' | 'indirect' | 'rest';
export type TemperatureCue = 'baste' | 'pull' | 'preSear';
export type SkipTarget = 'next' | 'baste' | 'sear' | 'rest';

export interface Choice<T extends string> {
  id: T;
  label: string;
}

export interface CutChoice extends Choice<CutId> {
  hasFatCap: boolean;
  boneIn: boolean;
  style: 'classic' | 'lean' | 'thin';
  timeFactor: number;
}

export interface SteakSettings {
  cut: CutId;
  thickness: number;
  weightOunces: number;
  doneness: DonenessId;
  aromatic: AromaticId;
  cookingMethod: CookingMethodId;
  pan: PanId;
  cooktop: CooktopId;
  unitSystem: UnitSystem;
}

export interface CookingStep {
  id: string;
  title: string;
  instruction: string;
  durationSeconds: number;
  phase: Phase;
  temperatureReference?: string;
  temperatureCue?: TemperatureCue;
  skipTarget?: SkipTarget;
  requiresDecisionBeforeNext?: boolean;
  icon: string;
}

export interface CookingPlan {
  name: string;
  settings: SteakSettings;
  steps: CookingStep[];
  advisory: string;
}

export interface ActiveCookSession {
  plan: CookingPlan;
  index: number;
  endTime: number;
  remaining: number;
  paused: boolean;
  awaitingDecision: boolean;
  extraRounds: number;
  manualRound: boolean;
  queuedFlipRounds: number;
  muted: boolean;
  savedAt: number;
}

export interface ManualTimerSettings {
  roundSeconds: number[];
  restSeconds: number;
}

export const DEFAULT_MANUAL_TIMER: ManualTimerSettings = {
  roundSeconds: [60, 60, 45, 45],
  restSeconds: 300,
};

export const CUTS: CutChoice[] = [
  { id: 'ribeyeBoneless', label: 'Ribeye', hasFatCap: true, boneIn: false, style: 'classic', timeFactor: 1 },
  { id: 'ribeyeBoneIn', label: 'Bone-In Ribeye', hasFatCap: true, boneIn: true, style: 'classic', timeFactor: 1.08 },
  { id: 'tomahawk', label: 'Tomahawk', hasFatCap: true, boneIn: true, style: 'classic', timeFactor: 1.12 },
  { id: 'strip', label: 'New York Strip', hasFatCap: true, boneIn: false, style: 'classic', timeFactor: 0.96 },
  { id: 'filet', label: 'Filet Mignon', hasFatCap: false, boneIn: false, style: 'lean', timeFactor: 0.92 },
  { id: 'topSirloin', label: 'Top Sirloin', hasFatCap: false, boneIn: false, style: 'lean', timeFactor: 1.1 },
  { id: 'tBone', label: 'T-Bone', hasFatCap: true, boneIn: true, style: 'classic', timeFactor: 1.08 },
  { id: 'porterhouse', label: 'Porterhouse', hasFatCap: true, boneIn: true, style: 'classic', timeFactor: 1.12 },
  { id: 'flatIron', label: 'Flat Iron', hasFatCap: false, boneIn: false, style: 'lean', timeFactor: 0.9 },
  { id: 'denver', label: 'Denver / Chuck Eye', hasFatCap: false, boneIn: false, style: 'classic', timeFactor: 1 },
  { id: 'picanha', label: 'Picanha', hasFatCap: true, boneIn: false, style: 'classic', timeFactor: 1.03 },
  { id: 'hanger', label: 'Hanger', hasFatCap: false, boneIn: false, style: 'lean', timeFactor: 0.95 },
  { id: 'flank', label: 'Flank', hasFatCap: false, boneIn: false, style: 'thin', timeFactor: 0.82 },
  { id: 'skirt', label: 'Skirt', hasFatCap: false, boneIn: false, style: 'thin', timeFactor: 0.72 },
  { id: 'triTipSteak', label: 'Tri-Tip Steak', hasFatCap: false, boneIn: false, style: 'lean', timeFactor: 1.04 },
];

export const DONENESS: Choice<DonenessId>[] = [
  { id: 'blue', label: 'Blue' },
  { id: 'rare', label: 'Rare' },
  { id: 'mediumRare', label: 'Medium-Rare' },
  { id: 'medium', label: 'Medium' },
  { id: 'mediumWell', label: 'Medium-Well' },
  { id: 'well', label: 'Well-Done' },
];

export const AROMATICS: Choice<AromaticId>[] = [
  { id: 'thyme', label: 'Thyme' },
  { id: 'rosemary', label: 'Rosemary' },
  { id: 'both', label: 'Both' },
  { id: 'none', label: 'No Herbs' },
];

export const COOKING_METHODS: Choice<CookingMethodId>[] = [
  { id: 'pan', label: 'Pan Sear' },
  { id: 'gasGrill', label: 'Gas Grill' },
  { id: 'charcoalGrill', label: 'Charcoal Grill' },
  { id: 'pelletGrill', label: 'Pellet Grill' },
  { id: 'reverseSear', label: 'Reverse Sear' },
];

export const PANS: Choice<PanId>[] = [
  { id: 'castIron', label: 'Cast Iron' },
  { id: 'stainless', label: 'Stainless Steel' },
  { id: 'carbonSteel', label: 'Carbon Steel' },
  { id: 'nonstick', label: 'Nonstick' },
];

export const COOKTOPS: Choice<CooktopId>[] = [
  { id: 'gas', label: 'Gas' },
  { id: 'electric', label: 'Electric' },
  { id: 'induction', label: 'Induction' },
];

export const UNIT_SYSTEMS: Choice<UnitSystem>[] = [
  { id: 'imperial', label: 'in / oz' },
  { id: 'metric', label: 'cm / g' },
];

export const DEFAULT_SETTINGS: SteakSettings = {
  cut: 'ribeyeBoneless',
  thickness: 1.5,
  weightOunces: 22,
  doneness: 'mediumRare',
  aromatic: 'thyme',
  cookingMethod: 'pan',
  pan: 'castIron',
  cooktop: 'gas',
  unitSystem: 'imperial',
};

export function cutProfile(id: CutId) {
  return CUTS.find((cut) => cut.id === id) ?? CUTS[0];
}

export function cutLabel(id: CutId) {
  return cutProfile(id).label;
}

export function donenessLabel(id: DonenessId) {
  return DONENESS.find((item) => item.id === id)?.label ?? id;
}

export function aromaticLabel(id: AromaticId) {
  return AROMATICS.find((item) => item.id === id)?.label ?? id;
}

export function cookingMethodLabel(id: CookingMethodId) {
  return COOKING_METHODS.find((item) => item.id === id)?.label ?? id;
}

export function panLabel(id: PanId) {
  return PANS.find((item) => item.id === id)?.label ?? id;
}

export function cooktopLabel(id: CooktopId) {
  return COOKTOPS.find((item) => item.id === id)?.label ?? id;
}
