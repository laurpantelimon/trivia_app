import { router } from 'expo-router';

import { Button } from '@/components/ui/button';
import { GameCard } from '@/components/ui/game-card';
import { useTheme } from '@/hooks/use-theme';

/** Home card for admins: entry point to adding moderators and observers. */
export const StaffCard = () => {
  const theme = useTheme();

  return (
    <GameCard
      title="Staff"
      subtitle="Add moderators and observers. They then create their own login."
      icon={{ ios: 'person.2.fill', android: 'group', web: 'group' }}
      iconColor={theme.textSecondary}>
      <Button
        title="Add staff member"
        variant="neutral"
        icon={{ ios: 'person.badge.plus', android: 'person_add', web: 'person_add' }}
        onPress={() => router.push('/staff/new')}
      />
    </GameCard>
  );
};
