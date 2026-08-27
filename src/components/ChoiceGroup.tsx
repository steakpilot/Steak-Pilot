import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Choice } from '../types';
import { colors } from '../theme';

interface Props<T extends string> {
  choices: Choice<T>[];
  selected: T;
  onSelect: (value: T) => void;
}

export function ChoiceGroup<T extends string>({ choices, selected, onSelect }: Props<T>) {
  return (
    <View style={styles.container}>
      {choices.map((choice) => {
        const active = selected === choice.id;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            key={choice.id}
            onPress={() => onSelect(choice.id)}
            style={[styles.choice, active && styles.activeChoice]}
          >
            <Text style={[styles.text, active && styles.activeText]}>{choice.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: {
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.surface,
  },
  activeChoice: { backgroundColor: colors.orange, borderColor: colors.orange },
  text: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  activeText: { color: colors.background },
});
