import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type IconButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  icon: SymbolViewProps['name'];
  accessibilityLabel: string;
};

const SIZE = 44;

export const IconButton = ({ icon, ...pressableProps }: IconButtonProps) => {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={4}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        pressed && styles.pressed,
      ]}
      {...pressableProps}>
      <SymbolView name={icon} size={20} tintColor={theme.textSecondary} weight="semibold" />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: Radius.small + 2,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.85,
  },
});
