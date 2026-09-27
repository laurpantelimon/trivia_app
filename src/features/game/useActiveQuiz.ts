import { router } from 'expo-router';

import {
  selectCanHostGame,
  selectCanJoinGame,
  selectCurrentUser,
} from '@/features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

import {
  joinActiveQuiz,
  selectGameRequestError,
  selectHasJoinedActiveQuiz,
  selectIsGameRequestPending,
  selectJoinedQuizId,
} from './gameSlice';
import { useActiveQuizSync } from './useActiveQuizSync';

/** What the signed-in account can do with the active quiz, and the actions to do it. */
export const useActiveQuiz = () => {
  const dispatch = useAppDispatch();
  const activeQuiz = useActiveQuizSync();
  const user = useAppSelector(selectCurrentUser);
  const canHost = useAppSelector(selectCanHostGame);
  const canJoin = useAppSelector(selectCanJoinGame);
  const joinedQuizId = useAppSelector(selectJoinedQuizId);
  const hasJoined = useAppSelector(selectHasJoinedActiveQuiz);
  const isJoining = useAppSelector((state) => selectIsGameRequestPending(state, 'join'));
  const joinError = useAppSelector((state) => selectGameRequestError(state, 'join'));

  const openGame = () => router.push('/game');
  const openQuizzes = () => router.push('/quizzes');

  const joinQuiz = async () => {
    const quizId = activeQuiz.meta?.quizId;
    if (!user || !quizId) return;
    const player = { id: user.uid, displayName: user.displayName ?? 'Player' };
    const result = await dispatch(joinActiveQuiz({ quizId, player }));
    if (joinActiveQuiz.fulfilled.match(result)) openGame();
  };

  return {
    activeQuiz,
    canHost,
    canJoin,
    joinedQuizId,
    hasJoined,
    isJoining,
    errorMessage: joinError,
    openGame,
    openQuizzes,
    joinQuiz,
  };
};
