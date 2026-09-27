import type { UserRole } from '@/types/account';

export type Permission = 'signOut' | 'hostGame' | 'joinGame' | 'manageStaff';

/**
 * What each role may do in the app. The single source of truth for UI gating;
 * the server (Firestore rules, Cloud Functions) must enforce the same limits.
 */
const ROLE_PERMISSIONS: Record<UserRole, ReadonlySet<Permission>> = {
  // TEMPORARY: players may sign out for now. Remove 'signOut' here to lock them in again.
  player: new Set(['signOut', 'joinGame']),
  observer: new Set(['signOut']),
  moderator: new Set(['signOut', 'hostGame']),
  admin: new Set(['signOut', 'hostGame', 'manageStaff']),
};

/** An unknown role (not loaded yet, or missing) has no permissions. */
export const hasPermission = (role: UserRole | null, permission: Permission) =>
  role !== null && ROLE_PERMISSIONS[role].has(permission);
