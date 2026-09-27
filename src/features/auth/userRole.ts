import { getIdTokenResult, type User } from '@react-native-firebase/auth';

import { isUserRole, type UserRole } from '@/types/account';
import { withTimeout } from '@/utils/withTimeout';

import { getPlayerEntryRole } from './playerDocuments';
import { getStaffRole } from './staffRecords';

/** Accounts with neither a role claim nor a player entry can watch and sign out, but not host. */
const DEFAULT_ROLE: UserRole = 'observer';

const LOOKUP_TIMEOUT_MS = 5000;

/**
 * The `role` custom claim on the Firebase Auth token, set by an admin with the
 * Admin SDK. The token is refreshed so a new claim is picked up; offline, the
 * cached token is used.
 */
const getClaimedRole = async (user: User): Promise<UserRole | null> => {
  const token = await withTimeout(
    getIdTokenResult(user, true),
    LOOKUP_TIMEOUT_MS,
    'Refreshing ID token',
  ).catch(() => getIdTokenResult(user));
  const claimedRole: unknown = token.claims.role;
  return isUserRole(claimedRole) ? claimedRole : null;
};

/**
 * An account's role, in priority order:
 * 1. the `role` custom claim (staff, or a promoted player);
 * 2. the active staff entry `{admins|moderators|observers}/{uid}`;
 * 3. the `role` saved in the account's player entry `players/{uid}` (`player`);
 * 4. otherwise `observer`.
 */
export const resolveUserRole = async (user: User): Promise<UserRole> => {
  const warnAndSkip = (label: string) => (error: unknown) => {
    console.warn(`Could not load ${label}`, error);
    return null;
  };
  const [claimedRole, staffRole, playerRole] = await Promise.all([
    getClaimedRole(user),
    getStaffRole(user.uid).catch(warnAndSkip('staff entry')),
    getPlayerEntryRole(user.uid).catch(warnAndSkip('player entry')),
  ]);
  const role = claimedRole ?? staffRole ?? playerRole ?? DEFAULT_ROLE;
  if (__DEV__) {
    console.log(
      `[role] ${user.email ?? '(no email)'} → ${role}` +
        ` (claim: ${claimedRole ?? 'none'}, staff entry: ${staffRole ?? 'none'},` +
        ` player entry: ${playerRole ?? 'none'})`,
    );
  }
  return role;
};
