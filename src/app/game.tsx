import { router, Stack } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { GameCard } from '@/components/ui/game-card';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { selectCanHostGame, selectCurrentUser } from '@/features/auth/authSlice';
import { LeaderboardList } from '@/features/game/components/leaderboard-list';
import { StatusPill } from '@/features/game/components/status-pill';
import {
  changeGameStatus,
  endActiveQuiz,
  selectGameRequestError,
  selectIsGameRequestPending,
} from '@/features/game/gameSlice';
import { useActiveQuizSync } from '@/features/game/useActiveQuizSync';
import { useTheme } from '@/hooks/use-theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { ActiveQuizMeta } from '@/types/game';
import { confirmAction } from '@/utils/confirm';

/** The quiz running right now: status, host controls, live leaderboard. */
export default function GameScreen() {
  const theme = useTheme();
  const activeQuiz = useActiveQuizSync({ withLeaderboard: true });
  const userId = useAppSelector(selectCurrentUser)?.uid;
  const canHost = useAppSelector(selectCanHostGame);

  if (!activeQuiz.isLoaded) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator color={theme.accent} />
      </ThemedView>
    );
  }

  if (!activeQuiz.meta) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ title: 'Quiz' }} />
        <ThemedText themeColor="textSecondary">No quiz is running right now.</ThemedText>
      </ThemedView>
    );
  }

  const { meta, leaderboard } = activeQuiz;

  return (
    <ThemedView style={styles.screen}>
      <Stack.Screen options={{ title: meta.title }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summary}>
          <StatusPill status={meta.status} />
          <ThemedText themeColor="textSecondary">
            {leaderboard.length === 1 ? '1 player' : `${leaderboard.length} players`}
          </ThemedText>
        </View>

        {canHost ? <HostControls meta={meta} /> : null}

        <GameCard
          title="Leaderboard"
          icon={{ ios: 'trophy.fill', android: 'emoji_events', web: 'emoji_events' }}
          iconColor={theme.gold}>
          <LeaderboardList entries={leaderboard} currentUserId={userId} />
        </GameCard>
      </ScrollView>
    </ThemedView>
  );
}

const HostControls = ({ meta }: { meta: ActiveQuizMeta }) => {
  const dispatch = useAppDispatch();
  const isChangingStatus = useAppSelector((state) => selectIsGameRequestPending(state, 'status'));
  const isEnding = useAppSelector((state) => selectIsGameRequestPending(state, 'end'));
  const statusError = useAppSelector((state) => selectGameRequestError(state, 'status'));
  const endError = useAppSelector((state) => selectGameRequestError(state, 'end'));
  const isOpen = meta.status === 'open';

  const endQuiz = async () => {
    const result = await dispatch(endActiveQuiz(meta.quizId));
    if (endActiveQuiz.fulfilled.match(result) && router.canGoBack()) router.back();
  };

  const confirmEnd = async () => {
    const isConfirmed = await confirmAction({
      title: 'End this quiz?',
      message:
        'The final leaderboard is saved and the quiz stops for everyone. Players who joined can’t play another quiz.',
      confirmLabel: 'End quiz',
      isDestructive: true,
    });
    if (isConfirmed) await endQuiz();
  };

  return (
    <GameCard
      title="Host controls"
      subtitle="Pausing stops new players and answers. Ending saves the results and frees the way for the next quiz.">
      <Button
        title={isOpen ? 'Pause quiz' : 'Reopen quiz'}
        variant="neutral"
        onPress={() => dispatch(changeGameStatus(isOpen ? 'closed' : 'open'))}
        isLoading={isChangingStatus}
        disabled={isEnding}
      />
      <Button
        title="End quiz"
        variant="gold"
        icon={{ ios: 'flag.checkered', android: 'sports_score', web: 'sports_score' }}
        onPress={confirmEnd}
        isLoading={isEnding}
        disabled={isChangingStatus}
      />
      <FormError message={statusError ?? endError} />
    </GameCard>
  );
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
