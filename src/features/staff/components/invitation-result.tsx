import { Share, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { GameFonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { StaffRole } from '@/types/account';

import { formatInvitationCode } from '../invitationCode';

const ROLE_NAMES: Record<StaffRole, string> = {
  admin: 'an admin',
  moderator: 'a moderator',
  observer: 'an observer',
};

type InvitationResultProps = {
  displayName: string;
  email: string;
  role: StaffRole;
  invitationCode: string;
};

/** Shows the new invitation code and lets the admin share it with the person. */
export const InvitationResult = ({ displayName, email, role, invitationCode }: InvitationResultProps) => {
  const theme = useTheme();
  const code = formatInvitationCode(invitationCode);

  const share = () =>
    Share.share({
      message:
        `You're invited to Trivia as ${ROLE_NAMES[role]}. In the app, open Staff sign in → ` +
        `Create your login, and enter ${email} with the invitation code ${code}.`,
    });

  return (
    <View
      style={[styles.box, { borderColor: theme.accent, backgroundColor: theme.backgroundSelected }]}
      accessibilityLiveRegion="polite">
      <ThemedText type="small" themeColor="textSecondary">
        Invited {displayName} ({email}) as {ROLE_NAMES[role]}. Their invitation code:
      </ThemedText>
      <ThemedText selectable style={styles.code} accessibilityLabel={`Code ${code.split('').join(' ')}`}>
        {code}
      </ThemedText>
      <Button
        title="Share invitation"
        variant="neutral"
        icon={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
        onPress={share}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderWidth: 1.5,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
  },
  code: {
    fontFamily: GameFonts.bold,
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: 3,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});
