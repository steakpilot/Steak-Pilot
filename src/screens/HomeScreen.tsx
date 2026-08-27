import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BrandMark } from '../components/BrandMark';
import { colors } from '../theme';

interface Props {
  onGuided: () => void;
  onManual: () => void;
}

export function HomeScreen({ onGuided, onManual }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.glow} />
        <View style={styles.brandRow}>
          <View style={styles.logo}><BrandMark size={31} /></View>
          <Text style={styles.brand}>STEAKPILOT</Text>
        </View>
        <Text style={styles.title}>Your steak.{`\n`}Your timing.{`\n`}Nailed.</Text>
        <Text style={styles.subtitle}>Choose how much control you want. SteakPilot handles the clock, voice cues, and every flip.</Text>
      </View>

      <Text style={styles.chooseLabel}>CHOOSE YOUR COOK MODE</Text>

      <Pressable accessibilityRole="button" onPress={onGuided} style={({ pressed }) => [styles.guidedCard, pressed && styles.pressed]}>
        <View style={styles.cardTopRow}>
          <View style={styles.guidedIcon}><Text style={styles.iconText}>✦</Text></View>
          <View style={styles.recommended}><Text style={styles.recommendedText}>RECOMMENDED</Text></View>
        </View>
        <Text style={styles.cardTitle}>Chef-Guided Cook</Text>
        <Text style={styles.cardBody}>Tell us the cut, thickness, doneness, and equipment. SteakPilot builds and speaks the complete cooking sequence.</Text>
        <View style={styles.features}>
          <Feature text="Adaptive timings" />
          <Feature text="Temperature checkpoints" />
          <Feature text="Hands-free guidance" />
        </View>
        <View style={styles.guidedAction}><Text style={styles.guidedActionText}>Build my steak plan →</Text></View>
      </Pressable>

      <Pressable accessibilityRole="button" onPress={onManual} style={({ pressed }) => [styles.manualCard, pressed && styles.pressed]}>
        <View style={styles.manualIcon}><Text style={styles.manualIconText}>⏱</Text></View>
        <View style={styles.manualBody}>
          <Text style={styles.manualEyebrow}>YOU CONTROL THE RECIPE</Text>
          <Text style={styles.manualTitle}>Custom Timer</Text>
          <Text style={styles.manualText}>Create any number of flip rounds and edit every timer yourself.</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Text style={styles.footer}>Voice guided · Works offline · No account required</Text>
    </ScrollView>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <View style={styles.feature}>
      <Text style={styles.check}>✓</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  content: { flexGrow: 1, padding: 16, paddingBottom: 34 },
  hero: { backgroundColor: '#24130C', borderColor: '#5E3018', borderRadius: 28, borderWidth: 1, overflow: 'hidden', padding: 22 },
  glow: { backgroundColor: colors.orange, borderRadius: 130, height: 230, opacity: 0.13, position: 'absolute', right: -90, top: -90, width: 230 },
  brandRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  logo: { alignItems: 'center', backgroundColor: colors.background, borderColor: '#5E3018', borderRadius: 10, borderWidth: 1, height: 38, justifyContent: 'center', width: 38 },
  brand: { color: colors.orange, fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  title: { color: colors.text, fontSize: 43, fontWeight: '900', letterSpacing: -1.6, lineHeight: 45, marginTop: 25 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 13, maxWidth: 320 },
  chooseLabel: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10, marginTop: 24 },
  guidedCard: { backgroundColor: colors.orangeSoft, borderColor: colors.orange, borderRadius: 24, borderWidth: 1, padding: 18 },
  cardTopRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  guidedIcon: { alignItems: 'center', backgroundColor: colors.orange, borderRadius: 14, height: 46, justifyContent: 'center', width: 46 },
  iconText: { color: colors.background, fontSize: 23, fontWeight: '900' },
  recommended: { backgroundColor: '#5B2A0F', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  recommendedText: { color: colors.orange, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  cardTitle: { color: colors.text, fontSize: 25, fontWeight: '900', marginTop: 17 },
  cardBody: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 7 },
  features: { gap: 7, marginTop: 15 },
  feature: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  check: { color: colors.orange, fontSize: 13, fontWeight: '900' },
  featureText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  guidedAction: { alignItems: 'center', backgroundColor: colors.orange, borderRadius: 14, marginTop: 18, padding: 14 },
  guidedActionText: { color: colors.background, fontSize: 15, fontWeight: '900' },
  manualCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 21, borderWidth: 1, flexDirection: 'row', marginTop: 12, padding: 16 },
  manualIcon: { alignItems: 'center', backgroundColor: colors.surfaceRaised, borderRadius: 14, height: 48, justifyContent: 'center', width: 48 },
  manualIconText: { fontSize: 22 },
  manualBody: { flex: 1, marginLeft: 13 },
  manualEyebrow: { color: colors.orange, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  manualTitle: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 3 },
  manualText: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  chevron: { color: colors.orange, fontSize: 30, marginLeft: 8 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.99 }] },
  footer: { color: colors.muted, fontSize: 10, marginTop: 'auto', paddingTop: 24, textAlign: 'center' },
});
