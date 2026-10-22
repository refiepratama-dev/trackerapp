import { Asset, requestPermissionsAsync } from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  PixelRatio,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { GlassIconButton } from '@/components/glass-icon-button';
import { PrimaryButton } from '@/components/primary-button';
import {
  CARD_ASPECT,
  SHARE_TEMPLATES,
  ShareCard,
  type ShareCardData,
  type TemplateId,
} from '@/components/share-card';
import { Brand, Colors, Spacing } from '@/constants/theme';

/** Exported image size: Instagram Story. */
const EXPORT_WIDTH_PX = 1080;
const EXPORT_HEIGHT_PX = 1920;

type ShareCardModalProps = {
  visible: boolean;
  data: ShareCardData | null;
  onClose: () => void;
};

/** Preview of the share card with Save to Photos and Share buttons. */
export function ShareCardModal({ visible, data, onClose }: ShareCardModalProps) {
  const cardRef = useRef<View>(null);
  const [busy, setBusy] = useState<'save' | 'share' | null>(null);
  const [template, setTemplate] = useState<TemplateId>('classic');
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // Largest 9:16 card that still leaves room for the header and two buttons.
  const cardWidth = Math.min(windowWidth - Spacing.four * 2, (windowHeight - 380) / CARD_ASPECT);

  /** Renders the card to a 1080 x 1920 PNG in the cache folder and returns its file URI. */
  const renderCard = async (): Promise<string> => {
    const pixelRatio = PixelRatio.get();
    return captureRef(cardRef, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
      width: EXPORT_WIDTH_PX / pixelRatio,
      height: EXPORT_HEIGHT_PX / pixelRatio,
    });
  };

  const save = async () => {
    if (busy) return;
    setBusy('save');
    try {
      // Add-only access: the app can save pictures but cannot read the user's photos.
      const permission = await requestPermissionsAsync(true);
      if (!permission.granted) {
        Alert.alert(
          'Photos access needed',
          'Allow Rolla to add photos so it can save your share card.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }
      const uri = await renderCard();
      await Asset.create(uri);
      Alert.alert('Saved', 'Your share card is in Photos.');
    } catch {
      Alert.alert('Could not save', 'Something went wrong while saving the card.');
    } finally {
      setBusy(null);
    }
  };

  const share = async () => {
    if (busy) return;
    setBusy('share');
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Sharing unavailable', 'Sharing is not available on this device.');
        return;
      }
      const uri = await renderCard();
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        UTI: 'public.png',
      });
    } catch {
      Alert.alert('Could not share', 'Something went wrong while preparing the card.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>Share card</Text>
          <GlassIconButton symbol="xmark" accessibilityLabel="Close" onPress={onClose} />
        </View>

        <View style={styles.preview}>
          {data && <ShareCard ref={cardRef} template={template} data={data} width={cardWidth} />}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chips}>
          {SHARE_TEMPLATES.map((t) => {
            const active = t.id === template;
            return (
              <Pressable
                key={t.id}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setTemplate(t.id)}
                style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.buttons}>
          <PrimaryButton
            label={busy === 'save' ? 'Saving…' : 'Save to Photos'}
            disabled={busy !== null}
            onPress={save}
          />
          <PrimaryButton
            label={busy === 'share' ? 'Preparing…' : 'Share'}
            tone="glass"
            disabled={busy !== null}
            onPress={share}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.one,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 28,
    fontWeight: '600',
  },
  preview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipScroll: {
    flexGrow: 0,
  },
  chips: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.one,
  },
  chip: {
    height: 36,
    borderRadius: 18,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.backgroundElement,
  },
  chipActive: {
    backgroundColor: Brand.accent,
  },
  chipLabel: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '500',
  },
  chipLabelActive: {
    color: Brand.onAccent,
  },
  buttons: {
    gap: Spacing.two,
  },
});

export type { ShareCardData };
