import {
  createUserWithEmailAndPassword,
  deleteUser,
  reload,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
  type User,
} from '@react-native-firebase/auth';

import { auth } from '@/services/firebase';
import type { SessionUser } from '@/types/account';
import { QUIZ_ALREADY_ACTIVE_ERROR_CODE } from '@/utils/appErrors';
import { TIMEOUT_ERROR_CODE, withTimeout } from '@/utils/withTimeout';

import { derivePlayerCredentials } from './playerCredentials';
import { createPlayerEntry, ensurePlayerEntry } from './playerDocuments';
import { claimStaffInvitation, type StaffInvitation } from './staffRecords';
import { normalizeDisplayName, normalizeEmail } from './validation';

export type SignInCredentials = {
  email: string;
  password: string;
};

type NewPlayerAccount = SignInCredentials & {
  displayName: string;
};

export const toSessionUser = (user: User, overrides: Partial<SessionUser> = {}): SessionUser => ({
  uid: user.uid,
  email: user.email,
  displayName: user.displayName,
  emailVerified: user.emailVerified,
  ...overrides,
});

export const signInWithEmail = async ({ email, password }: SignInCredentials) => {
  const { user } = await signInWithEmailAndPassword(auth, normalizeEmail(email), password);
  return toSessionUser(user);
};

/**
 * Creates a name-only player: the Firebase Auth account and its Firestore entry
 * `players/{uid}`. If the entry can't be written, the new account is deleted
 * again so the player can simply retry instead of ending up half-created.
 * (Staff accounts are created by admins, see features/staff.)
 */
const createPlayerAccount = async ({ displayName, email, password }: NewPlayerAccount) => {
  const name = normalizeDisplayName(displayName);
  const { user } = await createUserWithEmailAndPassword(auth, normalizeEmail(email), password);
  try {
    await updateProfile(user, { displayName: name });
    await createPlayerEntry({ id: user.uid, displayName: name });
  } catch (error) {
    await deleteUser(user).catch(() => signOutFromFirebase());
    throw error;
  }
  // updateProfile does not re-fire onAuthStateChanged, so return the name explicitly.
  return toSessionUser(user, { displayName: name });
};

/** Signs in to an existing player account, restoring its entry if it has none. */
const signInAsPlayer = async (credentials: SignInCredentials, rawName: string) => {
  const player = await signInWithEmail(credentials);
  await ensurePlayerEntry({
    id: player.uid,
    displayName: player.displayName ?? normalizeDisplayName(rawName),
  });
  return player;
};

export type StaffLoginDetails = {
  invitation: StaffInvitation;
  password: string;
};

/**
 * Creates a staff member's login for the email of their (already verified)
 * invitation and claims the invitation, which links the login to the staff entry.
 * If claiming fails, the new login is deleted again so they can retry.
 */
export const createStaffLogin = async ({ invitation, password }: StaffLoginDetails) => {
  const { user } = await createUserWithEmailAndPassword(auth, invitation.email, password);
  try {
    await updateProfile(user, { displayName: invitation.displayName });
    await claimStaffInvitation(user.uid, invitation);
    return toSessionUser(user, { displayName: invitation.displayName });
  } catch (error) {
    await deleteUser(user).catch(() => signOutFromFirebase());
    throw error;
  }
};

/** Sign-in errors meaning "no account for these credentials yet". */
const UNKNOWN_ACCOUNT_CODES = new Set([
  'auth/invalid-credential',
  'auth/invalid-login-credentials',
  'auth/user-not-found',
  'auth/wrong-password',
]);

/**
 * Name-only entry for players: signs in to the account derived from the name,
 * creating it (and its `players/{uid}` entry) the first time.
 */
export const continueAsPlayer = async (rawName: string) => {
  const credentials = derivePlayerCredentials(rawName);
  try {
    return await signInAsPlayer(credentials, rawName);
  } catch (error) {
    const code = getErrorCode(error);
    if (code === undefined || !UNKNOWN_ACCOUNT_CODES.has(code)) throw error;
  }

  try {
    return await createPlayerAccount({ displayName: rawName, ...credentials });
  } catch (error) {
    // Someone created the same name a moment ago: it's the same player, sign in.
    if (getErrorCode(error) === 'auth/email-already-in-use') {
      return signInAsPlayer(credentials, rawName);
    }
    throw error;
  }
};

export const signOutFromFirebase = () => firebaseSignOut(auth);

/** Errors meaning the account behind a cached session no longer exists or may not sign in. */
const REVOKED_SESSION_CODES = new Set([
  'auth/user-not-found',
  'auth/user-disabled',
  'auth/user-token-expired',
  'auth/invalid-user-token',
]);

const SESSION_CHECK_TIMEOUT_MS = 5000;

export type SessionCheckResult = 'valid' | 'revoked' | 'unverified';

/**
 * Firebase restores a session from the device cache without asking the server,
 * so a deleted or disabled account still looks signed in. `reload` hits the
 * server and fails for those accounts.
 *
 * - `revoked`: the server rejected the account — sign the player out.
 * - `unverified`: offline, slow or an unexpected error — keep the cached session
 *   rather than locking an offline player out; it is checked again on next launch.
 */
export const verifyStoredSession = async (user: User): Promise<SessionCheckResult> => {
  try {
    await withTimeout(reload(user), SESSION_CHECK_TIMEOUT_MS, 'Session check');
    return 'valid';
  } catch (error) {
    const code = getErrorCode(error);
    return code !== undefined && REVOKED_SESSION_CODES.has(code) ? 'revoked' : 'unverified';
  }
};

export const sendPasswordReset = async (email: string) => {
  const normalizedEmail = normalizeEmail(email);
  await sendPasswordResetEmail(auth, normalizedEmail);
  return normalizedEmail;
};

const getErrorCode = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
    ? error.code
    : undefined;

const toFriendlyMessage = (error: unknown) => {
  switch (getErrorCode(error)) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email or password is incorrect.';
    case 'auth/invalid-email':
      return 'That email address doesn’t look right.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in.';
    case 'auth/weak-password':
      return 'Choose a stronger password.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/network-request-failed':
      return 'No connection. Check your internet and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.';
    case 'auth/operation-not-allowed':
      return 'Email sign-in is not enabled for this app yet.';
    case 'firestore/permission-denied':
      return 'We couldn’t create your player profile. Please try again later.';
    case 'database/permission-denied':
      return 'You can’t do that in this quiz. It may be closed, or you may have already played another quiz.';
    case QUIZ_ALREADY_ACTIVE_ERROR_CODE:
      return 'Another quiz is already running. End it before starting a new one.';
    case 'firestore/unavailable':
      return 'No connection. Check your internet and try again.';
    case 'firestore/not-found':
    case TIMEOUT_ERROR_CODE:
      return 'The server didn’t respond, so your account wasn’t created. Check your connection and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
};

/**
 * User-facing message for an auth failure. In development builds the raw Firebase
 * error is also logged and its code appended, so failures can be diagnosed.
 */
export const getAuthErrorMessage = (error: unknown) => {
  const message = toFriendlyMessage(error);
  if (!__DEV__) return message;

  console.warn('[auth] request failed', error);
  const detail = getErrorCode(error) ?? (error instanceof Error ? error.message : String(error));
  return `${message} [${detail}]`;
};
