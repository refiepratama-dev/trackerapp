import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Tracker, type Coordinate, type TrackSnapshot } from '@/tracking/geo';

export type RecorderPhase = 'idle' | 'recording' | 'paused';

export type FinishedRecording = TrackSnapshot & {
  startedAt: number;
  durationS: number;
};

const EMPTY: TrackSnapshot = { distanceM: 0, maxSpeedMs: 0, route: [] };

type Clock = { startedAt: number; pausedAt: number | null; pausedTotalMs: number };
const IDLE_CLOCK: Clock = { startedAt: 0, pausedAt: null, pausedTotalMs: 0 };

/**
 * Foreground GPS recording: Start, Pause, Resume, Finish.
 * Updates only arrive while the app is open (background tracking needs a development build).
 */
export function useRecorder() {
  const [phase, setPhase] = useState<RecorderPhase>('idle');
  const [snapshot, setSnapshot] = useState<TrackSnapshot>(EMPTY);
  const [now, setNow] = useState(() => Date.now());

  const tracker = useRef(new Tracker());
  const subscription = useRef<Location.LocationSubscription | null>(null);
  // Bumped on every stop so a watch that resolves late can detect it is stale.
  const watchToken = useRef(0);
  // Kept in state for rendering the timer, and mirrored in a ref for the callbacks below.
  const [clock, setClockState] = useState<Clock>(IDLE_CLOCK);
  const clockRef = useRef<Clock>(IDLE_CLOCK);
  const setClock = useCallback((next: Clock) => {
    clockRef.current = next;
    setClockState(next);
  }, []);

  const stopWatching = useCallback(() => {
    watchToken.current += 1;
    subscription.current?.remove();
    subscription.current = null;
  }, []);

  const startWatching = useCallback(async () => {
    stopWatching();
    const token = watchToken.current;
    const sub = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 5 },
      (location) => {
        const changed = tracker.current.addFix({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp,
          accuracy: location.coords.accuracy,
          speed: location.coords.speed,
        });
        if (changed) setSnapshot(tracker.current.snapshot());
      },
    );
    if (token !== watchToken.current) {
      sub.remove();
      return;
    }
    subscription.current = sub;
  }, [stopWatching]);

  // Tick once a second while recording so the timer moves even without GPS updates.
  useEffect(() => {
    if (phase !== 'recording') return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => stopWatching, [stopWatching]);

  const elapsedMs = (() => {
    if (phase === 'idle') return 0;
    const { startedAt, pausedAt, pausedTotalMs } = clock;
    return Math.max(0, (pausedAt ?? now) - startedAt - pausedTotalMs);
  })();

  const start = useCallback(async () => {
    tracker.current = new Tracker();
    const startedAt = Date.now();
    setClock({ startedAt, pausedAt: null, pausedTotalMs: 0 });
    setSnapshot(EMPTY);
    setNow(startedAt);
    setPhase('recording');
    await startWatching();
  }, [setClock, startWatching]);

  const pause = useCallback(() => {
    stopWatching();
    setClock({ ...clockRef.current, pausedAt: Date.now() });
    setPhase('paused');
  }, [setClock, stopWatching]);

  const resume = useCallback(async () => {
    const { pausedAt, pausedTotalMs } = clockRef.current;
    setClock({
      ...clockRef.current,
      pausedAt: null,
      pausedTotalMs: pausedAt !== null ? pausedTotalMs + (Date.now() - pausedAt) : pausedTotalMs,
    });
    // The distance travelled while paused must not be counted.
    tracker.current.breakSegment();
    setNow(Date.now());
    setPhase('recording');
    await startWatching();
  }, [setClock, startWatching]);

  const finish = useCallback((): FinishedRecording => {
    stopWatching();
    const { startedAt, pausedAt, pausedTotalMs } = clockRef.current;
    const end = pausedAt ?? Date.now();
    const durationS = Math.max(0, Math.round((end - startedAt - pausedTotalMs) / 1000));
    const result: FinishedRecording = { ...tracker.current.snapshot(), startedAt, durationS };
    setClock(IDLE_CLOCK);
    setPhase('idle');
    setSnapshot(EMPTY);
    return result;
  }, [setClock, stopWatching]);

  const lastPoint: Coordinate | null = snapshot.route[snapshot.route.length - 1] ?? null;

  return {
    phase,
    distanceM: snapshot.distanceM,
    maxSpeedMs: snapshot.maxSpeedMs,
    route: snapshot.route,
    lastPoint,
    elapsedS: Math.floor(elapsedMs / 1000),
    start,
    pause,
    resume,
    finish,
  };
}
