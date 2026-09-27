import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, GameFonts, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'display'
    | 'title'
    | 'subtitle'
    | 'heading'
    | 'small'
    | 'smallBold'
    | 'label'
    | 'link'
    | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return <Text style={[{ color: theme[themeColor ?? 'text'] }, styles[type], style]} {...rest} />;
}

// Fredoka styles: each weight is its own family, so no `fontWeight` (Android would ignore the family).
// Body styles use the system font, which reads better at small sizes.
const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: 400,
  },
  display: {
    fontFamily: GameFonts.bold,
    fontSize: 44,
    lineHeight: 48,
  },
  title: {
    fontFamily: GameFonts.bold,
    fontSize: 34,
    lineHeight: 40,
  },
  subtitle: {
    fontFamily: GameFonts.bold,
    fontSize: 28,
    lineHeight: 34,
  },
  heading: {
    fontFamily: GameFonts.semiBold,
    fontSize: 21,
    lineHeight: 26,
  },
  small: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: 400,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: 600,
  },
  label: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: 600,
  },
  link: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: 600,
  },
  code: {
    fontFamily: Fonts.mono,
    fontSize: 12,
  },
});
