import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type TextLinkProps = {
  href: Href;
  title: string;
  dismissTo?: boolean;
};

export const TextLink = ({ href, title, dismissTo }: TextLinkProps) => (
  <Link href={href} dismissTo={dismissTo} asChild>
    <Pressable hitSlop={Spacing.two} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedText type="link" themeColor="accent">
        {title}
      </ThemedText>
    </Pressable>
  </Link>
);

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.6,
  },
});
