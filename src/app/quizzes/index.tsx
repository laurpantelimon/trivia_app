import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { GameCard } from '@/components/ui/game-card';
import { TextField } from '@/components/ui/text-field';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { QuizList } from '@/features/quiz/components/quiz-list';
import { useCreateQuizForm } from '@/features/quiz/useCreateQuizForm';
import { useQuizzesSync } from '@/features/quiz/useQuizzesSync';
import { useTheme } from '@/hooks/use-theme';
import { QUIZ_TITLE_MAX_LENGTH, type Quiz } from '@/types/quiz';

/** Staff: create quizzes and pick one to edit, delete or put live. */
export default function QuizzesScreen() {
  const theme = useTheme();
  const form = useCreateQuizForm();
  const { quizzes, isLoaded } = useQuizzesSync();

  const openQuiz = (quiz: Quiz) =>
    router.push({ pathname: '/quizzes/[quizId]', params: { quizId: quiz.id } });

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <GameCard title="New quiz" subtitle="Give it a title, then add its questions.">
          <TextField
            label="Title"
            placeholder="e.g. Friday football night"
            value={form.title}
            onChangeText={form.changeTitle}
            maxLength={QUIZ_TITLE_MAX_LENGTH}
            autoCapitalize="sentences"
            returnKeyType="done"
            editable={!form.isPending}
            onSubmitEditing={form.submit}
          />
          <FormError message={form.errorMessage} />
          <Button
            title="Create quiz"
            icon={{ ios: 'plus', android: 'add_circle', web: 'add_circle' }}
            onPress={form.submit}
            disabled={!form.canSubmit}
            isLoading={form.isPending}
          />
        </GameCard>

        <GameCard
          title="Quizzes"
          subtitle="Only one quiz can be live at a time."
          icon={{ ios: 'list.bullet', android: 'list', web: 'list' }}
          iconColor={theme.textSecondary}>
          {isLoaded ? (
            <QuizList quizzes={quizzes} onOpen={openQuiz} />
          ) : (
            <ActivityIndicator color={theme.accent} />
          )}
        </GameCard>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: Spacing.four,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
});
