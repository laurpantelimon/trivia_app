import { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';

import { loadQuizzes } from './quizApi';
import { quizzesChanged, selectAreQuizzesLoaded, selectQuizzes } from './quizSlice';

/** Keeps `quiz.list` with Firestore `quizzes`: read on mount and after this device's writes (staff screens only). */
export const useQuizzesSync = () => {
  const dispatch = useAppDispatch();

  useEffect(
    () => loadQuizzes((quizzes) => dispatch(quizzesChanged(quizzes))),
    [dispatch],
  );

  return {
    quizzes: useAppSelector(selectQuizzes),
    isLoaded: useAppSelector(selectAreQuizzesLoaded),
  };
};
