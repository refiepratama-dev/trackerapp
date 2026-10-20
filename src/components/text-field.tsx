import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TextFieldProps = TextInputProps & {
  label: string;
};

/** Labeled glass text input used in forms. */
export function TextField({ label, style, ...rest }: TextFieldProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        selectionColor={Brand.accent}
        keyboardAppearance="dark"
        style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }, style]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.two,
  },
  label: {
    fontSize: 13,
  },
  input: {
    height: 52,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: Brand.glassBorder,
    paddingHorizontal: Spacing.three,
    fontSize: 17,
  },
});
