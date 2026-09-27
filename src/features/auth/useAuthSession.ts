import { onAuthStateChanged } from '@react-native-firebase/auth';
import { useEffect } from 'react';

import { auth } from '@/services/firebase';
import { useAppDispatch } from '@/store/hooks';

import { signOutFromFirebase, toSessionUser, verifyStoredSession } from './authApi';
import { sessionChanged, sessionRevoked } from './authSlice';

/**
 * Mirrors the Firebase session into the auth slice for the lifetime of the app.
 *
 * On launch, the session Firebase restores from the device is verified with the
 * server before the player is let in (the splash stays up meanwhile). If the
 * account was deleted or disabled, the player is signed out and told why.
 * Leftover anonymous sessions (from before email sign-in) are treated as signed out.
 */
export const useAuthSession = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let isRestoredSession = true;

    return onAuthStateChanged(auth, async (user) => {
      const shouldVerify = isRestoredSession;
      isRestoredSession = false;

      if (user === null || user.isAnonymous) {
        dispatch(sessionChanged(null));
        return;
      }

      if (shouldVerify && (await verifyStoredSession(user)) === 'revoked') {
        dispatch(sessionRevoked());
        await signOutFromFirebase().catch(() => undefined);
        return;
      }

      // `reload` refreshes the current user, so prefer it over the possibly stale object.
      dispatch(sessionChanged(toSessionUser(auth.currentUser ?? user)));
    });
  }, [dispatch]);
};
