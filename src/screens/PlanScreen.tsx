import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { BrandMark } from '../components/BrandMark';
import { PreparationGuide } from '../components/PreparationGuide';
import { formatDuration, getGuidanceTier } from '../engine';
import { requestNotificationPermission } from '../notifications';
import { colors } from '../theme';
import { CookingPlan, aromaticLabel, cookingMethodLabel, cooktopLabel, panLabel } from '../types';

interface Props {
  plan: CookingPlan;
  onChange: (plan: CookingPlan) => void;
  onBack: () => void;
  onStart: () => void;
}

export function PlanScreen({ plan, onChange, onBack, onStart }: Props) {
  const totalSeconds = plan.steps.reduce((sum, step) => sum + step.durationSeconds, 0);
  const usesPan = plan.settings.cookingMethod === 'pan' || plan.settings.cookingMethod === 'reverseSear';
  const method = cookingMethodLabel(plan.settings.cookingMethod);
  const guidance = getGuidanceTier(plan.settings);

  const adjust = (index: number, amount: number) => {
    const steps = plan.steps.map((step, stepIndex) =>
      stepIndex === index
        ? { ...step, durationSeconds: Math.max(5, Math.min(7_200, step.durationSeconds + amount)) }
        : step,
    );
    onChange({ ...plan, steps });
  };

  const start = async () => {
    const notificationsAllowed = await requestNotificationPermission();
    if (notificationsAllowed) {
      onStart();
      return;
    }
    Alert.alert(
      'Background alerts are off',
      'Voice guidance still works while SteakPilot is open, but flip alerts may not appear when the app is in the background.',
      [
        { text: 'Not Yet', style: 'cancel' },
        { text: 'Start Anyway', onPress: onStart },
      ],
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={onBack} style={styles.back}>
          <Text style={styles.backText}>‹ Change steak</Text>
        </Pressable>

        <View style={styles.brandLockup}>
          <BrandMark size={30} />
          <Text style={styles.eyebrow}>YOUR COOKING PROGRAM</Text>
        </View>
        <Text style={styles.title}>{plan.name}</Text>
        <View style={styles.summary}>
          <Text style={styles.summaryText}>{plan.steps.length} stages</Text>
          <Text style={styles.summaryDot}>•</Text>
          <Text style={styles.summaryText}>{formatDuration(totalSeconds)} total</Text>
          <Text style={styles.summaryDot}>•</Text>
          <Text style={styles.summaryText}>{method}</Text>
        </View>

        <View style={styles.prepCard}>
          <Text style={styles.prepTitle}>Before pressing Start</Text>
          {plan.settings.cookingMethod === 'pan' ? (
            <Prep
              text={
                plan.settings.pan === 'nonstick'
                  ? 'Add a thin film of neutral high-smoke-point oil to the nonstick pan, then heat it over medium until the oil shimmers. Do not preheat it empty.'
                  : `Preheat the ${panLabel(plan.settings.pan).toLowerCase()} pan on the ${cooktopLabel(plan.settings.cooktop).toLowerCase()} cooktop. Add a thin film of neutral high-smoke-point oil and begin when it shimmers.`
              }
            />
          ) : null}
          {plan.settings.cookingMethod === 'reverseSear' ? <Prep text="Preheat the oven to 225°F and place a rack over a tray." /> : null}
          {!usesPan ? <Prep text={`Preheat the ${method.toLowerCase()} and prepare direct and indirect heat zones.`} /> : null}
          <Prep text="Use a fully refrigerator-thawed steak rested out for 20–30 minutes while you prepare. Never thaw it on the counter." />
          <Prep text="Pat the steak dry and season it." />
          {usesPan ? (
            <Prep
              text={
                plan.settings.aromatic === 'none'
                  ? 'Have unsalted butter and garlic ready. No herbs are selected.'
                  : `Have unsalted butter, garlic, and ${aromaticLabel(plan.settings.aromatic).toLowerCase()} ready.`
              }
            />
          ) : null}
          <Prep text="Have a clean plate, tongs, and a fast thermometer ready for the spoken checkpoints." />
          <Prep text="Turn off silent mode and place the phone where you can hear it." />
        </View>

        <PreparationGuide method={plan.settings.cookingMethod} />

        <View style={[styles.advisoryCard, guidance.level === 'estimate' && styles.advisoryWarning]}>
          <Text style={styles.advisoryTitle}>{guidance.label}</Text>
          <Text style={styles.advisoryText}>{guidance.detail}</Text>
          <Text style={styles.advisoryDivider}>METHOD NOTE</Text>
          <Text style={styles.advisoryText}>{plan.advisory}</Text>
        </View>

        <Text style={styles.sectionTitle}>Edit any timer</Text>
        <Text style={styles.helper}>Use −5 or +5 before cooking. Skip, +45, Mute, and Target Reached are available during Cook Mode.</Text>

        {plan.steps.map((step, index) => (
          <View key={step.id} style={styles.stepCard}>
            <View style={styles.iconBubble}>
              <Text style={styles.icon}>{step.icon}</Text>
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepNumber}>STAGE {index + 1}</Text>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.instruction}>{step.instruction}</Text>
              {step.temperatureReference ? (
                <Text style={styles.temperature}>
                  🌡 {step.temperatureCue ? 'CHECK: ' : ''}{step.temperatureReference}
                </Text>
              ) : null}
            </View>
            <View style={styles.timerEditor}>
              <Pressable onPress={() => adjust(index, -5)} style={styles.adjustButton}>
                <Text style={styles.adjustText}>−5</Text>
              </Pressable>
              <Text style={styles.duration}>{formatDuration(step.durationSeconds)}</Text>
              <Pressable onPress={() => adjust(index, 5)} style={styles.adjustButton}>
                <Text style={styles.adjustText}>+5</Text>
              </Pressable>
            </View>
          </View>
        ))}

        <Text style={styles.disclaimer}>
          SteakPilot predicts timing and speaks temperature checkpoints but cannot sense the steak.
          Timings assume the stated 20–30 minute preparation window. Correctly measured temperature and visible danger cues override the generated plan.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton label="Begin Hands-Free Cook ▶" onPress={start} />
      </View>
    </View>
  );
}

