import { router } from 'expo-router';
import { useState } from 'react';

import { selectCurrentUser } from '@/features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { QUIZ_TITLE_MAX_LENGTH, QUIZ_TITLE_MIN_LENGTH } from '@/types/quiz';

import {
  createNewQuiz,
  quizErrorCleared,
  selectIsQuizRequestPending,
  selectQuizRequestError,
} from './quizSlice';

const isValidQuizTitle = (title: string) => {
  const length = title.trim().length;
  return length >= QUIZ_TITLE_MIN_LENGTH && length <= QUIZ_TITLE_MAX_LENGTH;
};

/** Staff "New quiz" form: a title creates a draft quiz, then opens it to add questions. */
export const useCreateQuizForm = () => {
  const dispatch = useAppDispatch();
  const userId = useAppSelector(selectCurrentUser)?.uid;
  const isPending = useAppSelector((state) => selectIsQuizRequestPending(state, 'create'));
  const errorMessage = useAppSelector((state) => selectQuizRequestError(state, 'create'));
  const [title, setTitle] = useState('');

  const canSubmit = isValidQuizTitle(title) && !isPending && userId !== undefined;

  const changeTitle = (value: string) => {
    setTitle(value);
    if (errorMessage) dispatch(quizErrorCleared());
  };

  const submit = async () => {
    if (!canSubmit || !userId) return;
    const result = await dispatch(createNewQuiz({ title: title.trim(), createdBy: userId }));
    if (!createNewQuiz.fulfilled.match(result)) return;
    setTitle('');
    router.push({ pathname: '/quizzes/[quizId]', params: { quizId: result.payload } });
  };

  return { title, changeTitle, canSubmit, isPending, errorMessage, submit };
};
