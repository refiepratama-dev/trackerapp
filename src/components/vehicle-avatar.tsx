import { StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';

type VehicleAvatarProps = {
  name: string;
  size?: number;
};

/** Round lime badge with the first letter of the vehicle's name. */
export function VehicleAvatar({ name, size = 48 }: VehicleAvatarProps) {
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.letter, { fontSize: size * 0.42 }]}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: Brand.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    color: Brand.onAccent,
    fontWeight: '700',
  },
});
