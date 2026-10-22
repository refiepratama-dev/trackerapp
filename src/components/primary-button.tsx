import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { Brand, Spacing } from '@/constants/theme';

type PrimaryButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  /** accent (default): lime. alert: red, for Pause only. glass: translucent, for secondary actions. */
  tone?: 'accent' | 'alert' | 'glass';
};

/** Pill-shaped lime button with dark text (Start, Finish, Share). */
export function PrimaryButton({
  label,
  tone = 'accent',
  style,
  disabled,
  ...rest
}: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={(state) => [
        styles.button,
        tone === 'alert' && styles.alert,
        tone === 'glass' && styles.glass,
        disabled && styles.disabled,
        state.pressed && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      <Text style={[styles.label, tone !== 'accent' && styles.labelLight]}>{label}</Text>
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
  alert: {
    backgroundColor: Brand.alert,
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: Brand.glassBorder,
  },
  disabled: {
    opacity: 0.35,
  },
  label: {
    color: Brand.onAccent,
    fontSize: 17,
    fontWeight: '600',
  },
  labelLight: {
    color: '#FFFFFF',
  },
});
