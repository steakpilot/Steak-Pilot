import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { BrandMark } from '../components/BrandMark';
import { formatDuration } from '../engine';
import { requestNotificationPermission } from '../notifications';
import { colors } from '../theme';
import { ManualTimerSettings } from '../types';

interface Props {
  settings: ManualTimerSettings;
  onChange: (settings: ManualTimerSettings) => void;
  onBack: () => void;
  onStart: () => void;
}

export function ManualTimerScreen({ settings, onChange, onBack, onStart }: Props) {
  const totalCookingSeconds = settings.roundSeconds.reduce((sum, seconds) => sum + seconds, 0);

  const changeRound = (index: number, seconds: number) => {
    const roundSeconds = settings.roundSeconds.map((value, roundIndex) =>
      roundIndex === index ? Math.max(5, Math.min(900, Math.round(seconds))) : value,
    );
    onChange({ ...settings, roundSeconds });
  };

  const addRound = () => {
    if (settings.roundSeconds.length >= 20) return;
    const previous = settings.roundSeconds.at(-1) ?? 45;
    onChange({ ...settings, roundSeconds: [...settings.roundSeconds, previous] });
  };

  const removeRound = () => {
    if (settings.roundSeconds.length <= 1) return;
    onChange({ ...settings, roundSeconds: settings.roundSeconds.slice(0, -1) });
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <View style={styles.screen}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>‹ Cook modes</Text>
          </Pressable>

          <View style={styles.headerCard}>
            <View style={styles.modeBrandRow}>
              <Text style={styles.eyebrow}>CUSTOM TIMER</Text>
              <View style={styles.modeLogo}><BrandMark size={36} /></View>
            </View>
            <Text style={styles.title}>Your sequence.{`\n`}Your rules.</Text>
            <Text style={styles.subtitle}>You choose every round. SteakPilot handles the countdown, flip announcements, and background alerts.</Text>
            <View style={styles.summaryRow}>
              <Summary value={settings.roundSeconds.length.toString()} label="TIMED ROUNDS" />
              <View style={styles.divider} />
              <Summary value={Math.max(0, settings.roundSeconds.length - 1).toString()} label="PLANNED FLIPS" />
              <View style={styles.divider} />
              <Summary value={formatDuration(totalCookingSeconds)} label="COOK TIME" />
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>How rounds work</Text>
            <Text style={styles.infoText}>Round 1 starts on Side A. Every following round begins with a spoken “Flip now” instruction.</Text>
          </View>

          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.sectionEyebrow}>COOKING SEQUENCE</Text>
              <Text style={styles.sectionTitle}>Edit every round</Text>
            </View>
            <Text style={styles.roundCount}>{settings.roundSeconds.length}/20</Text>
          </View>

          {settings.roundSeconds.map((seconds, index) => (
            <View key={`manual-round-${index}`} style={styles.roundCard}>
              <View style={[styles.roundBadge, index === 0 && styles.firstRoundBadge]}>
                <Text style={styles.roundBadgeText}>{index === 0 ? 'A' : index}</Text>
              </View>
              <View style={styles.roundDescription}>
                <Text style={styles.roundEyebrow}>ROUND {index + 1}</Text>
                <Text style={styles.roundTitle}>{index === 0 ? 'Start Side A' : `Flip #${index}`}</Text>
                <Text style={styles.roundHint}>{index === 0 ? 'Place steak down' : 'Voice says “Flip now”'}</Text>
              </View>
              <SecondsEditor seconds={seconds} onChange={(value) => changeRound(index, value)} />
            </View>
          ))}

          <View style={styles.roundActions}>
            <View style={styles.actionHalf}>
              <PrimaryButton label="− Remove Last" onPress={removeRound} secondary disabled={settings.roundSeconds.length <= 1} />
            </View>
            <View style={styles.actionHalf}>
              <PrimaryButton label="+ Add Flip Round" onPress={addRound} secondary disabled={settings.roundSeconds.length >= 20} />
            </View>
          </View>

          <View style={styles.restCard}>
            <View style={styles.restTextBlock}>
              <Text style={styles.sectionEyebrow}>FINAL STAGE</Text>
              <Text style={styles.restTitle}>Rest timer</Text>
              <Text style={styles.roundHint}>Begins after your final cooking round</Text>
            </View>
            <SecondsEditor
              seconds={settings.restSeconds}
              onChange={(restSeconds) => onChange({ ...settings, restSeconds: Math.max(30, Math.min(1_800, restSeconds)) })}
              minimum={30}
              maximum={1_800}
              increment={15}
            />
          </View>

          <View style={styles.boundaryCard}>
            <Text style={styles.boundaryTitle}>Manual means manual</Text>
            <Text style={styles.boundaryText}>Custom Timer does not calculate doneness or temperature checkpoints. You remain in control of heat and when to remove the steak.</Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton label="Start Custom Timer ▶" onPress={start} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function SecondsEditor({
  seconds,
  onChange,
  minimum = 5,
  maximum = 900,
  increment = 5,
}: {
  seconds: number;
  onChange: (seconds: number) => void;
  minimum?: number;
  maximum?: number;
  increment?: number;
}) {
  const [text, setText] = useState(seconds.toString());

  useEffect(() => setText(seconds.toString()), [seconds]);

  const commit = () => {
    const parsed = Number(text);
    const next = Number.isFinite(parsed) ? Math.max(minimum, Math.min(maximum, Math.round(parsed))) : seconds;
    setText(next.toString());
    onChange(next);
  };

  const adjust = (amount: number) => {
    const next = Math.max(minimum, Math.min(maximum, seconds + amount));
    setText(next.toString());
    onChange(next);
  };

  return (
    <View style={styles.editor}>
      <Pressable accessibilityRole="button" onPress={() => adjust(-increment)} style={styles.adjustButton}>
        <Text style={styles.adjustText}>−</Text>
      </Pressable>
      <View style={styles.timeInputWrap}>
        <TextInput
          accessibilityLabel="Seconds"
          keyboardType="number-pad"
          maxLength={4}
          onBlur={commit}
          onChangeText={(value) => {
            setText(value);
            const parsed = Number(value);
            if (value && Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum) onChange(parsed);
          }}
          selectTextOnFocus
          style={styles.timeInput}
          value={text}
        />
        <Text style={styles.secondsLabel}>SEC</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={() => adjust(increment)} style={styles.adjustButton}>
        <Text style={styles.adjustText}>+</Text>
      </Pressable>
    </View>
  );
}

function Summary({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text adjustsFontSizeToFit numberOfLines={1} style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { padding: 16, paddingBottom: 126 },
  backButton: { alignSelf: 'flex-start', paddingHorizontal: 4, paddingVertical: 10 },
  backText: { color: colors.orange, fontSize: 14, fontWeight: '800' },
  headerCard: { backgroundColor: '#24130C', borderColor: '#5E3018', borderRadius: 25, borderWidth: 1, overflow: 'hidden', padding: 20 },
  modeBrandRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  modeLogo: { alignItems: 'center', backgroundColor: colors.background, borderColor: '#5E3018', borderRadius: 12, borderWidth: 1, height: 42, justifyContent: 'center', width: 42 },
  eyebrow: { color: colors.orange, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: colors.text, fontSize: 35, fontWeight: '900', letterSpacing: -1.2, lineHeight: 38, marginTop: 9 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 9 },
  summaryRow: { alignItems: 'center', backgroundColor: 'rgba(9,7,6,0.4)', borderRadius: 15, flexDirection: 'row', marginTop: 18, paddingVertical: 12 },
  summaryItem: { alignItems: 'center', flex: 1, paddingHorizontal: 4 },
  summaryValue: { color: colors.text, fontSize: 15, fontWeight: '900' },
  summaryLabel: { color: colors.muted, fontSize: 7, fontWeight: '900', letterSpacing: 0.7, marginTop: 3 },
  divider: { backgroundColor: colors.border, height: 28, width: 1 },
  infoCard: { backgroundColor: colors.orangeSoft, borderRadius: 15, marginTop: 13, padding: 13 },
  infoTitle: { color: colors.orange, fontSize: 12, fontWeight: '900' },
  infoText: { color: colors.text, fontSize: 12, lineHeight: 17, marginTop: 4 },
  sectionHeading: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, marginTop: 24 },
  sectionEyebrow: { color: colors.orange, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  sectionTitle: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 3 },
  roundCount: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  roundCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, flexDirection: 'row', marginBottom: 9, padding: 12 },
  roundBadge: { alignItems: 'center', backgroundColor: colors.surfaceRaised, borderRadius: 12, height: 42, justifyContent: 'center', width: 42 },
  firstRoundBadge: { backgroundColor: colors.orangeSoft, borderColor: colors.orange, borderWidth: 1 },
  roundBadgeText: { color: colors.orange, fontSize: 15, fontWeight: '900' },
  roundDescription: { flex: 1, marginLeft: 11 },
  roundEyebrow: { color: colors.orange, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  roundTitle: { color: colors.text, fontSize: 15, fontWeight: '900', marginTop: 2 },
  roundHint: { color: colors.muted, fontSize: 10, marginTop: 3 },
  editor: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  adjustButton: { alignItems: 'center', backgroundColor: colors.surfaceRaised, borderColor: colors.border, borderRadius: 9, borderWidth: 1, height: 35, justifyContent: 'center', width: 30 },
  adjustText: { color: colors.text, fontSize: 18, fontWeight: '800' },
  timeInputWrap: { alignItems: 'center', backgroundColor: colors.background, borderColor: colors.border, borderRadius: 10, borderWidth: 1, minWidth: 53, paddingHorizontal: 5, paddingVertical: 4 },
  timeInput: { color: colors.text, fontSize: 17, fontWeight: '900', minWidth: 38, padding: 0, textAlign: 'center' },
  secondsLabel: { color: colors.orange, fontSize: 7, fontWeight: '900', letterSpacing: 0.7 },
  roundActions: { flexDirection: 'row', gap: 9, marginTop: 3 },
  actionHalf: { flex: 1 },
  restCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, flexDirection: 'row', marginTop: 18, padding: 14 },
  restTextBlock: { flex: 1 },
  restTitle: { color: colors.text, fontSize: 17, fontWeight: '900', marginTop: 3 },
  boundaryCard: { backgroundColor: '#30270D', borderColor: '#665514', borderRadius: 15, borderWidth: 1, marginTop: 13, padding: 13 },
  boundaryTitle: { color: colors.yellow, fontSize: 12, fontWeight: '900' },
  boundaryText: { color: colors.text, fontSize: 11, lineHeight: 16, marginTop: 4 },
  footer: { backgroundColor: colors.background, borderTopColor: colors.border, borderTopWidth: 1, bottom: 0, left: 0, padding: 14, position: 'absolute', right: 0 },
});
