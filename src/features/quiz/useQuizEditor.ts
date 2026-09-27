import { router } from 'expo-router';
import { useState } from 'react';

import { selectCurrentUser } from '@/features/auth/authSlice';
import {
  selectGameRequestError,
  selectIsGameRequestPending,
  startActiveQuiz,
} from '@/features/game/gameSlice';
import { useActiveQuizSync } from '@/features/game/useActiveQuizSync';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

import {
  deleteExistingQuiz,
  removeQuizQuestion,
  selectIsQuizRequestPending,
  selectQuiz,
  selectQuizRequestError,
} from './quizSlice';
import { useQuizQuestionsSync } from './useQuizQuestionsSync';
import { useQuizzesSync } from './useQuizzesSync';

/** One quiz on the staff detail screen: its questions and what can be done with it. */
export const useQuizEditor = (quizId: string) => {
  const dispatch = useAppDispatch();
  const { isLoaded: areQuizzesLoaded } = useQuizzesSync();
  const quiz = useAppSelector((state) => selectQuiz(state, quizId));
  const questions = useQuizQuestionsSync(quizId);
  const activeQuiz = useActiveQuizSync();
  const hostId = useAppSelector(selectCurrentUser)?.uid;
  const [removingQuestionId, setRemovingQuestionId] = useState<string>();

  const isGoingLive = useAppSelector((state) => selectIsGameRequestPending(state, 'start'));
  const isDeleting = useAppSelector((state) => selectIsQuizRequestPending(state, 'delete'));
  const goLiveError = useAppSelector((state) => selectGameRequestError(state, 'start'));
  const deleteError = useAppSelector((state) => selectQuizRequestError(state, 'delete'));
  const removeError = useAppSelector((state) => selectQuizRequestError(state, 'removeQuestion'));

  const isDraft = quiz?.status === 'draft';
  const questionCount = questions?.length ?? 0;
  const otherLiveQuizTitle =
    activeQuiz.meta && activeQuiz.meta.quizId !== quizId ? activeQuiz.meta.title : undefined;
  const canGoLive =
    isDraft && questionCount > 0 && activeQuiz.isLoaded && activeQuiz.meta === null && !isDeleting;
  const canDelete = quiz !== undefined && quiz.status !== 'active' && !isGoingLive;

  const goLive = async () => {
    if (!quiz || !hostId || !canGoLive) return;
    const result = await dispatch(startActiveQuiz({ quiz: { ...quiz, questionCount }, hostId }));
    if (startActiveQuiz.fulfilled.match(result)) router.replace('/game');
  };

  const deleteQuiz = async () => {
    if (!canDelete) return;
    const result = await dispatch(deleteExistingQuiz(quizId));
    if (deleteExistingQuiz.fulfilled.match(result) && router.canGoBack()) router.back();
  };

  const removeQuestion = async (questionId: string) => {
    if (!isDraft) return;
    setRemovingQuestionId(questionId);
    await dispatch(removeQuizQuestion({ quizId, questionId }));
    setRemovingQuestionId(undefined);
  };

  return {
    isLoaded: areQuizzesLoaded && questions !== undefined,
    quiz,
    questions: questions ?? [],
    isDraft,
    otherLiveQuizTitle,
    canGoLive,
    canDelete,
    isGoingLive,
    isDeleting,
    removingQuestionId,
    errorMessage: goLiveError ?? deleteError ?? removeError,
    goLive,
    deleteQuiz,
    removeQuestion,
    openLiveQuiz: () => router.push('/game'),
  };
};
