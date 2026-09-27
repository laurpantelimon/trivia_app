import { useState } from 'react';

import { normalizeInvitationCode } from '@/features/staff/invitationCode';
import { useAppDispatch } from '@/store/hooks';

import { getAuthErrorMessage } from './authApi';
import { signUpAsStaff } from './authSlice';
import { findStaffInvitation, type StaffInvitation } from './staffRecords';
import { useAuthRequest } from './useAuthRequest';
import { isValidEmail, isValidPassword } from './validation';

const NO_MATCH_MESSAGE = 'No invitation matches this email and code. Check both and try again.';

/**
 * Staff sign-up in two steps:
 * 1. email + invitation code → the invitation is looked up (no login needed);
 * 2. once it matches, a password → the login is created and linked to the entry.
 */
export const useStaffSignUpForm = () => {
  const dispatch = useAppDispatch();
  const signUpRequest = useAuthRequest('staffSignUp');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [invitation, setInvitation] = useState<StaffInvitation>();
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState<string>();

  const canCheck = isValidEmail(email) && normalizeInvitationCode(code).length > 0 && !isChecking;
  const canCreate = invitation !== undefined && isValidPassword(password) && !signUpRequest.isPending;

  const changeEmail = (value: string) => {
    setEmail(value);
    setCheckError(undefined);
  };

  const changeCode = (value: string) => {
    setCode(value.toUpperCase());
    setCheckError(undefined);
  };

  const changePassword = (value: string) => {
    setPassword(value);
    signUpRequest.clearError();
  };

  const checkInvitation = async () => {
    if (!canCheck) return;
    setIsChecking(true);
    setCheckError(undefined);
    try {
      const match = await findStaffInvitation(email, normalizeInvitationCode(code));
      if (match) setInvitation(match);
      else setCheckError(NO_MATCH_MESSAGE);
    } catch (error) {
      setCheckError(getAuthErrorMessage(error));
    } finally {
      setIsChecking(false);
    }
  };

  /** Back to step 1 (e.g. wrong email). */
  const startOver = () => {
    setInvitation(undefined);
    setPassword('');
    signUpRequest.clearError();
  };

  const createLogin = () => {
    if (!canCreate || !invitation) return;
    dispatch(signUpAsStaff({ invitation, password }));
  };

  return {
    email,
    code,
    password,
    invitation,
    changeEmail,
    changeCode,
    changePassword,
    canCheck,
    canCreate,
    isChecking,
    isCreating: signUpRequest.isPending,
    errorMessage: invitation ? signUpRequest.errorMessage : checkError,
    checkInvitation,
    startOver,
    createLogin,
  };
};
