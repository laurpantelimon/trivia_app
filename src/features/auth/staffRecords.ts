/**
 * Staff entries: one Firestore collection per role (`admins`, `moderators`,
 * `observers`, see `STAFF_COLLECTIONS`).
 *
 * 1. An admin invites someone: `{collection}/{invitationCode}` with their email,
 *    plus the RTDB role mirror `staffByEmail/{emailKey}`. The code is the id.
 * 2. The person enters their email and the code; `findStaffInvitation` opens the
 *    invitation by id (allowed without a login) and checks the email.
 * 3. They create their login; `claimStaffInvitation` copies the invitation to
 *    `{collection}/{uid}` and deletes it, in one batch (rules check that the
 *    invitation's email is the login's email).
 * 4. From then on the role is read from `{collection}/{uid}`.
 */
import { ref, remove, set } from '@react-native-firebase/database';
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  writeBatch,
} from '@react-native-firebase/firestore';

import { generateInvitationCode, isInvitationCode } from '@/features/staff/invitationCode';
import { database, firestore } from '@/services/firebase';
import { rtdbPaths, toEmailKey } from '@/services/firebase/paths';
import {
  STAFF_COLLECTIONS,
  type NewStaffDocument,
  type StaffMember,
  type StaffRole,
} from '@/types/account';
import { withTimeout } from '@/utils/withTimeout';

const TIMEOUT_MS = 10_000;

/** When someone has entries in several collections, the highest role wins. */
const ROLES_BY_PRIORITY: readonly StaffRole[] = ['admin', 'moderator', 'observer'];

const normalizeStaffEmail = (email: string) => email.trim().toLowerCase();

const staffDocumentRef = (role: StaffRole, id: string) =>
  doc(firestore, STAFF_COLLECTIONS[role], id);

const describeError = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : String(error);

// ---------------------------------------------------------------------------
// 1. Invite (admin only, enforced by rules)
// ---------------------------------------------------------------------------

type NewInvitation = Pick<StaffMember, 'email' | 'displayName' | 'role' | 'createdBy'>;

/** Picks an unused code; a collision is astronomically unlikely but cheap to rule out. */
const newInvitationCode = async (role: StaffRole) => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const code = generateInvitationCode();
    const existing = await getDoc(staffDocumentRef(role, code));
    if (!existing.exists()) return code;
  }
  throw new Error('Could not generate a unique invitation code');
};

/**
 * Creates the invitation `{collection}/{code}` and its RTDB role mirror; removes the
 * invitation again if the mirror fails. Returns the invitation code to hand out.
 */
export const createStaffInvitation = async ({
  email,
  displayName,
  role,
  createdBy,
}: NewInvitation) => {
  const normalizedEmail = normalizeStaffEmail(email);
  const code = await withTimeout(newInvitationCode(role), TIMEOUT_MS, 'Generating invitation');
  const invitationRef = staffDocumentRef(role, code);
  const invitation: NewStaffDocument = {
    id: code,
    email: normalizedEmail,
    displayName,
    role,
    createdBy,
    createdAt: serverTimestamp(),
  };
  const mirrorRef = ref(database, rtdbPaths.staffByEmail(toEmailKey(normalizedEmail)));

  await withTimeout(setDoc(invitationRef, invitation), TIMEOUT_MS, 'Creating staff invitation');
  try {
    await withTimeout(set(mirrorRef, { role }), TIMEOUT_MS, 'Saving staff role');
  } catch (error) {
    await deleteDoc(invitationRef).catch(() => undefined);
    await remove(mirrorRef).catch(() => undefined);
    throw error;
  }
  return code;
};

// ---------------------------------------------------------------------------
// 2. Verify (before the person has a login)
// ---------------------------------------------------------------------------

export type StaffInvitation = {
  code: string;
  role: StaffRole;
  email: string;
  displayName: string;
  createdBy: string;
};

/**
 * Opens the invitation with this code (in whichever role's collection it is) and
 * returns it only if it was issued for this email; otherwise `null`.
 */
export const findStaffInvitation = async (
  email: string,
  code: string,
): Promise<StaffInvitation | null> => {
  if (!isInvitationCode(code)) return null;
  const normalizedEmail = normalizeStaffEmail(email);
  const snapshots = await withTimeout(
    Promise.all(ROLES_BY_PRIORITY.map((role) => getDoc(staffDocumentRef(role, code)))),
    TIMEOUT_MS,
    'Checking invitation',
  );
  const index = snapshots.findIndex((snapshot) => snapshot.exists());
  const role = ROLES_BY_PRIORITY[index];
  const data = snapshots[index]?.data();
  if (!role || !data || data.email !== normalizedEmail) return null;

  const displayName: unknown = data.displayName;
  const createdBy: unknown = data.createdBy;
  return {
    code,
    role,
    email: normalizedEmail,
    displayName: typeof displayName === 'string' ? displayName : normalizedEmail,
    createdBy: typeof createdBy === 'string' ? createdBy : '',
  };
};

// ---------------------------------------------------------------------------
// 3. Claim (right after creating the login)
// ---------------------------------------------------------------------------

/** Turns the invitation into the active entry `{collection}/{uid}` (copy + delete in one batch). */
export const claimStaffInvitation = async (userId: string, invitation: StaffInvitation) => {
  const activeEntry: NewStaffDocument = {
    id: userId,
    email: invitation.email,
    displayName: invitation.displayName,
    role: invitation.role,
    createdBy: invitation.createdBy,
    createdAt: serverTimestamp(),
    invitationId: invitation.code,
  };
  const batch = writeBatch(firestore);
  batch.set(staffDocumentRef(invitation.role, userId), activeEntry);
  batch.delete(staffDocumentRef(invitation.role, invitation.code));
  await withTimeout(batch.commit(), TIMEOUT_MS, 'Activating staff entry');
};

// ---------------------------------------------------------------------------
// 4. Role lookup
// ---------------------------------------------------------------------------

/**
 * The role of the active entry `{collection}/{uid}` (highest if several), or
 * `null`. Collections are read independently so one failing read doesn't hide an
 * entry in another; if every read fails, the error is thrown.
 */
export const getStaffRole = async (userId: string): Promise<StaffRole | null> => {
  const results = await withTimeout(
    Promise.allSettled(ROLES_BY_PRIORITY.map((role) => getDoc(staffDocumentRef(role, userId)))),
    TIMEOUT_MS,
    'Reading staff entries',
  );

  if (__DEV__) {
    const summary = ROLES_BY_PRIORITY.map((role, i) => {
      const result = results[i];
      const path = `${STAFF_COLLECTIONS[role]}/${userId}`;
      if (result?.status === 'rejected') return `${path}: error ${describeError(result.reason)}`;
      return `${path}: ${result?.value.exists() ? 'found' : 'not found'}`;
    });
    console.log(`[role] staff lookup\n  ${summary.join('\n  ')}`);
  }

  for (const [i, role] of ROLES_BY_PRIORITY.entries()) {
    const result = results[i];
    // The collection is the role.
    if (result?.status === 'fulfilled' && result.value.exists()) return role;
  }
  const failure = results.find((result) => result.status === 'rejected');
  if (failure?.status === 'rejected' && results.every((result) => result.status === 'rejected')) {
    throw failure.reason;
  }
  return null;
};
