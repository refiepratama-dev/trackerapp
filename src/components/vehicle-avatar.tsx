import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';

type VehicleAvatarProps = {
  name: string;
  /** Full photo address from `photoUriFor`; the initial letter is shown without one. */
  photoUri: string | null;
  size?: number;
};

/** Round vehicle picture: the photo when there is one, otherwise the name's first letter. */
export function VehicleAvatar({ name, photoUri, size = 48 }: VehicleAvatarProps) {
  const round = { width: size, height: size, borderRadius: size / 2 };
  if (photoUri) {
    return <Image source={{ uri: photoUri }} style={[styles.photo, round]} contentFit="cover" />;
  }
  return (
    <View style={[styles.fallback, round]}>
      <Text style={[styles.letter, { fontSize: size * 0.42 }]}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  photo: {
    backgroundColor: Brand.glassBorder,
  },
  fallback: {
    backgroundColor: Brand.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    color: Brand.onAccent,
    fontWeight: '700',
  },
});
