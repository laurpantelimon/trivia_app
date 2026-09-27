import { useState } from 'react';

import { getAuthErrorMessage } from '@/features/auth/authApi';
import { selectCurrentUser } from '@/features/auth/authSlice';
import { createStaffInvitation } from '@/features/auth/staffRecords';
import { isValidDisplayName, isValidEmail } from '@/features/auth/validation';
import { useAppSelector } from '@/store/hooks';
import type { StaffRole } from '@/types/account';

type AddedStaff = { displayName: string; email: string; role: StaffRole; invitationCode: string };

/** Admin's "Add staff member" form. Only creates the invitation; the person creates their own login later. */
export const useAddStaffForm = () => {
  const adminId = useAppSelector(selectCurrentUser)?.uid;
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffRole>('moderator');
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [lastAdded, setLastAdded] = useState<AddedStaff>();

  const canSubmit =
    isValidDisplayName(displayName) && isValidEmail(email) && !isPending && adminId !== undefined;

  const withReset = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setErrorMessage(undefined);
  };

  const submit = async () => {
    if (!canSubmit || !adminId) return;
    setIsPending(true);
    setErrorMessage(undefined);
    try {
      const entry = { displayName: displayName.trim(), email: email.trim().toLowerCase(), role };
      const invitationCode = await createStaffInvitation({ ...entry, createdBy: adminId });
      setLastAdded({ ...entry, invitationCode });
      setDisplayName('');
      setEmail('');
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsPending(false);
    }
  };

  return {
    displayName,
    email,
    role,
    changeDisplayName: withReset(setDisplayName),
    changeEmail: withReset(setEmail),
    changeRole: setRole,
    canSubmit,
    isPending,
    errorMessage,
    lastAdded,
    submit,
  };
};
