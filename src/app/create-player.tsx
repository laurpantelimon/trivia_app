import { router } from 'expo-router';

import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { IconButton } from '@/components/ui/icon-button';
import { TextField } from '@/components/ui/text-field';
import { AuthScreenLayout } from '@/features/auth/components/auth-screen-layout';
import { useCreatePlayerForm } from '@/features/auth/useCreatePlayerForm';
import { useSessionRevokedNotice } from '@/features/auth/useSessionRevokedNotice';
import { DISPLAY_NAME_MAX_LENGTH } from '@/features/auth/validation';

export default function CreatePlayerScreen() {
  const form = useCreatePlayerForm();
  const sessionRevokedNotice = useSessionRevokedNotice();

  return (
    <AuthScreenLayout
      showLogo
      title="Pick your player name"
      subtitle="No email, no password. Use the same name next time to get back on the pitch."
      cornerAction={
        <IconButton
          icon={{
            ios: 'person.badge.key.fill',
            android: 'admin_panel_settings',
            web: 'admin_panel_settings',
          }}
          accessibilityLabel="Staff sign in"
          accessibilityHint="For admins, moderators and observers"
          onPress={() => router.push('/sign-in')}
          disabled={form.isPending}
        />
      }>
      <TextField
        label="Player name"
        placeholder="e.g. QuizWizard"
        hint="Anyone who enters this exact name plays as you, so pick something unique."
        value={form.name}
        onChangeText={form.changeName}
        maxLength={DISPLAY_NAME_MAX_LENGTH}
        autoCapitalize="words"
        autoCorrect={false}
        autoComplete="off"
        returnKeyType="go"
        editable={!form.isPending}
        onSubmitEditing={form.submit}
      />
      <FormError message={form.errorMessage ?? sessionRevokedNotice} />
      <Button
        title="Kick off"
        icon={{ ios: 'soccerball', android: 'sports_soccer', web: 'sports_soccer' }}
        onPress={form.submit}
        disabled={!form.canSubmit}
        isLoading={form.isPending}
      />
    </AuthScreenLayout>
  );
}
