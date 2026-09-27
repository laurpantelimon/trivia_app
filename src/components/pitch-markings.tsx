import { StyleSheet, View } from 'react-native';

const LINE_COLOR = 'rgba(255, 255, 255, 0.22)';
const LINE_WIDTH = 2;
const CENTRE_CIRCLE_SIZE = 132;

/**
 * Halfway line and centre circle, drawn as chalk lines over a green surface.
 * Decorative only: fills its parent, ignores touches, hidden from screen readers.
 * The parent should clip (`overflow: 'hidden'`).
 */
export const PitchMarkings = () => (
  <View
    style={StyleSheet.absoluteFill}
    pointerEvents="none"
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants">
    <View style={styles.halfwayLine} />
    <View style={styles.centreCircle} />
    <View style={styles.centreSpot} />
  </View>
);

const styles = StyleSheet.create({
  halfwayLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: '22%',
    width: LINE_WIDTH,
    backgroundColor: LINE_COLOR,
  },
  centreCircle: {
    position: 'absolute',
    top: '50%',
    right: '22%',
    width: CENTRE_CIRCLE_SIZE,
    height: CENTRE_CIRCLE_SIZE,
    marginTop: -CENTRE_CIRCLE_SIZE / 2,
    marginRight: -CENTRE_CIRCLE_SIZE / 2 + LINE_WIDTH / 2,
    borderRadius: CENTRE_CIRCLE_SIZE / 2,
    borderWidth: LINE_WIDTH,
    borderColor: LINE_COLOR,
  },
  centreSpot: {
    position: 'absolute',
    top: '50%',
    right: '22%',
    width: 8,
    height: 8,
    marginTop: -4,
    marginRight: -4 + LINE_WIDTH / 2,
    borderRadius: 4,
    backgroundColor: LINE_COLOR,
  },
});
