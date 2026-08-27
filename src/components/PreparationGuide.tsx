import { StyleSheet, Text, View } from 'react-native';
import { CookGuideVisual, CookGuideVisualKind } from './CookGuideVisual';
import { colors } from '../theme';
import { CookingMethodId } from '../types';

interface GuideItem {
  kind: CookGuideVisualKind;
  title: string;
  body: string;
  panOnly?: boolean;
}

const guides: GuideItem[] = [
  { kind: 'thickness', title: 'Measure thickness', body: 'Measure the thickest point from bottom to top.' },
  { kind: 'dry', title: 'Dry the surface', body: 'Pat every side dry before seasoning.' },
  { kind: 'fatCap', title: 'Find the fat cap', body: 'Hold this edge against the pan when guided.', panOnly: true },
  { kind: 'oil', title: 'Watch the oil', body: 'Start when a thin film shimmers—not when it smokes.', panOnly: true },
  { kind: 'butter', title: 'Watch the butter', body: 'Foaming and golden is right. Dark or smoking is too hot.', panOnly: true },
  { kind: 'thermometer', title: 'Probe from the side', body: 'Lift the steak. Pass the tip just beyond center, then withdraw slowly to find the lowest stable reading.' },
];

export function PreparationGuide({ method }: { method: CookingMethodId }) {
  const usesPan = method === 'pan' || method === 'reverseSear';
  const visibleGuides = guides.filter((guide) => usesPan || !guide.panOnly);

  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>BEGINNER VISUAL CHECK</Text>
      <Text style={styles.title}>See the key moves before cooking</Text>
      <Text style={styles.subtitle}>These diagrams stay on this device and require no connection.</Text>
      <View style={styles.grid}>
        {visibleGuides.map((guide) => (
          <View key={guide.kind} style={styles.card}>
            <View style={styles.visual}>
              <CookGuideVisual kind={guide.kind} />
            </View>
            <Text style={styles.cardTitle}>{guide.title}</Text>
            <Text style={styles.cardBody}>{guide.body}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, marginTop: 12, padding: 14 },
  eyebrow: { color: colors.orange, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: colors.text, fontSize: 19, fontWeight: '900', marginTop: 5 },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 13 },
  card: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 15, borderWidth: 1, padding: 10, width: '48%' },
  visual: { backgroundColor: colors.surfaceRaised, borderRadius: 11, overflow: 'hidden' },
  cardTitle: { color: colors.text, fontSize: 13, fontWeight: '900', marginTop: 9 },
  cardBody: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
});
