import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { Brand, Colors } from '@/constants/theme';

type ProfilePhotoProps = {
  /** Full photo address from `photoUriFor`; a person icon is shown without one. */
  photoUri: string | null;
  size?: number;
};

/** Round profile picture, or a plain glass circle with a person icon. */
export function ProfilePhoto({ photoUri, size = 96 }: ProfilePhotoProps) {
  const round = { width: size, height: size, borderRadius: size / 2 };
  if (photoUri) {
    return <Image source={{ uri: photoUri }} style={[styles.photo, round]} contentFit="cover" />;
  }
  return (
    <View style={[styles.empty, round]}>
      <SymbolView
        name="person.fill"
        size={size * 0.45}
        tintColor={Colors.dark.textSecondary}
        resizeMode="scaleAspectFit"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  photo: {
    backgroundColor: Brand.glassBorder,
  },
  empty: {
    backgroundColor: Colors.dark.backgroundElement,
    borderWidth: 1,
    borderColor: Brand.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
