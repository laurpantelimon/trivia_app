import { SymbolView } from 'expo-symbols';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PitchMarkings } from '@/components/pitch-markings';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Avatar } from '@/components/ui/avatar';
import { IconButton } from '@/components/ui/icon-button';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import {
  selectCanManageStaff,
  selectCanSignOut,
  selectCurrentUser,
  selectUserRole,
  signOut,
} from '@/features/auth/authSlice';
import { ActiveQuizCard } from '@/features/game/components/active-quiz-card';
import { StaffCard } from '@/features/staff/components/staff-card';
import { useTheme } from '@/hooks/use-theme';
import type { UserRole } from '@/types/account';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

const ROLE_LABELS: Record<UserRole, string> = {
  player: 'Player',
  observer: 'Observer',
  moderator: 'Moderator',
  admin: 'Admin',
};

export default function HomeScreen() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const canSignOut = useAppSelector(selectCanSignOut);
  const role = useAppSelector(selectUserRole);
  const canManageStaff = useAppSelector(selectCanManageStaff);
  const playerName = user?.displayName ?? user?.email ?? 'Player';

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          <View style={styles.playerBar}>
            <Avatar seed={user?.uid ?? playerName} name={playerName} />
            <View style={styles.playerText}>
              {/* Role above the name; blank until it has been resolved. */}
              <ThemedText type="label" themeColor="textSecondary">
                {role ? ROLE_LABELS[role] : ' '}
              </ThemedText>
              <ThemedText type="heading" numberOfLines={1}>
                {playerName}
              </ThemedText>
            </View>
            {canSignOut ? (
              <IconButton
                icon={{
                  ios: 'rectangle.portrait.and.arrow.right',
                  android: 'logout',
                  web: 'logout',
                }}
                accessibilityLabel="Sign out"
                onPress={() => dispatch(signOut())}
              />
            ) : null}
          </View>

          <View style={[styles.hero, { backgroundColor: theme.accent }]}>
            <PitchMarkings />
            <View style={styles.heroText}>
              <ThemedText type="title" style={{ color: theme.onAccent }}>
                Kick-off!
              </ThemedText>
              <ThemedText style={[styles.heroSubtitle, { color: theme.onAccent }]}>
                Same question, same clock for everyone. The fastest right answer scores the most.
              </ThemedText>
            </View>
            <View style={styles.trophy} accessibilityElementsHidden importantForAccessibility="no">
              <SymbolView
                name={{ ios: 'trophy.fill', android: 'emoji_events', web: 'emoji_events' }}
                size={64}
                tintColor={theme.gold}
              />
            </View>
          </View>

          <ActiveQuizCard />
          {canManageStaff ? <StaffCard /> : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: Spacing.four,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  playerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  playerText: {
    flex: 1,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  heroText: {
    flex: 1,
    gap: Spacing.two,
  },
  heroSubtitle: {
    opacity: 0.9,
  },
  trophy: {
    opacity: 0.95,
  },
});
