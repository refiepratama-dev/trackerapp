import { SymbolView, type SFSymbol } from 'expo-symbols';
import { useCallback, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { Brand, Spacing } from '@/constants/theme';

const ACTION_WIDTH = 80;

export type SwipeActionSpec = {
  label: string;
  symbol: SFSymbol;
  tone: 'edit' | 'delete';
  accessibilityLabel: string;
  onPress: () => void;
};

/**
 * Buttons that fade and slide in on the right of a swiped card (swipe left to reveal them).
 * Pass the `progress` that ReanimatedSwipeable gives to `renderRightActions`.
 */
export function SwipeActions({
  progress,
  actions,
}: {
  progress: SharedValue<number>;
  actions: SwipeActionSpec[];
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0.6, 1], Extrapolation.CLAMP),
    transform: [{ translateX: interpolate(progress.value, [0, 1], [24, 0], Extrapolation.CLAMP) }],
  }));

  return (
    <Animated.View
      style={[
        styles.wrap,
        { width: (ACTION_WIDTH + Spacing.two) * actions.length },
        animatedStyle,
      ]}>
      {actions.map((action) => (
        <Pressable
          key={action.label}
          accessibilityRole="button"
          accessibilityLabel={action.accessibilityLabel}
          style={[styles.action, action.tone === 'delete' ? styles.delete : styles.edit]}
          onPress={action.onPress}>
          <SymbolView
            name={action.symbol}
            size={22}
            weight="semibold"
            tintColor={action.tone === 'delete' ? '#FFFFFF' : Brand.onAccent}
          />
          <Text style={[styles.label, action.tone === 'edit' && styles.editLabel]}>
            {action.label}
          </Text>
        </Pressable>
      ))}
    </Animated.View>
  );
}

/**
 * Keeps track of swipeable rows so that only one is open at a time, and so the list can close
 * them all (on scroll, on a tap elsewhere, or when the screen loses focus).
 */
export function useSwipeRows<Id extends string | number>() {
  const rows = useRef(new Map<Id, SwipeableMethods>());
  const openId = useRef<Id | null>(null);

  const closeAll = useCallback(() => {
    rows.current.forEach((row) => row.close());
    openId.current = null;
  }, []);

  const register = useCallback(
    (id: Id) => (row: SwipeableMethods | null) => {
      if (row) rows.current.set(id, row);
      else rows.current.delete(id);
    },
    [],
  );

  const handleWillOpen = useCallback((id: Id) => {
    rows.current.forEach((row, other) => {
      if (other !== id) row.close();
    });
    openId.current = id;
  }, []);

  const handleClose = useCallback((id: Id) => {
    if (openId.current === id) openId.current = null;
  }, []);

  /** True when a row was open (and is now closing); a tap should then do nothing else. */
  const consumeTap = useCallback(() => {
    if (openId.current === null) return false;
    closeAll();
    return true;
  }, [closeAll]);

  return { register, handleWillOpen, handleClose, closeAll, consumeTap };
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    paddingLeft: Spacing.two,
    gap: Spacing.two,
  },
  action: {
    flex: 1,
    borderRadius: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  edit: {
    backgroundColor: Brand.accent,
  },
  delete: {
    backgroundColor: Brand.alert,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  editLabel: {
    color: Brand.onAccent,
  },
});
