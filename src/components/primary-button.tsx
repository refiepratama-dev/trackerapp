import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { Brand, Spacing } from '@/constants/theme';

type PrimaryButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
};

/** Pill-shaped lime button with dark text (Start, Finish, Share). */
export function PrimaryButton({ label, style, disabled, ...rest }: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={(state) => [
        styles.button,
        disabled && styles.disabled,
        state.pressed && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: Spacing.six - Spacing.one * 2,
    borderRadius: 999,
    backgroundColor: Brand.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.35,
  },
  label: {
    color: Brand.onAccent,
    fontSize: 17,
    fontWeight: '600',
  },
});
