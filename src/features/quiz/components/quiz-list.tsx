import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Quiz } from '@/types/quiz';
import { formatCalendarDay, toCalendarDay } from '@/utils/calendarDay';

import { QuizStatusPill } from './quiz-status-pill';

type QuizListProps = {
  quizzes: Quiz[];
  onOpen: (quiz: Quiz) => void;
};

/** Staff list of quizzes, newest first; tap one to edit it, delete it or put it live. */
export const QuizList = ({ quizzes, onOpen }: QuizListProps) => {
  if (quizzes.length === 0) {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        No quizzes yet. Create one above.
      </ThemedText>
    );
  }

  return (
    <View style={styles.list}>
      {quizzes.map((quiz) => (
        <QuizRow key={quiz.id} quiz={quiz} onOpen={onOpen} />
      ))}
    </View>
  );
};

const QuizRow = ({ quiz, onOpen }: { quiz: Quiz; onOpen: (quiz: Quiz) => void }) => {
  const theme = useTheme();
  const isLive = quiz.status === 'active';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${quiz.title}, ${describeQuiz(quiz)}`}
      onPress={() => onOpen(quiz)}
      style={({ pressed }) => [
        styles.row,
        { borderColor: isLive ? theme.accent : theme.border },
        isLive && { backgroundColor: theme.backgroundSelected },
        pressed && styles.pressed,
      ]}>
      <View style={styles.text}>
        <ThemedText type="heading" numberOfLines={2}>
          {quiz.title}
        </ThemedText>
        <View style={styles.meta}>
          <QuizStatusPill status={quiz.status} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.text}>
            {describeQuiz(quiz)}
          </ThemedText>
        </View>
      </View>
      <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={16}
        tintColor={theme.textSecondary}
      />
    </Pressable>
  );
};

const formatDate = (millis: number) => formatCalendarDay(toCalendarDay(new Date(millis)));

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

const describeQuiz = (quiz: Quiz) => {
  const questions = plural(quiz.questionCount, 'question');
  if (quiz.status === 'finished') {
    return `${questions} · ${plural(quiz.playerCount ?? 0, 'player')}${
      quiz.endedAt ? ` · ${formatDate(quiz.endedAt)}` : ''
    }`;
  }
  return `${questions} · ${formatDate(quiz.createdAt)}`;
};

const styles = StyleSheet.create({
  list: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderWidth: 1.5,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
  },
  pressed: {
    opacity: 0.7,
  },
  text: {
    flex: 1,
    gap: Spacing.one,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
