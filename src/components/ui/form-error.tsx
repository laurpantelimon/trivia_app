import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type FormErrorProps = {
  message?: string;
};

export const FormError = ({ message }: FormErrorProps) => {
  const theme = useTheme();
  if (!message) return null;

  return (
    <View
      style={[styles.banner, { borderColor: theme.danger }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite">
      <SymbolView
        name={{ ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' }}
        size={18}
        tintColor={theme.danger}
      />
      <ThemedText type="smallBold" themeColor="danger" style={styles.message}>
        {message}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three - 4,
    borderWidth: 2,
    borderRadius: Radius.small,
    borderCurve: 'continuous',
  },
  message: {
    flex: 1,
  },
});
