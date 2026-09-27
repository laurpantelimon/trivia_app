import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type GameCardProps = {
  title?: string;
  subtitle?: string;
  icon?: SymbolViewProps['name'];
  iconColor?: string;
  children: ReactNode;
};

/** Bordered surface — the base container for grouped content. */
export const GameCard = ({ title, subtitle, icon, iconColor, children }: GameCardProps) => {
  const theme = useTheme();
  const badgeColor = iconColor ?? theme.accent;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
        },
      ]}>
      {title ? (
        <View style={styles.header}>
          {icon ? (
            <View style={[styles.badge, { backgroundColor: badgeColor }]}>
              <SymbolView name={icon} size={22} tintColor="#FFFFFF" weight="semibold" />
            </View>
          ) : null}
          <View style={styles.headerText}>
            <ThemedText type="heading">{title}</ThemedText>
            {subtitle ? (
              <ThemedText type="small" themeColor="textSecondary">
                {subtitle}
              </ThemedText>
            ) : null}
          </View>
        </View>
      ) : null}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
    padding: Spacing.four - 4,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    borderWidth: 1.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: Spacing.half,
  },
});
