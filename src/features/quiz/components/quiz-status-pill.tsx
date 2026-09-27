import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { QuizStatus } from '@/types/quiz';

export const QUIZ_STATUS_LABELS: Record<QuizStatus, string> = {
  draft: 'Draft',
  active: 'Live',
  finished: 'Finished',
};

export const QuizStatusPill = ({ status }: { status: QuizStatus }) => {
  const theme = useTheme();
  const color = status === 'active' ? theme.accent : theme.textSecondary;

  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <ThemedText type="smallBold" style={{ color }}>
        {QUIZ_STATUS_LABELS[status]}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.half + 1,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
  },
});
