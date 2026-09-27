import { useAppSelector } from '@/store/hooks';

import { selectWasSessionRevoked } from './authSlice';

const SESSION_REVOKED_MESSAGE =
  'Your account is no longer available, so you were signed out. Create a new player or sign in again.';

/** Message to show after the app signed the user out because their account was removed. */
export const useSessionRevokedNotice = () =>
  useAppSelector(selectWasSessionRevoked) ? SESSION_REVOKED_MESSAGE : undefined;
