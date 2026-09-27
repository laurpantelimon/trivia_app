import { SymbolView } from 'expo-symbols';
import { useState, type Ref } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  ref?: Ref<TextInput>;
  label: string;
  hint?: string;
  errorMessage?: string;
};

const TOGGLE_SIZE = 44;

/**
 * Labelled text input. With `secureTextEntry`, it also shows an eye button that
 * toggles the value between hidden and visible.
 */
export const TextField = ({
  ref,
  label,
  hint,
  errorMessage,
  secureTextEntry = false,
  onFocus,
  onBlur,
  ...inputProps
}: TextFieldProps) => {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isValueVisible, setIsValueVisible] = useState(false);
  const helperText = errorMessage ?? hint;
  const borderColor = errorMessage ? theme.danger : isFocused ? theme.accent : theme.border;

  return (
    <View style={styles.container}>
      <ThemedText type="label" themeColor="textSecondary">
        {label}
      </ThemedText>
      <View>
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={theme.onDisabled}
          selectionColor={theme.accent}
          secureTextEntry={secureTextEntry && !isValueVisible}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          style={[
            styles.input,
            secureTextEntry && styles.inputWithToggle,
            {
              color: theme.text,
              backgroundColor: isFocused ? theme.backgroundElement : theme.background,
              borderColor,
            },
          ]}
          {...inputProps}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isValueVisible ? 'Hide password' : 'Show password'}
            onPress={() => setIsValueVisible((visible) => !visible)}
            hitSlop={4}
            style={({ pressed }) => [styles.toggle, pressed && styles.togglePressed]}>
            <SymbolView
              name={
                isValueVisible
                  ? { ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' }
                  : { ios: 'eye', android: 'visibility', web: 'visibility' }
              }
              size={20}
              tintColor={theme.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>
      {helperText ? (
        <ThemedText type="small" themeColor={errorMessage ? 'danger' : 'textSecondary'}>
          {helperText}
        </ThemedText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  input: {
    minHeight: 54,
    borderWidth: 1.5,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
    fontSize: 17,
  },
  inputWithToggle: {
    paddingRight: TOGGLE_SIZE + Spacing.one,
  },
  toggle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: Spacing.one,
    width: TOGGLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  togglePressed: {
    opacity: 0.5,
  },
});
