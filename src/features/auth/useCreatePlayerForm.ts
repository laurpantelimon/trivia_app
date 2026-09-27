import { useState } from 'react';

import { useAppDispatch } from '@/store/hooks';

import { enterAsPlayer } from './authSlice';
import { useAuthRequest } from './useAuthRequest';
import { isValidDisplayName } from './validation';

export const useCreatePlayerForm = () => {
  const dispatch = useAppDispatch();
  const { isPending, errorMessage, clearError } = useAuthRequest('playerEntry');
  const [name, setName] = useState('');

  const canSubmit = isValidDisplayName(name) && !isPending;

  const changeName = (value: string) => {
    setName(value);
    clearError();
  };

  const submit = () => {
    if (!canSubmit) return;
    dispatch(enterAsPlayer(name));
  };

  return { name, changeName, canSubmit, isPending, errorMessage, submit };
};
