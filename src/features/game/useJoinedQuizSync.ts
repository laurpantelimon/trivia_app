import { useEffect } from 'react';

import { selectCurrentUser } from '@/features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

import { subscribeToJoinedQuiz } from './gameApi';
import { joinedQuizChanged } from './gameSlice';

/** Keeps `game.joinedQuizId` in sync with the signed-in account's `joinedQuiz/{uid}`. */
export const useJoinedQuizSync = () => {
  const dispatch = useAppDispatch();
  const userId = useAppSelector(selectCurrentUser)?.uid;

  useEffect(() => {
    if (!userId) return;
    dispatch(joinedQuizChanged(undefined));
    const unsubscribe = subscribeToJoinedQuiz(userId, (quizId) =>
      dispatch(joinedQuizChanged(quizId)),
    );
    return () => {
      unsubscribe();
      dispatch(joinedQuizChanged(undefined));
    };
  }, [dispatch, userId]);
};
