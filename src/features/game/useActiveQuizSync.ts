import { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';

import { subscribeToActiveQuizMeta, subscribeToLeaderboard } from './gameApi';
import { activeQuizMetaChanged, leaderboardChanged, selectActiveQuiz } from './gameSlice';

type ActiveQuizSyncOptions = {
  /** The leaderboard grows with the player count; only subscribe where it is shown. */
  withLeaderboard?: boolean;
};

/** Keeps `game.active` in sync with the Realtime Database `activeQuiz` while mounted. */
export const useActiveQuizSync = ({ withLeaderboard = false }: ActiveQuizSyncOptions = {}) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsubscribers = [subscribeToActiveQuizMeta((meta) => dispatch(activeQuizMetaChanged(meta)))];
    if (withLeaderboard) {
      unsubscribers.push(subscribeToLeaderboard((entries) => dispatch(leaderboardChanged(entries))));
    }
    // The state is kept after unmount: another screen (e.g. home under the game
    // screen) may still be showing it from its own subscription.
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [dispatch, withLeaderboard]);

  return useAppSelector(selectActiveQuiz);
};
