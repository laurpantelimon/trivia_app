import { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';

import {
  authErrorCleared,
  selectIsRequestPending,
  selectRequestError,
  type AuthRequest,
} from './authSlice';

/** Loading + error state of one auth request. Clears a stale error when the screen unmounts. */
export const useAuthRequest = (request: AuthRequest) => {
  const dispatch = useAppDispatch();
  const isPending = useAppSelector((state) => selectIsRequestPending(state, request));
  const errorMessage = useAppSelector((state) => selectRequestError(state, request));

  const clearError = () => {
    if (errorMessage) dispatch(authErrorCleared());
  };

  useEffect(
    () => () => {
      dispatch(authErrorCleared());
    },
    [dispatch],
  );

  return { isPending, errorMessage, clearError };
};
