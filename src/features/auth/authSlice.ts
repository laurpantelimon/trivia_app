import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { SessionUser, UserRole } from '@/types/account';

import {
  continueAsPlayer,
  createStaffLogin,
  type StaffLoginDetails,
  getAuthErrorMessage,
  sendPasswordReset,
  signInWithEmail,
  signOutFromFirebase,
  type SignInCredentials,
} from './authApi';
import { hasPermission } from './permissions';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

type Session =
  | { status: 'restoring' } // waiting for Firebase to restore a persisted session
  | { status: 'signedOut' }
  | { status: 'signedIn'; user: SessionUser };

export type AuthRequest = 'signIn' | 'staffSignUp' | 'playerEntry' | 'signOut' | 'passwordReset';

type AuthState = {
  session: Session;
  /** Resolved role (see `userRole.ts`); `null` until resolved. */
  role: UserRole | null;
  pendingRequest: AuthRequest | null;
  error: { request: AuthRequest; message: string } | null;
  /** Address the last password-reset link was sent to, for the confirmation message. */
  passwordResetSentTo: string | null;
  /** Set when the app signed the player out because their account no longer exists. */
  sessionRevoked: boolean;
};

type StateWithAuth = { auth: AuthState };

const initialState = (): AuthState => ({
  session: { status: 'restoring' },
  role: null,
  pendingRequest: null,
  error: null,
  passwordResetSentTo: null,
  sessionRevoked: false,
});

// ---------------------------------------------------------------------------
// Thunks — every session change goes through here
// ---------------------------------------------------------------------------

type ThunkConfig = { rejectValue: string };

export const signIn = createAsyncThunk<SessionUser, SignInCredentials, ThunkConfig>(
  'auth/signIn',
  async (credentials, { rejectWithValue }) => {
    try {
      return await signInWithEmail(credentials);
    } catch (error) {
      return rejectWithValue(getAuthErrorMessage(error));
    }
  },
);

/** Staff create their own login for a verified invitation. */
export const signUpAsStaff = createAsyncThunk<SessionUser, StaffLoginDetails, ThunkConfig>(
  'auth/signUpAsStaff',
  async (details, { rejectWithValue }) => {
    try {
      return await createStaffLogin(details);
    } catch (error) {
      return rejectWithValue(getAuthErrorMessage(error));
    }
  },
);

/** Name-only player entry: same name → same account (created on first use). */
export const enterAsPlayer = createAsyncThunk<SessionUser, string, ThunkConfig>(
  'auth/enterAsPlayer',
  async (name, { rejectWithValue }) => {
    try {
      return await continueAsPlayer(name);
    } catch (error) {
      return rejectWithValue(getAuthErrorMessage(error));
    }
  },
);

export const signOut = createAsyncThunk<void, void, ThunkConfig & { state: StateWithAuth }>(
  'auth/signOut',
  async (_, { rejectWithValue }) => {
    try {
      await signOutFromFirebase();
    } catch (error) {
      return rejectWithValue(getAuthErrorMessage(error));
    }
  },
  // Players stay signed in; the UI hides sign-out for them and this guards any other caller.
  { condition: (_, { getState }) => selectCanSignOut(getState()) },
);

export const requestPasswordReset = createAsyncThunk<string, string, ThunkConfig>(
  'auth/passwordReset',
  async (email, { rejectWithValue }) => {
    try {
      return await sendPasswordReset(email);
    } catch (error) {
      return rejectWithValue(getAuthErrorMessage(error));
    }
  },
);

