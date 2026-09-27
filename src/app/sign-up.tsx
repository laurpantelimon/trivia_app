import { useRef } from 'react';
import { TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { TextField } from '@/components/ui/text-field';
import { TextLink } from '@/components/ui/text-link';
import { AuthScreenLayout } from '@/features/auth/components/auth-screen-layout';
import { useStaffSignUpForm } from '@/features/auth/useStaffSignUpForm';
import { PASSWORD_MIN_LENGTH } from '@/features/auth/validation';
import type { StaffRole } from '@/types/account';

const ROLE_NAMES: Record<StaffRole, string> = {
  admin: 'admin',
  moderator: 'moderator',
  observer: 'observer',
};

const ARROW_ICON = { ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' } as const;

/** Staff create their login here: email + invitation code first, then a password. */
export default function StaffSignUpScreen() {
  const codeRef = useRef<TextInput>(null);
  const form = useStaffSignUpForm();
  const { invitation } = form;

  return (
    <AuthScreenLayout
      title="Create your staff login"
      subtitle={
        invitation
          ? `Invitation found: ${invitation.displayName}, ${ROLE_NAMES[invitation.role]}. Choose a password to finish.`
          : 'Enter your email and the invitation code your admin gave you.'
      }
      footer={
        <>
          <ThemedText type="small" themeColor="textSecondary">
            Already have a login?
          </ThemedText>
          <TextLink href="/sign-in" title="Sign in" dismissTo />
        </>
      }>
      {invitation ? (
        <>
          <TextField label="Email" value={invitation.email} editable={false} />
          <TextField
            label="Password"
            placeholder="Create a password"
            hint={`At least ${PASSWORD_MIN_LENGTH} characters.`}
            value={form.password}
            onChangeText={form.changePassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="go"
            autoFocus
            editable={!form.isCreating}
            onSubmitEditing={form.createLogin}
          />
          <FormError message={form.errorMessage} />
          <Button
            title="Create login"
            icon={ARROW_ICON}
            onPress={form.createLogin}
            disabled={!form.canCreate}
            isLoading={form.isCreating}
          />
          <Button
            title="Use a different invitation"
            variant="neutral"
            onPress={form.startOver}
            disabled={form.isCreating}
          />
        </>
      ) : (
        <>
          <TextField
            label="Email"
            placeholder="you@example.com"
            value={form.email}
            onChangeText={form.changeEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            submitBehavior="submit"
            editable={!form.isChecking}
            onSubmitEditing={() => codeRef.current?.focus()}
          />
          <TextField
            ref={codeRef}
            label="Invitation code"
            placeholder="ABCD-2345"
            value={form.code}
            onChangeText={form.changeCode}
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            maxLength={9}
            returnKeyType="go"
            editable={!form.isChecking}
            onSubmitEditing={form.checkInvitation}
          />
          <FormError message={form.errorMessage} />
          <Button
            title="Check invitation"
            icon={ARROW_ICON}
            onPress={form.checkInvitation}
            disabled={!form.canCheck}
            isLoading={form.isChecking}
          />
        </>
      )}
    </AuthScreenLayout>
  );
}
