import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { QuizQuestion } from '@/types/quiz';

export const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

type QuestionListProps = {
  questions: readonly QuizQuestion[];
  /** Shows a remove button per question (draft quizzes only). */
  onRemove?: (question: QuizQuestion) => void;
  /** Question being removed; its button is hidden, the others disabled. */
  removingQuestionId?: string;
};

/** A quiz's questions in order, each option lettered and the correct one marked. */
export const QuestionList = ({ questions, onRemove, removingQuestionId }: QuestionListProps) => {
  if (questions.length === 0) {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        No questions yet. A quiz needs at least one question to go live.
      </ThemedText>
    );
  }

  return (
    <View style={styles.list}>
      {questions.map((question, index) => (
        <QuestionRow
          key={question.id}
          number={index + 1}
          question={question}
          onRemove={onRemove}
          isRemoving={removingQuestionId === question.id}
          isRemoveDisabled={removingQuestionId !== undefined}
        />
      ))}
    </View>
  );
};

type QuestionRowProps = {
  number: number;
  question: QuizQuestion;
  onRemove?: (question: QuizQuestion) => void;
  isRemoving: boolean;
  isRemoveDisabled: boolean;
};

const QuestionRow = ({ number, question, onRemove, isRemoving, isRemoveDisabled }: QuestionRowProps) => {
  const theme = useTheme();

  return (
    <View style={[styles.row, { borderColor: theme.border, opacity: isRemoving ? 0.5 : 1 }]}>
      <View style={styles.header}>
        <ThemedText type="heading" style={styles.text}>
          {number}. {question.text}
        </ThemedText>
        {onRemove ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove question ${number}`}
            disabled={isRemoveDisabled}
            hitSlop={8}
            onPress={() => onRemove(question)}
            style={({ pressed }) => [styles.remove, pressed && styles.pressed]}>
            <SymbolView
              name={{ ios: 'trash', android: 'delete', web: 'delete' }}
              size={20}
              tintColor={isRemoveDisabled ? theme.onDisabled : theme.danger}
            />
          </Pressable>
        ) : null}
      </View>
      {question.options.map((option, optionIndex) => {
        const isCorrect = optionIndex === question.correctOption;
        return (
          <View key={optionIndex} style={styles.option}>
            <ThemedText type="smallBold" themeColor={isCorrect ? 'accent' : 'textSecondary'}>
              {OPTION_LETTERS[optionIndex]}
            </ThemedText>
            <ThemedText type="small" style={styles.text} themeColor={isCorrect ? 'text' : 'textSecondary'}>
              {option}
            </ThemedText>
            {isCorrect ? (
              <SymbolView
                name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                size={18}
                tintColor={theme.accent}
                accessibilityLabel="Correct answer"
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: Spacing.two,
  },
  row: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderWidth: 1.5,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  text: {
    flex: 1,
  },
  remove: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.5,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
