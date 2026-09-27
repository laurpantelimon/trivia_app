import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { LogoTiles } from '@/components/logo-tiles';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GameCard } from '@/components/ui/game-card';
import { MaxContentWidth, Spacing } from '@/constants/theme';

type AuthScreenLayoutProps = {
  title: string;
  subtitle: string;
  showLogo?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  /** Small action pinned to the bottom-left corner of the screen (e.g. an icon button). */
  cornerAction?: ReactNode;
};

export const AuthScreenLayout = ({
  title,
  subtitle,
  showLogo = false,
  children,
  footer,
  cornerAction,
}: AuthScreenLayoutProps) => {
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView
        style={styles.screen}
        edges={showLogo ? undefined : ['bottom', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.screen}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={[
              styles.content,
              showLogo && styles.centered,
              cornerAction ? styles.contentAboveCorner : null,
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive">
            <View style={[styles.hero, showLogo && styles.heroCentered]}>
              {showLogo ? <LogoTiles /> : null}
              <View style={styles.heroText}>
                <ThemedText
                  type={showLogo ? 'heading' : 'title'}
                  style={showLogo && styles.textCentered}>
                  {title}
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={showLogo && styles.textCentered}>
                  {subtitle}
                </ThemedText>
              </View>
            </View>
            <GameCard>{children}</GameCard>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      {cornerAction ? (
        <View
          style={[
            styles.corner,
            { left: insets.left + Spacing.three, bottom: insets.bottom + Spacing.three },
          ]}>
          {cornerAction}
        </View>
      ) : null}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: Spacing.four,
    padding: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth / 2 + Spacing.five,
    alignSelf: 'center',
  },
  centered: {
    justifyContent: 'center',
  },
  // Keeps the last content clear of the corner action (44pt button + its 3D edge).
  contentAboveCorner: {
    paddingBottom: Spacing.six + Spacing.three,
  },
  hero: {
    gap: Spacing.four,
  },
  heroCentered: {
    alignItems: 'center',
  },
  heroText: {
    gap: Spacing.one,
  },
  textCentered: {
    textAlign: 'center',
  },
  corner: {
    position: 'absolute',
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one,
  },
});
