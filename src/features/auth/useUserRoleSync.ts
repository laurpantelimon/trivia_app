import { useEffect } from 'react';

import { auth } from '@/services/firebase';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

import { selectCurrentUser, userRoleChanged } from './authSlice';
import { resolveUserRole } from './userRole';

/** Resolves the signed-in account's role into `auth.role` whenever the account changes. */
export const useUserRoleSync = () => {
  const dispatch = useAppDispatch();
  const userId = useAppSelector(selectCurrentUser)?.uid;

  useEffect(() => {
    const user = auth.currentUser;
    if (!userId || !user || user.uid !== userId) return;

    let isCurrent = true;
    resolveUserRole(user)
      .then((role) => {
        if (isCurrent) dispatch(userRoleChanged(role));
      })
      .catch((error: unknown) => console.warn('Could not resolve user role', error));

    return () => {
      isCurrent = false;
      dispatch(userRoleChanged(null));
    };
  }, [dispatch, userId]);
};
