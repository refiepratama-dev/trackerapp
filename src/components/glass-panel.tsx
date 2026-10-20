import { StyleSheet, View, type ViewProps } from 'react-native';

import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Translucent panel (glass-fill + glass-border). A plain translucent view for now;
 * blur is added once the glass libraries are checked on the device.
 */
export function GlassPanel({ style, ...rest }: ViewProps) {
  const theme = useTheme();

  return (
    <View style={[styles.panel, { backgroundColor: theme.backgroundElement }, style]} {...rest} />
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: Spacing.four,
    borderWidth: 1,
    borderColor: Brand.glassBorder,
    padding: Spacing.three,
    gap: Spacing.two,
  },
});