const requestThunks = [
  ['signIn', signIn],
  ['staffSignUp', signUpAsStaff],
  ['playerEntry', enterAsPlayer],
  ['signOut', signOut],
  ['passwordReset', requestPasswordReset],
] as const;

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Dispatched by `useAuthSession` from Firebase's `onAuthStateChanged`. */
    sessionChanged: (state, action: PayloadAction<SessionUser | null>) => {
      // While signing in/up, Firebase reports the user before the profile and the
      // player entry are written. The thunk's `fulfilled` sets the session once
      // everything is in place (and a failed player creation rolls the account back).
      const isCompletingSignIn =
        state.pendingRequest === 'signIn' ||
        state.pendingRequest === 'staffSignUp' ||
        state.pendingRequest === 'playerEntry';
      if (action.payload && isCompletingSignIn) return;

      state.session = action.payload
        ? { status: 'signedIn', user: action.payload }
        : { status: 'signedOut' };
      if (!action.payload) state.role = null;
    },
    userRoleChanged: (state, action: PayloadAction<UserRole | null>) => {
      state.role = action.payload;
    },
    /** The stored session belongs to an account that was deleted or disabled on the server. */
    sessionRevoked: (state) => {
      state.session = { status: 'signedOut' };
      state.role = null;
      state.sessionRevoked = true;
    },
    authErrorCleared: (state) => {
      state.error = null;
    },
    passwordResetDismissed: (state) => {
      state.passwordResetSentTo = null;
    },
  },
  extraReducers: (builder) => {
    for (const [request, thunk] of requestThunks) {
      builder
        .addCase(thunk.pending, (state) => {
          state.pendingRequest = request;
          state.error = null;
          state.sessionRevoked = false;
        })
        .addCase(thunk.rejected, (state, action) => {
          state.pendingRequest = null;
          state.error = { request, message: action.payload ?? getAuthErrorMessage(action.error) };
        });
    }

    builder
      .addCase(signIn.fulfilled, (state, action) => {
        state.pendingRequest = null;
        state.session = { status: 'signedIn', user: action.payload };
      })
      .addCase(signUpAsStaff.fulfilled, (state, action) => {
        state.pendingRequest = null;
        state.session = { status: 'signedIn', user: action.payload };
      })
      .addCase(enterAsPlayer.fulfilled, (state, action) => {
        state.pendingRequest = null;
        state.session = { status: 'signedIn', user: action.payload };
      })
      .addCase(signOut.fulfilled, (state) => {
        state.pendingRequest = null;
        state.session = { status: 'signedOut' };
        state.role = null;
        state.passwordResetSentTo = null;
      })
      .addCase(requestPasswordReset.fulfilled, (state, action) => {
        state.pendingRequest = null;
        state.passwordResetSentTo = action.payload;
      });
  },
});

export const {
  sessionChanged,
  userRoleChanged,
  sessionRevoked,
  authErrorCleared,
  passwordResetDismissed,
} = authSlice.actions;
export const authReducer = authSlice.reducer;

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectSessionStatus = (state: StateWithAuth) => state.auth.session.status;

export const selectIsSignedIn = (state: StateWithAuth) => state.auth.session.status === 'signedIn';

export const selectCurrentUser = (state: StateWithAuth) =>
  state.auth.session.status === 'signedIn' ? state.auth.session.user : undefined;

export const selectIsRequestPending = (state: StateWithAuth, request: AuthRequest) =>
  state.auth.pendingRequest === request;

export const selectRequestError = (state: StateWithAuth, request: AuthRequest) =>
  state.auth.error?.request === request ? state.auth.error.message : undefined;

export const selectPasswordResetSentTo = (state: StateWithAuth) => state.auth.passwordResetSentTo;

export const selectWasSessionRevoked = (state: StateWithAuth) => state.auth.sessionRevoked;

export const selectUserRole = (state: StateWithAuth) => state.auth.role;

/** Sign-out follows the role's permissions (see permissions.ts); hidden while the role is still unknown. */
export const selectCanSignOut = (state: StateWithAuth) => hasPermission(state.auth.role, 'signOut');

/** Only admins and moderators create quizzes and run the active one. */
export const selectCanHostGame = (state: StateWithAuth) =>
  hasPermission(state.auth.role, 'hostGame');

/** Only admins add moderators and observers. */
export const selectCanManageStaff = (state: StateWithAuth) =>
  hasPermission(state.auth.role, 'manageStaff');

/** Only players join the active quiz (and only one quiz, ever). */
export const selectCanJoinGame = (state: StateWithAuth) =>
  hasPermission(state.auth.role, 'joinGame');
