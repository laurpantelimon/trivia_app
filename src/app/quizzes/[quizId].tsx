import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { GameCard } from '@/components/ui/game-card';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { AddQuestionForm } from '@/features/quiz/components/add-question-form';
import { QuestionList } from '@/features/quiz/components/question-list';
import { QuizStatusPill } from '@/features/quiz/components/quiz-status-pill';
import { useQuizEditor } from '@/features/quiz/useQuizEditor';
import { useTheme } from '@/hooks/use-theme';
import type { QuizQuestion } from '@/types/quiz';
import { confirmAction } from '@/utils/confirm';

/** Staff: one quiz — add and remove questions, delete it, or put it live. */
export default function QuizScreen() {
  const { quizId = '' } = useLocalSearchParams<{ quizId: string }>();
  const theme = useTheme();
  const editor = useQuizEditor(quizId);
  const { quiz, questions } = editor;

  if (!editor.isLoaded) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator color={theme.accent} />
      </ThemedView>
    );
  }

  if (!quiz) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ title: 'Quiz' }} />
        <ThemedText themeColor="textSecondary">This quiz doesn’t exist anymore.</ThemedText>
      </ThemedView>
    );
  }

  const confirmRemove = async (question: QuizQuestion) => {
    const isConfirmed = await confirmAction({
      title: 'Remove this question?',
      message: question.text,
      confirmLabel: 'Remove',
      isDestructive: true,
    });
    if (isConfirmed) await editor.removeQuestion(question.id);
  };

  const confirmDelete = async () => {
    const isConfirmed = await confirmAction({
      title: `Delete “${quiz.title}”?`,
      message: 'Its questions and any saved results are deleted too. This can’t be undone.',
      confirmLabel: 'Delete',
      isDestructive: true,
    });
    if (isConfirmed) await editor.deleteQuiz();
  };

  const confirmGoLive = async () => {
    const isConfirmed = await confirmAction({
      title: 'Go live?',
      message:
        'Players will see this quiz on their home screen and can join it. Questions can’t be changed once it’s live.',
      confirmLabel: 'Go live',
    });
    if (isConfirmed) await editor.goLive();
  };

  return (
    <ThemedView style={styles.screen}>
      <Stack.Screen options={{ title: quiz.title }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.summary}>
          <QuizStatusPill status={quiz.status} />
          <ThemedText themeColor="textSecondary">
            {questions.length === 1 ? '1 question' : `${questions.length} questions`}
          </ThemedText>
        </View>

        {quiz.status === 'active' ? (
          <GameCard title="This quiz is live" subtitle="Players can see it and join from their home screen.">
            <Button title="Open the live quiz" onPress={editor.openLiveQuiz} />
          </GameCard>
        ) : null}

        {editor.isDraft ? (
          <GameCard title="Add a question" icon={{ ios: 'plus.bubble.fill', android: 'add_comment', web: 'add_comment' }}>
            <AddQuestionForm quizId={quiz.id} questions={questions} />
          </GameCard>
        ) : null}

        <GameCard
          title="Questions"
          subtitle={editor.isDraft ? 'Asked in this order.' : 'Locked: questions can only change while the quiz is a draft.'}
          icon={{ ios: 'list.number', android: 'format_list_numbered', web: 'format_list_numbered' }}
          iconColor={theme.textSecondary}>
          <QuestionList
            questions={questions}
            onRemove={editor.isDraft ? confirmRemove : undefined}
            removingQuestionId={editor.removingQuestionId}
          />
        </GameCard>

        {quiz.status !== 'active' ? (
          <GameCard title="Quiz actions">
            {editor.isDraft ? (
              <>
                <Button
                  title="Go live"
                  variant="gold"
                  icon={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }}
                  onPress={confirmGoLive}
                  disabled={!editor.canGoLive}
                  isLoading={editor.isGoingLive}
                />
                <GoLiveHint
                  questionCount={questions.length}
                  otherLiveQuizTitle={editor.otherLiveQuizTitle}
                />
              </>
            ) : null}
            <Button
              title="Delete quiz"
              variant="danger"
              icon={{ ios: 'trash', android: 'delete', web: 'delete' }}
              onPress={confirmDelete}
              disabled={!editor.canDelete}
              isLoading={editor.isDeleting}
            />
          </GameCard>
        ) : null}

        <FormError message={editor.errorMessage} />
      </ScrollView>
    </ThemedView>
  );
}

const GoLiveHint = ({
  questionCount,
  otherLiveQuizTitle,
}: {
  questionCount: number;
  otherLiveQuizTitle: string | undefined;
}) => {
  const text = otherLiveQuizTitle
    ? `“${otherLiveQuizTitle}” is live. End it before putting this one live.`
    : questionCount === 0
      ? 'Add at least one question to go live.'
      : undefined;
  return text ? (
    <ThemedText type="small" themeColor="textSecondary">
      {text}
    </ThemedText>
  ) : null;
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  content: {
    gap: Spacing.four,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
