import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { getAuthErrorMessage } from '@/features/auth/authApi';
import type { Quiz, QuizQuestion } from '@/types/quiz';

import { addQuestion, createQuiz, deleteQuiz, removeQuestion, type NewQuestion } from './quizApi';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export type QuizRequest = 'create' | 'delete' | 'addQuestion' | 'removeQuestion';

type QuizState = {
  /** Newest first, filled by `useQuizzesSync`. */
  list: Quiz[];
  isLoaded: boolean;
  /** Questions of the quizzes being edited, filled by `useQuizQuestionsSync`. */
  questionsByQuiz: Record<string, QuizQuestion[]>;
  pendingRequest: QuizRequest | null;
  error: { request: QuizRequest; message: string } | null;
};

const initialState = (): QuizState => ({
  list: [],
  isLoaded: false,
  questionsByQuiz: {},
  pendingRequest: null,
  error: null,
});

// ---------------------------------------------------------------------------
// Thunks
// ---------------------------------------------------------------------------

type ThunkConfig = { rejectValue: string };

const toErrorMessage = getAuthErrorMessage;

/** Resolves to the new quiz's id. */
export const createNewQuiz = createAsyncThunk<
  string,
  { title: string; createdBy: string },
  ThunkConfig
>('quiz/create', async (quiz, { rejectWithValue }) => {
  try {
    return await createQuiz(quiz);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

export const deleteExistingQuiz = createAsyncThunk<void, string, ThunkConfig>(
  'quiz/delete',
  async (quizId, { rejectWithValue }) => {
    try {
      await deleteQuiz(quizId);
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  },
);

export const addQuizQuestion = createAsyncThunk<
  void,
  { quizId: string; question: NewQuestion },
  ThunkConfig
>('quiz/addQuestion', async ({ quizId, question }, { rejectWithValue }) => {
  try {
    await addQuestion(quizId, question);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

export const removeQuizQuestion = createAsyncThunk<
  void,
  { quizId: string; questionId: string },
  ThunkConfig
>('quiz/removeQuestion', async ({ quizId, questionId }, { rejectWithValue }) => {
  try {
    await removeQuestion(quizId, questionId);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

const requestThunks = [
  ['create', createNewQuiz],
  ['delete', deleteExistingQuiz],
  ['addQuestion', addQuizQuestion],
  ['removeQuestion', removeQuizQuestion],
] as const;

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    quizzesChanged: (state, action: PayloadAction<Quiz[]>) => {
      state.list = action.payload;
      state.isLoaded = true;
    },
    questionsChanged: (
      state,
      action: PayloadAction<{ quizId: string; questions: QuizQuestion[] }>,
    ) => {
      state.questionsByQuiz[action.payload.quizId] = action.payload.questions;
    },
    questionsReleased: (state, action: PayloadAction<string>) => {
      delete state.questionsByQuiz[action.payload];
    },
    quizErrorCleared: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    for (const [request, thunk] of requestThunks) {
      builder
        .addCase(thunk.pending, (state) => {
          state.pendingRequest = request;
          state.error = null;
        })
        .addCase(thunk.fulfilled, (state) => {
          state.pendingRequest = null;
        })
        .addCase(thunk.rejected, (state, action) => {
          state.pendingRequest = null;
          state.error = { request, message: action.payload ?? toErrorMessage(action.error) };
        });
    }
  },
});

export const { quizzesChanged, questionsChanged, questionsReleased, quizErrorCleared } =
  quizSlice.actions;
export const quizReducer = quizSlice.reducer;

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

type StateWithQuiz = { quiz: QuizState };

export const selectQuizzes = (state: StateWithQuiz) => state.quiz.list;
export const selectAreQuizzesLoaded = (state: StateWithQuiz) => state.quiz.isLoaded;

export const selectQuiz = (state: StateWithQuiz, quizId: string) =>
  state.quiz.list.find((quiz) => quiz.id === quizId);

/** `undefined` until the questions have loaded. */
export const selectQuizQuestions = (state: StateWithQuiz, quizId: string) =>
  state.quiz.questionsByQuiz[quizId];

export const selectIsQuizRequestPending = (state: StateWithQuiz, request: QuizRequest) =>
  state.quiz.pendingRequest === request;

export const selectQuizRequestError = (state: StateWithQuiz, request: QuizRequest) =>
  state.quiz.error?.request === request ? state.quiz.error.message : undefined;
