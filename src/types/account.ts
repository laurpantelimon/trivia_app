/**
 * Account types: roles, player entries (`players/{uid}`) and the signed-in
 * session. Staff roles live on the Firebase Auth account (custom claims) and in
 * the staff collections.
 */

import type { FieldValue, Timestamp } from '@react-native-firebase/firestore';

/**
 * What an account may do in the app:
 * - `player`: joins games and answers questions (every account from the player page);
 * - `observer`: watches games without playing;
 * - `moderator`: helps run games and keeps content/players in check;
 * - `admin`: full access, manages accounts and roles.
 *
 * Staff roles are set as a Firebase Auth custom claim (`role`) with the Admin SDK;
 * the app can never raise its own role.
 */
export const USER_ROLES = ['player', 'observer', 'moderator', 'admin'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const isUserRole = (value: unknown): value is UserRole =>
  typeof value === 'string' && USER_ROLES.some((role) => role === value);

/** Roles an email (staff) account can have; `player` accounts come from the player page. */
export const STAFF_ROLES = ['observer', 'moderator', 'admin'] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const isStaffRole = (value: unknown): value is StaffRole =>
  typeof value === 'string' && STAFF_ROLES.some((role) => role === value);

/**
 * Firestore collection per staff role: an account's staff record lives in the
 * collection of its role (`admins/{id}`, `moderators/{id}`, `observers/{id}`).
 */
export const STAFF_COLLECTIONS: Record<StaffRole, string> = {
  admin: 'admins',
  moderator: 'moderators',
  observer: 'observers',
};

/**
 * A staff entry, in the collection of its role (`admins/`, `moderators/`,
 * `observers/`). Two stages, both in the same collection:
 *
 * - **Invitation** — an admin adds the person before they have a login:
 *   `{collection}/{invitationCode}`, `id` = the 8-character code (see
 *   features/staff/invitationCode.ts), no `invitationId`.
 * - **Active entry** — when the person creates their login with that email, the
 *   invitation is copied to `{collection}/{uid}` (`id` = their uid,
 *   `invitationId` = the claimed invitation) and the invitation is deleted.
 *
 * Roles come only from active entries (keyed by uid). The role is also mirrored
 * in RTDB `staffByEmail/{emailKey}` (written by the admin at invitation time)
 * because Realtime Database rules can't read Firestore.
 */
export type StaffMember = {
  id: string;
  email: string;
  displayName: string;
  role: StaffRole;
  /** Admin who created the invitation (Firebase Auth uid). */
  createdBy: string;
  /** Milliseconds since the epoch. */
  createdAt: number;
  /** Set on active entries: the invitation this entry was claimed from. */
  invitationId?: string;
};

/** Exact shape of a staff entry document. */
export type StaffDocument = Omit<StaffMember, 'createdAt'> & {
  createdAt: Timestamp;
};

/** Data written when an invitation or active entry is created. */
export type NewStaffDocument = Omit<StaffDocument, 'createdAt'> & {
  createdAt: FieldValue;
};

/** A player created on the player page: `players/{uid}`. */
export type PlayerEntry = {
  id: string;
  displayName: string;
  role: 'player';
  /** Milliseconds since the epoch. */
  createdAt: number;
};

/** Exact shape of `players/{uid}`. */
export type PlayerEntryDocument = Omit<PlayerEntry, 'createdAt'> & {
  createdAt: Timestamp;
};

/** Data written when the entry is created; `createdAt` is the server-timestamp sentinel. */
export type NewPlayerEntryDocument = Omit<PlayerEntryDocument, 'createdAt'> & {
  createdAt: FieldValue;
};

/**
 * Serialisable snapshot of the Firebase Auth user for the current session — the
 * only auth-user shape that enters Redux. Fields are nullable because Firebase
 * may not have them yet (e.g. right after account creation).
 */
export type SessionUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
};
