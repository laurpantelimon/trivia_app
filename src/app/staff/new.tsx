import { ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { GameCard } from '@/components/ui/game-card';
import { SelectField, type SelectOption } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { DISPLAY_NAME_MAX_LENGTH } from '@/features/auth/validation';
import { InvitationResult } from '@/features/staff/components/invitation-result';
import { useAddStaffForm } from '@/features/staff/useAddStaffForm';
import type { StaffRole } from '@/types/account';

const ROLE_OPTIONS: readonly SelectOption<StaffRole>[] = [
  { value: 'moderator', label: 'Moderator', description: 'Creates and runs games' },
  { value: 'observer', label: 'Observer', description: 'Watches games' },
];


/** Admin only: adds a staff entry. The person then creates their own login with this email. */
export default function AddStaffScreen() {
  const form = useAddStaffForm();

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <GameCard
          title="Add staff member"
          subtitle="Creates an invitation code. They enter it with this email on “Staff sign in” to create their login.">
          <TextField
            label="Name"
            placeholder="e.g. Alex"
            value={form.displayName}
            onChangeText={form.changeDisplayName}
            maxLength={DISPLAY_NAME_MAX_LENGTH}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!form.isPending}
          />
          <TextField
            label="Email"
            placeholder="name@example.com"
            value={form.email}
            onChangeText={form.changeEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            editable={!form.isPending}
          />
          <SelectField
            label="Role"
            options={ROLE_OPTIONS}
            value={form.role}
            onChange={form.changeRole}
            disabled={form.isPending}
          />
          <FormError message={form.errorMessage} />
          {form.lastAdded ? <InvitationResult {...form.lastAdded} /> : null}
          <Button
            title="Create invitation"
            icon={{ ios: 'person.badge.plus', android: 'person_add', web: 'person_add' }}
            onPress={form.submit}
            disabled={!form.canSubmit}
            isLoading={form.isPending}
          />
        </GameCard>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
});
