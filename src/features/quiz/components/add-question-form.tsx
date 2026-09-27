import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { OPTION_MAX_LENGTH, QUESTION_TEXT_MAX_LENGTH, type QuizQuestion } from '@/types/quiz';

import { useAddQuestionForm } from '../useAddQuestionForm';
import { OPTION_LETTERS } from './question-list';

type AddQuestionFormProps = {
  quizId: string;
  questions: readonly QuizQuestion[];
};

/** Question text, two to four options, and a tap on the circle to mark the correct one. */
export const AddQuestionForm = ({ quizId, questions }: AddQuestionFormProps) => {
  const form = useAddQuestionForm(quizId, questions);

  return (
    <>
      <TextField
        label="Question"
        placeholder="e.g. Who won the 2022 World Cup?"
        value={form.text}
        onChangeText={form.changeText}
        maxLength={QUESTION_TEXT_MAX_LENGTH}
        multiline
        editable={!form.isPending}
      />
      <ThemedText type="small" themeColor="textSecondary">
        Fill in at least two options and tap the circle next to the correct one.
      </ThemedText>
      {form.options.map((option, index) => (
        <OptionField
          key={index}
          letter={OPTION_LETTERS[index] ?? String(index + 1)}
          value={option}
          onChange={(value) => form.changeOption(index, value)}
          isCorrect={form.correctField === index}
          onMarkCorrect={() => form.chooseCorrectField(index)}
          editable={!form.isPending}
        />
      ))}
      <FormError message={form.errorMessage} />
      <Button
        title="Add question"
        icon={{ ios: 'plus', android: 'add', web: 'add' }}
        onPress={form.submit}
        disabled={!form.canSubmit}
        isLoading={form.isPending}
      />
    </>
  );
};

type OptionFieldProps = {
  letter: string;
  value: string;
  onChange: (value: string) => void;
  isCorrect: boolean;
  onMarkCorrect: () => void;
  editable: boolean;
};

const OptionField = ({ letter, value, onChange, isCorrect, onMarkCorrect, editable }: OptionFieldProps) => {
  const theme = useTheme();

  return (
    <View style={styles.optionRow}>
      <Pressable
        accessibilityRole="radio"
        accessibilityLabel={`Option ${letter} is correct`}
        accessibilityState={{ checked: isCorrect, disabled: !editable }}
        disabled={!editable}
        hitSlop={6}
        onPress={onMarkCorrect}
        style={({ pressed }) => [styles.radio, pressed && styles.pressed]}>
        <SymbolView
          name={
            isCorrect
              ? { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }
              : { ios: 'circle', android: 'radio_button_unchecked', web: 'radio_button_unchecked' }
          }
          size={26}
          tintColor={isCorrect ? theme.accent : theme.textSecondary}
        />
      </Pressable>
      <View style={styles.optionField}>
        <TextField
          label={`Option ${letter}${isCorrect ? ' · correct' : ''}`}
          placeholder="Answer"
          value={value}
          onChangeText={onChange}
          maxLength={OPTION_MAX_LENGTH}
          editable={editable}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  radio: {
    width: 36,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.5,
  },
  optionField: {
    flex: 1,
  },
});
