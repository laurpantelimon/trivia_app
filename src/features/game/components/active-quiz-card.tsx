import { ActivityIndicator } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { GameCard } from '@/components/ui/game-card';
import { useTheme } from '@/hooks/use-theme';

import { useActiveQuiz } from '../useActiveQuiz';
import { StatusPill } from './status-pill';

const FOOTBALL_ICON = { ios: 'soccerball', android: 'sports_soccer', web: 'sports_soccer' } as const;
const ARROW_ICON = { ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' } as const;
const LIST_ICON = { ios: 'list.bullet', android: 'list', web: 'list' } as const;

/** Home card for the quiz running right now, adapted to the account's role. */
export const ActiveQuizCard = () => {
  const theme = useTheme();
  const activeQuizState = useActiveQuiz();
  const { meta, isLoaded } = activeQuizState.activeQuiz;

  return (
    <GameCard
      title="Live quiz"
      subtitle={
        meta
          ? `${meta.title} · ${meta.questionCount === 1 ? '1 question' : `${meta.questionCount} questions`}`
          : 'No quiz running'
      }
      icon={FOOTBALL_ICON}
      iconColor={theme.accent}>
      {meta ? <StatusPill status={meta.status} /> : null}
      {isLoaded ? <ActiveQuizBody {...activeQuizState} /> : <ActivityIndicator color={theme.accent} />}
      <FormError message={activeQuizState.errorMessage} />
    </GameCard>
  );
};

type ActiveQuizBodyProps = ReturnType<typeof useActiveQuiz>;

const ActiveQuizBody = (props: ActiveQuizBodyProps) => {
  if (props.canHost) return <HostBody {...props} />;
  if (props.canJoin) return <PlayerBody {...props} />;
  return props.activeQuiz.meta ? (
    <Button title="Watch the quiz" icon={ARROW_ICON} onPress={props.openGame} />
  ) : (
    <Message text="No quiz is running right now." />
  );
};

const HostBody = ({ activeQuiz, openGame, openQuizzes }: ActiveQuizBodyProps) => (
  <>
    {activeQuiz.meta ? (
      <Button title="Open the live quiz" icon={ARROW_ICON} onPress={openGame} />
    ) : (
      <Message text="Create a quiz, add its questions, then put it live from Quizzes. Only one quiz runs at a time." />
    )}
    <Button title="Quizzes" variant="neutral" icon={LIST_ICON} onPress={openQuizzes} />
  </>
);

const PlayerBody = ({
  activeQuiz,
  joinedQuizId,
  hasJoined,
  isJoining,
  openGame,
  joinQuiz,
}: ActiveQuizBodyProps) => {
  const { meta } = activeQuiz;

  if (joinedQuizId === undefined) return null;

  if (hasJoined) {
    return <Button title="Go to the quiz" icon={ARROW_ICON} onPress={openGame} />;
  }

  if (joinedQuizId !== null) {
    return <Message text="Thanks for playing! Each player takes part in one quiz only." />;
  }

  if (!meta) {
    return <Message text="No quiz is running right now. Your host will start one soon." />;
  }

  if (meta.status === 'closed') {
    return <Message text="The quiz is paused. You can join when it reopens." />;
  }

  return (
    <>
      <Message text={`“${meta.title}” is live! You can play one quiz only, so once you join, this is your quiz.`} />
      <Button title="Join the quiz" icon={FOOTBALL_ICON} onPress={joinQuiz} isLoading={isJoining} />
    </>
  );
};

const Message = ({ text }: { text: string }) => (
  <ThemedText type="small" themeColor="textSecondary">
    {text}
  </ThemedText>
);
