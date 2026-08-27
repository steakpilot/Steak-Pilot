import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ChoiceGroup } from '../components/ChoiceGroup';
import { BrandMark } from '../components/BrandMark';
import { PrimaryButton } from '../components/PrimaryButton';
import { getGuidanceTier, getTemperatureProfile } from '../engine';
import { colors } from '../theme';
import {
  AROMATICS,
  AromaticId,
  COOKING_METHODS,
  COOKTOPS,
  CUTS,
  CookingMethodId,
  CooktopId,
  CutId,
  DONENESS,
  DonenessId,
  PANS,
  PanId,
  SteakSettings,
  UNIT_SYSTEMS,
  UnitSystem,
  aromaticLabel,
  cookingMethodLabel,
  cutLabel,
  donenessLabel,
} from '../types';

interface Props {
  settings: SteakSettings;
  onChange: (settings: SteakSettings) => void;
  onGenerate: (settings: SteakSettings) => void;
  onBack: () => void;
}

function displayThickness(settings: SteakSettings) {
  return settings.unitSystem === 'metric'
    ? (settings.thickness * 2.54).toFixed(1)
    : settings.thickness.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function displayWeight(settings: SteakSettings) {
  return settings.unitSystem === 'metric'
    ? Math.round(settings.weightOunces * 28.3495).toString()
    : settings.weightOunces.toFixed(1).replace(/\.0$/, '');
}

function parseNumber(text: string) {
  return Number(text.replace(',', '.'));
}

export function SetupScreen({ settings, onChange, onGenerate, onBack }: Props) {
  const [thicknessText, setThicknessText] = useState(() => displayThickness(settings));
  const [weightText, setWeightText] = useState(() => displayWeight(settings));
  const set = <K extends keyof SteakSettings>(key: K, value: SteakSettings[K]) =>
    onChange({ ...settings, [key]: value });
  const temperatures = getTemperatureProfile(settings.doneness);
  const guidance = getGuidanceTier(settings);
  const usesPan = settings.cookingMethod === 'pan' || settings.cookingMethod === 'reverseSear';

  const changeUnit = (unitSystem: UnitSystem) => {
    const next = { ...settings, unitSystem };
    onChange(next);
    setThicknessText(displayThickness(next));
    setWeightText(displayWeight(next));
  };

  const updateThickness = (text: string) => {
    setThicknessText(text);
    const parsed = parseNumber(text);
    if (!Number.isFinite(parsed)) return;
    const inches = settings.unitSystem === 'metric' ? parsed / 2.54 : parsed;
    if (inches >= 0.5 && inches <= 3) set('thickness', inches);
  };

  const updateWeight = (text: string) => {
    setWeightText(text);
    const parsed = parseNumber(text);
    if (!Number.isFinite(parsed)) return;
    const ounces = settings.unitSystem === 'metric' ? parsed / 28.3495 : parsed;
    if (ounces >= 3 && ounces <= 64) set('weightOunces', ounces);
  };

  const commitMeasurements = () => {
    const rawThickness = parseNumber(thicknessText);
    const rawWeight = parseNumber(weightText);
    const thicknessInches = settings.unitSystem === 'metric' ? rawThickness / 2.54 : rawThickness;
    const weightOunces = settings.unitSystem === 'metric' ? rawWeight / 28.3495 : rawWeight;
    const next = {
      ...settings,
      thickness: Math.max(0.5, Math.min(3, Number.isFinite(thicknessInches) ? thicknessInches : settings.thickness)),
      weightOunces: Math.max(3, Math.min(64, Number.isFinite(weightOunces) ? weightOunces : settings.weightOunces)),
    };
    setThicknessText(displayThickness(next));
    setWeightText(displayWeight(next));
    onChange(next);
    return next;
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} style={styles.screen}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>‹ Cook modes</Text>
        </Pressable>
        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <View style={styles.heroTopRow}>
            <Text style={styles.heroBadge}>PRECISION STEAK ASSISTANT</Text>
            <View style={styles.logoMark}><BrandMark size={39} /></View>
          </View>
          <Text style={styles.title}>SteakPilot</Text>
          <Text style={styles.subtitle}>A hands-free cooking plan built around the steak in front of you.</Text>
          <View style={styles.heroStats}>
            <HeroStat value="15" label="STEAK CUTS" />
            <View style={styles.statDivider} />
            <HeroStat value="5" label="COOK METHODS" />
            <View style={styles.statDivider} />
            <HeroStat value="VOICE" label="GUIDED" />
          </View>
        </View>

        <Section number="01" title="Choose your steak" subtitle="The cut changes fat rendering, heat response, and timing.">
          <ChoiceGroup<CutId> choices={CUTS} selected={settings.cut} onSelect={(value) => set('cut', value)} />
        </Section>

        <Section number="02" title="Measure it" subtitle="Thickness is the most important input for timing.">
          <Text style={styles.fieldLabel}>MEASUREMENT UNITS</Text>
          <ChoiceGroup<UnitSystem> choices={UNIT_SYSTEMS} selected={settings.unitSystem} onSelect={changeUnit} />
          <View style={styles.measurements}>
            <MeasurementInput
              label="Thickness"
              unit={settings.unitSystem === 'metric' ? 'cm' : 'inches'}
              value={thicknessText}
              onChangeText={updateThickness}
              onBlur={commitMeasurements}
            />
            <MeasurementInput
              label="Weight"
              unit={settings.unitSystem === 'metric' ? 'grams' : 'ounces'}
              value={weightText}
              onChangeText={updateWeight}
              onBlur={commitMeasurements}
            />
          </View>
          <Text style={styles.helper}>Measure the thickest point—not the average thickness.</Text>
          <Text style={[styles.rangeStatus, guidance.level === 'estimate' && styles.rangeStatusWarning]}>
            {settings.thickness >= 1 && settings.thickness <= 2
              ? 'Beginner-guided thickness: 1–2 inches (2.5–5.1 cm).'
              : 'Outside the beginner-guided 1–2 inch range. This combination is estimate-only.'}
          </Text>
        </Section>

        <Section number="03" title="Choose doneness" subtitle="Time predicts the cook; a correctly placed thermometer verifies it.">
          <ChoiceGroup<DonenessId>
            choices={DONENESS}
            selected={settings.doneness}
            onSelect={(value) => set('doneness', value)}
          />
        </Section>

        <Section number="04" title="Choose your method" subtitle="Pick the way you are actually cooking today.">
          <ChoiceGroup<CookingMethodId>
            choices={COOKING_METHODS}
            selected={settings.cookingMethod}
            onSelect={(value) => set('cookingMethod', value)}
          />
        </Section>

        {usesPan ? (
          <>
            <Section number="05" title="Match your equipment" subtitle="Pan material and cooktop response change how aggressively heat builds.">
              <Text style={styles.fieldLabel}>{settings.cookingMethod === 'reverseSear' ? 'FINISHING PAN' : 'PAN'}</Text>
              <ChoiceGroup<PanId> choices={PANS} selected={settings.pan} onSelect={(value) => set('pan', value)} />
              {settings.pan === 'nonstick' ? (
                <Text style={styles.warningText}>Nonstick mode uses gentler heat and will not instruct an empty high-heat preheat.</Text>
              ) : null}
              <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>COOKTOP</Text>
              <ChoiceGroup<CooktopId>
                choices={COOKTOPS}
                selected={settings.cooktop}
                onSelect={(value) => set('cooktop', value)}
              />
            </Section>

            <Section number="06" title="Choose the finish" subtitle="Have everything beside the pan before the timer begins.">
              <ChoiceGroup<AromaticId>
                choices={AROMATICS}
                selected={settings.aromatic}
                onSelect={(value) => set('aromatic', value)}
              />
              <Text style={styles.readyLine}>
                {settings.aromatic === 'none'
                  ? 'Have unsalted butter and garlic ready. No herbs selected.'
                  : `Have unsalted butter, garlic, and ${aromaticLabel(settings.aromatic).toLowerCase()} ready.`}
              </Text>
            </Section>
          </>
        ) : null}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryEyebrow}>YOUR COOK</Text>
          <Text style={styles.summaryTitle}>{cutLabel(settings.cut)} · {donenessLabel(settings.doneness)}</Text>
          <Text style={styles.summaryMeta}>
            {displayThickness(settings)} {settings.unitSystem === 'metric' ? 'cm' : 'in'} · {displayWeight(settings)} {settings.unitSystem === 'metric' ? 'g' : 'oz'} · {cookingMethodLabel(settings.cookingMethod)}
          </Text>
          <View style={styles.summaryRule} />
          {usesPan ? <TemperatureRow label="Basting reference" value={temperatures.baste} /> : null}
          {settings.cookingMethod === 'reverseSear' ? <TemperatureRow label="Begin final sear" value={temperatures.preSear} /> : null}
          <TemperatureRow label="Pull reference" value={temperatures.pull} />
          <TemperatureRow label="Expected finish" value={temperatures.finish} last />
        </View>

        <View style={[styles.guidanceCard, guidance.level === 'estimate' && styles.guidanceCardWarning]}>
          <Text style={styles.guidanceEyebrow}>GUIDANCE STATUS</Text>
          <Text style={styles.guidanceTitle}>{guidance.label}</Text>
          <Text style={styles.guidanceBody}>{guidance.detail}</Text>
        </View>

        {settings.thickness > 1.5 && settings.cookingMethod === 'pan' ? (
          <View style={styles.recommendation}>
            <Text style={styles.noticeTitle}>Chef recommendation</Text>
            <Text style={styles.noticeText}>For steaks thicker than 1.5 inches, reverse searing gives more even doneness and more control.</Text>
          </View>
        ) : null}

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>V1 starting condition</Text>
          <Text style={styles.noticeText}>
            Timings use a fully refrigerator-thawed steak rested out for 20–30 minutes while you prepare. Do not use a frozen or partially frozen steak, and never thaw meat on the counter.
          </Text>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Adaptive, not automatic sensing</Text>
          <Text style={styles.noticeText}>
            No temperature entry is required. SteakPilot speaks every checkpoint; you only choose Target Reached or add a guided flip when the cook needs more time.
          </Text>
        </View>

        <View style={styles.launchArea}>
          <Text style={styles.launchHint}>READY WHEN YOU ARE</Text>
          <PrimaryButton label="Build My Cooking Plan →" onPress={() => onGenerate(commitMeasurements())} />
        </View>
        <Text style={[styles.safety, temperatures.belowUSDA && styles.safetyWarning]}>
          {temperatures.belowUSDA
            ? 'This chef doneness target is below USDA consumer guidance of 145°F followed by at least a 3-minute rest.'
            : 'Whole-cut beef is generally recommended to reach 145°F followed by at least a 3-minute rest.'}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({
  number,
  title,
  subtitle,
  children,
}: {
  number: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionNumber}>{number}</Text>
        <View style={styles.sectionHeadingText}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.heroStat}>
      <Text style={styles.heroStatValue}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

function MeasurementInput({
  label,
  unit,
  value,
  onChangeText,
  onBlur,
}: {
  label: string;
  unit: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur: () => void;
}) {
  return (
    <View style={styles.inputCard}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={`${label} in ${unit}`}
        keyboardType="decimal-pad"
        maxLength={6}
        onBlur={onBlur}
        onChangeText={onChangeText}
        selectTextOnFocus
        style={styles.input}
        value={value}
      />
      <Text style={styles.inputUnit}>{unit}</Text>
    </View>
  );
}

function TemperatureRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.temperatureRow, last && styles.lastRow]}>
      <Text style={styles.temperatureLabel}>{label}</Text>
      <Text style={styles.temperatureValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 42 },
  backButton: { alignSelf: 'flex-start', paddingHorizontal: 4, paddingVertical: 10 },
  backText: { color: colors.orange, fontSize: 14, fontWeight: '800' },
  hero: { backgroundColor: '#25130B', borderColor: '#693415', borderRadius: 28, borderWidth: 1, marginTop: 4, overflow: 'hidden', padding: 22 },
  heroGlow: { backgroundColor: colors.orange, borderRadius: 100, height: 180, opacity: 0.12, position: 'absolute', right: -65, top: -80, width: 180 },
  heroTopRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  heroBadge: { color: colors.orange, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  logoMark: { alignItems: 'center', backgroundColor: colors.background, borderColor: '#693415', borderRadius: 13, borderWidth: 1, height: 46, justifyContent: 'center', width: 46 },
  title: { color: colors.text, fontSize: 42, fontWeight: '900', letterSpacing: -1.5, marginTop: 18 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 6, maxWidth: 310 },
  heroStats: { alignItems: 'center', backgroundColor: 'rgba(9,7,6,0.38)', borderRadius: 16, flexDirection: 'row', justifyContent: 'space-around', marginTop: 22, paddingVertical: 12 },
  heroStat: { alignItems: 'center', flex: 1 },
  heroStatValue: { color: colors.text, fontSize: 14, fontWeight: '900' },
  heroStatLabel: { color: colors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 0.8, marginTop: 3 },
  statDivider: { backgroundColor: colors.border, height: 28, width: 1 },
  section: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, marginTop: 14, padding: 16 },
  sectionHeading: { alignItems: 'flex-start', flexDirection: 'row', marginBottom: 15 },
  sectionNumber: { color: colors.orange, fontSize: 11, fontWeight: '900', letterSpacing: 1, marginRight: 12, marginTop: 4 },
  sectionHeadingText: { flex: 1 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  sectionSubtitle: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  fieldLabel: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 9 },
  fieldLabelSpaced: { marginTop: 18 },
  helper: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 10 },
  rangeStatus: { color: colors.yellow, fontSize: 12, fontWeight: '800', lineHeight: 17, marginTop: 7 },
  rangeStatusWarning: { color: colors.danger },
  measurements: { flexDirection: 'row', gap: 10, marginTop: 14 },
  inputCard: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 18, borderWidth: 1, flex: 1, padding: 14 },
  inputLabel: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  input: { color: colors.text, fontSize: 30, fontWeight: '900', marginTop: 4, padding: 0 },
  inputUnit: { color: colors.orange, fontSize: 12, fontWeight: '800', marginTop: 2 },
  warningText: { color: colors.yellow, fontSize: 12, lineHeight: 17, marginTop: 9 },
  readyLine: { backgroundColor: colors.background, borderRadius: 12, color: colors.text, fontSize: 12, lineHeight: 18, marginTop: 13, padding: 12 },
  summaryCard: { backgroundColor: '#241A12', borderColor: '#5A402A', borderRadius: 22, borderWidth: 1, marginTop: 16, paddingHorizontal: 16, paddingTop: 17 },
  guidanceCard: { backgroundColor: '#17271B', borderColor: '#3E7149', borderRadius: 17, borderWidth: 1, marginTop: 14, padding: 15 },
  guidanceCardWarning: { backgroundColor: '#30270D', borderColor: colors.yellow },
  guidanceEyebrow: { color: colors.orange, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  guidanceTitle: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 5 },
  guidanceBody: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  summaryEyebrow: { color: colors.orange, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  summaryTitle: { color: colors.text, fontSize: 21, fontWeight: '900', marginTop: 7 },
  summaryMeta: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  summaryRule: { backgroundColor: colors.border, height: 1, marginTop: 15 },
  temperatureRow: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15 },
  lastRow: { borderBottomWidth: 0 },
  temperatureLabel: { color: colors.muted, fontSize: 14 },
  temperatureValue: { color: colors.yellow, fontSize: 16, fontWeight: '800' },
  notice: { backgroundColor: colors.orangeSoft, borderRadius: 16, marginVertical: 20, padding: 16 },
  recommendation: { backgroundColor: '#30270D', borderRadius: 16, marginTop: 18, padding: 16 },
  noticeTitle: { color: colors.orange, fontSize: 14, fontWeight: '800', marginBottom: 5 },
  noticeText: { color: colors.text, fontSize: 13, lineHeight: 19 },
  launchArea: { backgroundColor: colors.surface, borderRadius: 20, marginTop: 4, padding: 12 },
  launchHint: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.4, marginBottom: 9, textAlign: 'center' },
  safety: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 14, textAlign: 'center' },
  safetyWarning: { color: colors.yellow },
});
