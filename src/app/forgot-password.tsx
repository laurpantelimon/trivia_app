import { router, useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { TextField } from '@/components/ui/text-field';
import { AuthScreenLayout } from '@/features/auth/components/auth-screen-layout';
import { usePasswordResetForm } from '@/features/auth/usePasswordResetForm';

export default function ForgotPasswordScreen() {
  const { email: prefilledEmail } = useLocalSearchParams<{ email?: string }>();
  const form = usePasswordResetForm(prefilledEmail);

  if (form.sentTo) {
    return (
      <AuthScreenLayout
        title="Check your inbox"
        subtitle={`If an account exists for ${form.sentTo}, we've sent a link to reset the password.`}>
        <Button title="Back to sign in" variant="neutral" onPress={() => router.dismissTo('/sign-in')} />
      </AuthScreenLayout>
    );
  }

  return (
    <AuthScreenLayout
      title="Reset password"
      subtitle="Enter your account email and we'll send you a reset link.">
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
        returnKeyType="send"
        editable={!form.isPending}
        onSubmitEditing={form.submit}
      />
      <FormError message={form.errorMessage} />
      <Button
        title="Send reset link"
        onPress={form.submit}
        disabled={!form.canSubmit}
        isLoading={form.isPending}
      />
    </AuthScreenLayout>
  );
}
