import { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';

import { loadQuestions } from './quizApi';
import { questionsChanged, questionsReleased, selectQuizQuestions } from './quizSlice';

/** Keeps `quiz.questionsByQuiz[quizId]` from Firestore: read on mount and after this device's writes. */
export const useQuizQuestionsSync = (quizId: string) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsubscribe = loadQuestions(quizId, (questions) =>
      dispatch(questionsChanged({ quizId, questions })),
    );
    return () => {
      unsubscribe();
      dispatch(questionsReleased(quizId));
    };
  }, [dispatch, quizId]);

  return useAppSelector((state) => selectQuizQuestions(state, quizId));
};
