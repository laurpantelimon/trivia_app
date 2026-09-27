import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AnswerColors, GameFonts } from '@/constants/theme';

type AvatarProps = {
  /** Stable id used to pick the colour, so a player keeps the same colour everywhere. */
  seed: string;
  name: string;
  size?: number;
};

const colorForSeed = (seed: string) => {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return AnswerColors[hash % AnswerColors.length];
};

export const Avatar = ({ seed, name, size = 52 }: AvatarProps) => {
  const color = colorForSeed(seed);
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color.fill,
        },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no">
      <ThemedText style={[styles.initial, { fontSize: size * 0.45, lineHeight: size * 0.55 }]}>
        {initial}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontFamily: GameFonts.bold,
    color: '#FFFFFF',
  },
});
