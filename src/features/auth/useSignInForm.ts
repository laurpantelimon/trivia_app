import { useState } from 'react';

import { useAppDispatch } from '@/store/hooks';

import { signIn } from './authSlice';
import { useAuthRequest } from './useAuthRequest';
import { isValidEmail } from './validation';

export const useSignInForm = () => {
  const dispatch = useAppDispatch();
  const { isPending, errorMessage, clearError } = useAuthRequest('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const canSubmit = isValidEmail(email) && password.length > 0 && !isPending;

  const changeEmail = (value: string) => {
    setEmail(value);
    clearError();
  };

  const changePassword = (value: string) => {
    setPassword(value);
    clearError();
  };

  const submit = () => {
    if (!canSubmit) return;
    dispatch(signIn({ email, password }));
  };

  return { email, password, changeEmail, changePassword, canSubmit, isPending, errorMessage, submit };
};
