import { useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { TextField } from '@/components/ui/text-field';
import { TextLink } from '@/components/ui/text-link';
import { AuthScreenLayout } from '@/features/auth/components/auth-screen-layout';
import { useSessionRevokedNotice } from '@/features/auth/useSessionRevokedNotice';
import { useSignInForm } from '@/features/auth/useSignInForm';

export default function SignInScreen() {
  const passwordRef = useRef<TextInput>(null);
  const form = useSignInForm();
  const sessionRevokedNotice = useSessionRevokedNotice();

  return (
    <AuthScreenLayout
      title="Staff sign in"
      subtitle="For admins, moderators and observers. Players just pick a name.">
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
        editable={!form.isPending}
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <TextField
        ref={passwordRef}
        label="Password"
        placeholder="Your password"
        value={form.password}
        onChangeText={form.changePassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        editable={!form.isPending}
        onSubmitEditing={form.submit}
      />
      <View style={styles.forgotPassword}>
        <TextLink
          href={{ pathname: '/forgot-password', params: { email: form.email } }}
          title="Forgot password?"
        />
      </View>
      <FormError message={form.errorMessage ?? sessionRevokedNotice} />
      <Button
        title="Sign in"
        icon={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }}
        onPress={form.submit}
        disabled={!form.canSubmit}
        isLoading={form.isPending}
      />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  forgotPassword: {
    alignItems: 'flex-end',
  },
});
