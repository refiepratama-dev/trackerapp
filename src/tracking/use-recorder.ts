import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Tracker, type Coordinate, type TrackSnapshot } from '@/tracking/geo';
import {
  IDLE_CLOCK,
  endAutoPause,
  manualPause,
  manualResume,
  movingMs,
  newClock,
  shouldAutoPause,
  startAutoPause,
  type Clock,
} from '@/tracking/moving-clock';

export type RecorderPhase = 'idle' | 'recording' | 'paused';

export type FinishedRecording = TrackSnapshot & {
  startedAt: number;
  durationS: number;
};

const EMPTY: TrackSnapshot = { distanceM: 0, maxSpeedMs: 0, route: [], elevationGainM: null };

/**
 * Foreground GPS recording: Start, Pause, Resume, Finish.
 * Updates only arrive while the app is open (background tracking needs a development build).
 */
export function useRecorder({ autoPause = true }: { autoPause?: boolean } = {}) {
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
  // When the last accepted GPS movement arrived (null until the first fix).
  const lastMoveAt = useRef<number | null>(null);
  const autoPauseRef = useRef(autoPause);
  useEffect(() => {
    autoPauseRef.current = autoPause;
  }, [autoPause]);
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
          altitude: location.coords.altitude,
          altitudeAccuracy: location.coords.altitudeAccuracy,
        });
        if (changed) {
          setSnapshot(tracker.current.snapshot());
          const moment = Date.now();
          lastMoveAt.current = moment;
          // Moving again after an automatic pause: carry on timing.
          if (clockRef.current.autoPausedSince !== null) {
            setClock(endAutoPause(clockRef.current, moment));
          }
        }
      },
    );
    if (token !== watchToken.current) {
      sub.remove();
      return;
    }
    subscription.current = sub;
  }, [stopWatching, setClock]);

  // Tick once a second while recording so the timer moves even without GPS updates.
  useEffect(() => {
    if (phase !== 'recording') return;
    const id = setInterval(() => {
      const moment = Date.now();
      setNow(moment);
      if (autoPauseRef.current && shouldAutoPause(clockRef.current, lastMoveAt.current, moment)) {
        setClock(startAutoPause(clockRef.current, lastMoveAt.current ?? moment));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [phase, setClock]);

  useEffect(() => stopWatching, [stopWatching]);

  const elapsedMs = phase === 'idle' ? 0 : movingMs(clock, now);

  const start = useCallback(async () => {
    tracker.current = new Tracker();
    const startedAt = Date.now();
    setClock(newClock(startedAt));
    lastMoveAt.current = null;
    setSnapshot(EMPTY);
    setNow(startedAt);
    setPhase('recording');
    try {
      await startWatching();
    } catch (error) {
      // GPS could not start (permission or Location Services off): go back to idle.
      stopWatching();
      setClock(IDLE_CLOCK);
      setPhase('idle');
      throw error;
    }
  }, [setClock, startWatching, stopWatching]);

  const pause = useCallback(() => {
    stopWatching();
    setClock(manualPause(clockRef.current, Date.now()));
    setPhase('paused');
  }, [setClock, stopWatching]);

  const resume = useCallback(async () => {
    const moment = Date.now();
    setClock(manualResume(clockRef.current, moment));
    // Give the rider a fresh 10 seconds before automatic pause can kick in again.
    if (lastMoveAt.current !== null) lastMoveAt.current = moment;
    // The distance travelled while paused must not be counted.
    tracker.current.breakSegment();
    setNow(Date.now());
    setPhase('recording');
    await startWatching();
  }, [setClock, startWatching]);

  const finish = useCallback((): FinishedRecording => {
    stopWatching();
    const { startedAt } = clockRef.current;
    const durationS = Math.round(movingMs(clockRef.current, Date.now()) / 1000);
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
    elevationGainM: snapshot.elevationGainM,
    route: snapshot.route,
    lastPoint,
    elapsedS: Math.floor(elapsedMs / 1000),
    /** True while the timer is stopped because the rider has stopped moving. */
    autoPaused: clock.autoPausedSince !== null,
    start,
    pause,
    resume,
    finish,
  };
}
