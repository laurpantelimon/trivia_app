import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SelectOption<Value extends string> = {
  value: Value;
  label: string;
  description?: string;
};

type SelectFieldProps<Value extends string> = {
  label: string;
  hint?: string;
  options: readonly SelectOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  disabled?: boolean;
};

/** Labelled dropdown styled like `TextField`: tap to open the options below, tap one to pick it. */
export const SelectField = <Value extends string>({
  label,
  hint,
  options,
  value,
  onChange,
  disabled = false,
}: SelectFieldProps<Value>) => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  const choose = (next: Value) => {
    onChange(next);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      <ThemedText type="label" themeColor="textSecondary">
        {label}
      </ThemedText>
      <View
        style={[
          styles.box,
          {
            borderColor: isOpen ? theme.accent : theme.border,
            backgroundColor: isOpen ? theme.backgroundElement : theme.background,
          },
        ]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${selected?.label ?? value}`}
          accessibilityHint={isOpen ? 'Closes the options' : 'Opens the options'}
          accessibilityState={{ expanded: isOpen, disabled }}
          disabled={disabled}
          onPress={() => setIsOpen((open) => !open)}
          style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}>
          <ThemedText style={styles.value}>{selected?.label ?? value}</ThemedText>
          <SymbolView
            name={
              isOpen
                ? { ios: 'chevron.up', android: 'expand_less', web: 'expand_less' }
                : { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }
            }
            size={16}
            tintColor={theme.textSecondary}
          />
        </Pressable>
        {isOpen
          ? options.map((option) => {
              const isSelected = option.value === value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => choose(option.value)}
                  style={({ pressed }) => [
                    styles.option,
                    { borderTopColor: theme.border },
                    pressed && styles.pressed,
                  ]}>
                  <View style={styles.optionText}>
                    <ThemedText>{option.label}</ThemedText>
                    {option.description ? (
                      <ThemedText type="small" themeColor="textSecondary">
                        {option.description}
                      </ThemedText>
                    ) : null}
                  </View>
                  {isSelected ? (
                    <SymbolView
                      name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                      size={18}
                      tintColor={theme.accent}
                      weight="semibold"
                    />
                  ) : null}
                </Pressable>
              );
            })
          : null}
      </View>
      {hint ? (
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  box: {
    borderWidth: 1.5,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  trigger: {
    minHeight: 51,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  value: {
    flex: 1,
    fontSize: 17,
  },
  option: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  optionText: {
    flex: 1,
  },
  pressed: {
    opacity: 0.6,
  },
});
