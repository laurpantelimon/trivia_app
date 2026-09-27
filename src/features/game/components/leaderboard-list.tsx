import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { LeaderboardEntry } from '@/types/game';

import { rankAt } from '../standings';

type LeaderboardListProps = {
  entries: LeaderboardEntry[];
  /** Highlights this player's row. */
  currentUserId?: string;
};

/** Standings, already sorted (see `subscribeToLeaderboard`). Equal scores share a rank. */
export const LeaderboardList = ({ entries, currentUserId }: LeaderboardListProps) => {
  const theme = useTheme();

  if (entries.length === 0) {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        No players yet. Players join from their home screen.
      </ThemedText>
    );
  }

  return (
    <View style={styles.list}>
      {entries.map((entry, index) => {
        const rank = rankAt(entries, index);
        const isCurrentUser = entry.id === currentUserId;
        return (
          <View
            key={entry.id}
            style={[
              styles.row,
              { borderColor: theme.border },
              isCurrentUser && { backgroundColor: theme.backgroundSelected, borderColor: theme.accent },
            ]}>
            <ThemedText type="heading" style={styles.rank} themeColor={rank <= 3 ? 'text' : 'textSecondary'}>
              {rank}
            </ThemedText>
            <Avatar seed={entry.id} name={entry.displayName} size={36} />
            <View style={styles.name}>
              <ThemedText numberOfLines={1}>
                {entry.displayName}
                {isCurrentUser ? ' (you)' : ''}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {entry.correctCount} correct
              </ThemedText>
            </View>
            <ThemedText type="heading" style={styles.score}>
              {entry.score}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three - 4,
    borderWidth: 1.5,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
  },
  rank: {
    width: 28,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  name: {
    flex: 1,
  },
  score: {
    fontVariant: ['tabular-nums'],
  },
});
