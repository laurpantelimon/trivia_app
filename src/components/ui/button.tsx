import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { GameFonts, Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonVariant = 'primary' | 'gold' | 'neutral' | 'danger';

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  variant?: ButtonVariant;
  icon?: SymbolViewProps['name'];
  isLoading?: boolean;
};

const variantColors: Record<ButtonVariant, { background: ThemeColor; label: ThemeColor }> = {
  primary: { background: 'accent', label: 'onAccent' },
  gold: { background: 'gold', label: 'onGold' },
  neutral: { background: 'backgroundElement', label: 'text' },
  danger: { background: 'danger', label: 'onAccent' },
};

export const Button = ({
  title,
  variant = 'primary',
  icon,
  isLoading = false,
  disabled,
  ...pressableProps
}: ButtonProps) => {
  const theme = useTheme();
  const isDisabled = disabled || isLoading;
  const isInactive = isDisabled && !isLoading;
  const colors = variantColors[variant];
  const labelColor = isInactive ? theme.onDisabled : theme[colors.label];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isInactive ? theme.disabled : theme[colors.background],
          borderColor: variant === 'neutral' ? theme.border : 'transparent',
        },
        pressed && styles.pressed,
      ]}
      {...pressableProps}>
      {isLoading ? (
        <ActivityIndicator color={labelColor} />
      ) : (
        <>
          <ThemedText style={[styles.label, { color: labelColor }]}>{title}</ThemedText>
          {icon ? <SymbolView name={icon} size={20} tintColor={labelColor} weight="bold" /> : null}
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    paddingHorizontal: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  label: {
    fontFamily: GameFonts.semiBold,
    fontSize: 18,
    lineHeight: 22,
  },
});
