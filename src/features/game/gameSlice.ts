import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { getAuthErrorMessage } from '@/features/auth/authApi';
import type { ActiveQuizMeta, GameStatus, LeaderboardEntry } from '@/types/game';
import type { Quiz } from '@/types/quiz';

import { endQuiz, joinQuiz, setActiveQuizStatus, startQuiz } from './gameApi';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** Live view of the active quiz, filled by `useActiveQuizSync`. */
export type ActiveQuiz = {
  isLoaded: boolean;
  /** `null` while no quiz runs. */
  meta: ActiveQuizMeta | null;
  leaderboard: LeaderboardEntry[];
};

export type GameRequest = 'start' | 'join' | 'status' | 'end';

type GameState = {
  active: ActiveQuiz;
  /** The one quiz this account joined; `undefined` while loading, `null` if none. */
  joinedQuizId: string | null | undefined;
  pendingRequest: GameRequest | null;
  error: { request: GameRequest; message: string } | null;
};

const initialState = (): GameState => ({
  active: { isLoaded: false, meta: null, leaderboard: [] },
  joinedQuizId: undefined,
  pendingRequest: null,
  error: null,
});

// ---------------------------------------------------------------------------
// Thunks
// ---------------------------------------------------------------------------

type ThunkConfig = { rejectValue: string };

// Firebase and app errors (auth/…, database/…, app/…) share one message mapper.
const toErrorMessage = getAuthErrorMessage;

export const startActiveQuiz = createAsyncThunk<
  void,
  { quiz: Pick<Quiz, 'id' | 'title' | 'questionCount'>; hostId: string },
  ThunkConfig
>('game/start', async ({ quiz, hostId }, { rejectWithValue }) => {
  try {
    await startQuiz(quiz, hostId);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

export const joinActiveQuiz = createAsyncThunk<
  void,
  { quizId: string; player: { id: string; displayName: string } },
  ThunkConfig
>('game/join', async ({ quizId, player }, { rejectWithValue }) => {
  try {
    await joinQuiz(quizId, player);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

export const changeGameStatus = createAsyncThunk<void, GameStatus, ThunkConfig>(
  'game/status',
  async (status, { rejectWithValue }) => {
    try {
      await setActiveQuizStatus(status);
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  },
);

export const endActiveQuiz = createAsyncThunk<void, string, ThunkConfig>(
  'game/end',
  async (quizId, { rejectWithValue }) => {
    try {
      await endQuiz(quizId);
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  },
);

const requestThunks = [
  ['start', startActiveQuiz],
  ['join', joinActiveQuiz],
  ['status', changeGameStatus],
  ['end', endActiveQuiz],
] as const;

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    activeQuizMetaChanged: (state, action: PayloadAction<ActiveQuizMeta | null>) => {
      state.active.meta = action.payload;
      state.active.isLoaded = true;
      if (!action.payload) state.active.leaderboard = [];
    },
    leaderboardChanged: (state, action: PayloadAction<LeaderboardEntry[]>) => {
      state.active.leaderboard = action.payload;
    },
    joinedQuizChanged: (state, action: PayloadAction<string | null | undefined>) => {
      state.joinedQuizId = action.payload;
    },
    gameErrorCleared: (state) => {
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

export const { activeQuizMetaChanged, leaderboardChanged, joinedQuizChanged, gameErrorCleared } =
  gameSlice.actions;
export const gameReducer = gameSlice.reducer;

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

type StateWithGame = { game: GameState };

export const selectActiveQuiz = (state: StateWithGame) => state.game.active;

export const selectJoinedQuizId = (state: StateWithGame) => state.game.joinedQuizId;

/** The account joined the quiz that is running right now. */
export const selectHasJoinedActiveQuiz = (state: StateWithGame) => {
  const activeQuizId = state.game.active.meta?.quizId;
  return activeQuizId !== undefined && state.game.joinedQuizId === activeQuizId;
};

export const selectIsGameRequestPending = (state: StateWithGame, request: GameRequest) =>
  state.game.pendingRequest === request;

export const selectGameRequestError = (state: StateWithGame, request: GameRequest) =>
  state.game.error?.request === request ? state.game.error.message : undefined;