function Prep({ text }: { text: string }) {
  return (
    <View style={styles.prepRow}>
      <Text style={styles.check}>✓</Text>
      <Text style={styles.prepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { padding: 20, paddingBottom: 120 },
  back: { alignSelf: 'flex-start', paddingVertical: 10 },
  backText: { color: colors.orange, fontSize: 15, fontWeight: '700' },
  brandLockup: { alignItems: 'center', flexDirection: 'row', gap: 9, marginTop: 8 },
  eyebrow: { color: colors.orange, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', letterSpacing: -0.8, marginTop: 5 },
  summary: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 8 },
  summaryText: { color: colors.muted, fontSize: 14 },
  summaryDot: { color: colors.orange },
  prepCard: { backgroundColor: colors.orangeSoft, borderRadius: 18, marginTop: 22, padding: 16 },
  advisoryCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, marginTop: 12, padding: 15 },
  advisoryWarning: { backgroundColor: '#30270D', borderColor: colors.yellow },
  advisoryTitle: { color: colors.yellow, fontSize: 13, fontWeight: '900' },
  advisoryText: { color: colors.text, fontSize: 13, lineHeight: 19, marginTop: 5 },
  advisoryDivider: { color: colors.orange, fontSize: 9, fontWeight: '900', letterSpacing: 1.1, marginTop: 12 },
  prepTitle: { color: colors.orange, fontSize: 15, fontWeight: '900', marginBottom: 8 },
  prepRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 9, marginTop: 7 },
  check: { color: colors.orange, fontSize: 15, fontWeight: '900' },
  prepText: { color: colors.text, flex: 1, fontSize: 13, lineHeight: 18 },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '900', marginTop: 28 },
  helper: { color: colors.muted, fontSize: 13, marginBottom: 12, marginTop: 4 },
  stepCard: { alignItems: 'flex-start', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 12, marginBottom: 10, padding: 14 },
  iconBubble: { alignItems: 'center', backgroundColor: colors.orangeSoft, borderRadius: 12, height: 42, justifyContent: 'center', width: 42 },
  icon: { fontSize: 21 },
  stepBody: { flex: 1 },
  stepNumber: { color: colors.orange, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  stepTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 2 },
  instruction: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 5 },
  temperature: { color: colors.yellow, fontSize: 12, fontWeight: '800', marginTop: 6 },
  timerEditor: { alignItems: 'center', gap: 6 },
  adjustButton: { backgroundColor: colors.surfaceRaised, borderColor: colors.border, borderRadius: 8, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 6 },
  adjustText: { color: colors.text, fontSize: 12, fontWeight: '800' },
  duration: { color: colors.orange, fontSize: 13, fontWeight: '900' },
  disclaimer: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 10, textAlign: 'center' },
  footer: { backgroundColor: colors.background, borderTopColor: colors.border, borderTopWidth: 1, bottom: 0, left: 0, padding: 14, position: 'absolute', right: 0 },
});
