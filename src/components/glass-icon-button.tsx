import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { Brand } from '@/constants/theme';

const SIZE = 44;

type GlassIconButtonProps = {
  /** SF Symbol name, e.g. "xmark" */
  symbol: SFSymbol;
  accessibilityLabel: string;
  onPress: () => void;
};

/**
 * Round icon-only button with the same Liquid Glass look as the system back button.
 * Older iOS versions get a plain translucent circle.
 */
export function GlassIconButton({ symbol, accessibilityLabel, onPress }: GlassIconButtonProps) {
  const icon = (
    <SymbolView
      name={symbol}
      size={17}
      weight="semibold"
      tintColor="#FFFFFF"
      resizeMode="scaleAspectFit"
    />
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      onPress={onPress}>
      {isLiquidGlassAvailable() ? (
        <GlassView glassEffectStyle="regular" isInteractive style={styles.circle}>
          {icon}
        </GlassView>
      ) : (
        <View style={[styles.circle, styles.fallback]}>{icon}</View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: Brand.glassBorder,
  },
});
