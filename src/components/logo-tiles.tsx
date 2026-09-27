import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { GameFonts, PitchStripes, Radius } from '@/constants/theme';

const WORD = 'TRIVIA';
const STAGGER_MS = 50;

/** The app wordmark: one tile per letter in alternating pitch-stripe greens, easing in one after another. */
export const LogoTiles = () => (
  <View style={styles.row} accessible accessibilityRole="header" accessibilityLabel="Trivia">
    {WORD.split('').map((letter, index) => {
      return (
        <Animated.View
          key={`${letter}-${index}`}
          entering={FadeInDown.delay(index * STAGGER_MS).duration(300)}
          style={[
            styles.tile,
            { backgroundColor: PitchStripes[index % PitchStripes.length] },
          ]}>
          <ThemedText style={styles.letter}>{letter}</ThemedText>
        </Animated.View>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  tile: {
    width: 40,
    height: 46,
    borderRadius: Radius.small,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontFamily: GameFonts.bold,
    fontSize: 26,
    lineHeight: 32,
    color: '#FFFFFF',
  },
});
