import { useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';

import { passwordResetDismissed, requestPasswordReset, selectPasswordResetSentTo } from './authSlice';
import { useAuthRequest } from './useAuthRequest';
import { isValidEmail } from './validation';

export const usePasswordResetForm = (initialEmail = '') => {
  const dispatch = useAppDispatch();
  const { isPending, errorMessage, clearError } = useAuthRequest('passwordReset');
  const sentTo = useAppSelector(selectPasswordResetSentTo);
  const [email, setEmail] = useState(initialEmail);

  const canSubmit = isValidEmail(email) && !isPending;

  useEffect(
    () => () => {
      dispatch(passwordResetDismissed());
    },
    [dispatch],
  );

  const changeEmail = (value: string) => {
    setEmail(value);
    clearError();
  };

  const submit = () => {
    if (!canSubmit) return;
    dispatch(requestPasswordReset(email));
  };

  return { email, changeEmail, canSubmit, isPending, errorMessage, sentTo, submit };
};
