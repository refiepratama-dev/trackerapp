import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GlassPanel } from '@/components/glass-panel';
import { PrimaryButton } from '@/components/primary-button';
import { RouteMap } from '@/components/route-map';
import { ShareCardModal } from '@/components/share-card-modal';
import { SessionStatsPanel } from '@/components/session-stats';
import { Brand, Colors, Spacing } from '@/constants/theme';
import { deleteSession, getSession, type SessionDetail } from '@/db/sessions';
import { formatSessionDate } from '@/tracking/format-date';
import { photoUriFor } from '@/vehicles/photo';

const { text, textSecondary } = Colors.dark;

export default function SessionDetailScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSession(db, Number(id)).then((result) => {
      if (cancelled) return;
      setSession(result);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [db, id]);

  const confirmDelete = () => {
    if (!session) return;
    Alert.alert('Delete this session?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteSession(db, session.id);
          router.back();
        },
      },
    ]);
  };

  if (!loaded) return <View style={styles.screen} />;

  if (!session) {
    return (
      <View style={styles.screen}>
        <View style={styles.content}>
          <GlassPanel>
            <Text style={styles.title}>Session not found</Text>
            <Text style={styles.secondary}>It may have been deleted.</Text>
          </GlassPanel>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen options={{ title: session.vehicleName }} />
      <Text style={styles.secondary}>{formatSessionDate(session.startedAt)}</Text>

      {session.route.length > 1 ? (
        <View style={styles.map}>
          <RouteMap route={session.route} />
        </View>
      ) : (
        <GlassPanel>
          <Text style={styles.title}>No route recorded</Text>
          <Text style={styles.secondary}>
            This session had no usable GPS points, so there is no route to show.
          </Text>
        </GlassPanel>
      )}

      <SessionStatsPanel
        distanceM={session.distanceM}
        durationS={session.durationS}
        maxSpeedMs={session.maxSpeedMs}
      />

      <PrimaryButton label="Share card" onPress={() => setShareOpen(true)} />
      <PrimaryButton label="Delete session" tone="glass" onPress={confirmDelete} />
      <ShareCardModal
        visible={shareOpen}
        data={{ ...session, photoUri: photoUriFor(session.vehiclePhoto) }}
        onClose={() => setShareOpen(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  map: {
    height: 280,
    borderRadius: Spacing.four,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Brand.glassBorder,
  },
  title: {
    color: text,
    fontSize: 17,
    fontWeight: '600',
  },
  secondary: {
    color: textSecondary,
    fontSize: 15,
  },
});
