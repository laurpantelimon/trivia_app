import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  MAX_OPTIONS,
  MIN_OPTIONS,
  OPTION_MAX_LENGTH,
  QUESTION_TEXT_MAX_LENGTH,
  QUESTION_TEXT_MIN_LENGTH,
  type QuizQuestion,
} from '@/types/quiz';

import {
  addQuizQuestion,
  quizErrorCleared,
  selectIsQuizRequestPending,
  selectQuizRequestError,
} from './quizSlice';

const emptyOptions = () => Array.from({ length: MAX_OPTIONS }, () => '');

const isWithin = (value: string, min: number, max: number) =>
  value.length >= min && value.length <= max;

/**
 * "Add question" form: question text, up to four options (at least two filled)
 * and which of the filled options is correct. Empty option fields are dropped.
 */
export const useAddQuestionForm = (quizId: string, questions: readonly QuizQuestion[]) => {
  const dispatch = useAppDispatch();
  const isPending = useAppSelector((state) => selectIsQuizRequestPending(state, 'addQuestion'));
  const errorMessage = useAppSelector((state) => selectQuizRequestError(state, 'addQuestion'));
  const [text, setText] = useState('');
  const [options, setOptions] = useState(emptyOptions);
  /** Index into the full (unfiltered) option fields. */
  const [correctField, setCorrectField] = useState(0);

  const filledFields = options.flatMap((option, index) => (option.trim() ? [index] : []));
  const isCorrectFieldFilled = filledFields.includes(correctField);
  const canSubmit =
    isWithin(text.trim(), QUESTION_TEXT_MIN_LENGTH, QUESTION_TEXT_MAX_LENGTH) &&
    filledFields.length >= MIN_OPTIONS &&
    options.every((option) => option.trim().length <= OPTION_MAX_LENGTH) &&
    isCorrectFieldFilled &&
    !isPending;

  const clearError = () => {
    if (errorMessage) dispatch(quizErrorCleared());
  };

  const changeText = (value: string) => {
    setText(value);
    clearError();
  };

  const changeOption = (index: number, value: string) => {
    setOptions((current) => current.map((option, i) => (i === index ? value : option)));
    clearError();
  };

  const submit = async () => {
    if (!canSubmit) return;
    const question = {
      order: questions.reduce((max, { order }) => Math.max(max, order), 0) + 1,
      text: text.trim(),
      options: filledFields.map((index) => options[index]?.trim() ?? ''),
      correctOption: filledFields.indexOf(correctField),
    };
    const result = await dispatch(addQuizQuestion({ quizId, question }));
    if (!addQuizQuestion.fulfilled.match(result)) return;
    setText('');
    setOptions(emptyOptions());
    setCorrectField(0);
  };

  return {
    text,
    options,
    correctField,
    filledFields,
    changeText,
    changeOption,
    chooseCorrectField: setCorrectField,
    canSubmit,
    isPending,
    errorMessage,
    submit,
  };
};
