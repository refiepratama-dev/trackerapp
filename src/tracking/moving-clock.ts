/**
 * The recording timer, kept as plain data so it is easy to test.
 * Moving time = time since start, minus manual pauses, minus automatic pauses.
 *
 * Automatic pause: when no new GPS movement arrives for `AUTO_PAUSE_AFTER_MS`, the timer stops
 * counting from the moment of the last movement, and carries on when movement is seen again.
 */

/** No movement for this long (ms) means the rider has stopped (a red light, a chat). */
export const AUTO_PAUSE_AFTER_MS = 10_000;

export type Clock = {
  startedAt: number;
  /** Set while the rider has paused by hand. */
  pausedAt: number | null;
  /** Total time (ms) already excluded by earlier pauses of either kind. */
  pausedTotalMs: number;
  /** Set while automatically paused: the moment of the last movement. */
  autoPausedSince: number | null;
};

export const IDLE_CLOCK: Clock = {
  startedAt: 0,
  pausedAt: null,
  pausedTotalMs: 0,
  autoPausedSince: null,
};

export function newClock(startedAt: number): Clock {
  return { ...IDLE_CLOCK, startedAt };
}

/** Moving time in ms as of `now` (frozen while paused). */
export function movingMs(clock: Clock, now: number): number {
  const end = clock.pausedAt ?? now;
  const auto = clock.autoPausedSince !== null ? Math.max(0, end - clock.autoPausedSince) : 0;
  return Math.max(0, end - clock.startedAt - clock.pausedTotalMs - auto);
}

/** True when the rider has been still long enough that the timer should stop. */
export function shouldAutoPause(clock: Clock, lastMoveAt: number | null, now: number): boolean {
  return (
    clock.pausedAt === null &&
    clock.autoPausedSince === null &&
    lastMoveAt !== null &&
    now - lastMoveAt >= AUTO_PAUSE_AFTER_MS
  );
}

export function startAutoPause(clock: Clock, lastMoveAt: number): Clock {
  return { ...clock, autoPausedSince: lastMoveAt };
}

/** Movement seen again: the automatic pause is over and its length is excluded for good. */
export function endAutoPause(clock: Clock, now: number): Clock {
  if (clock.autoPausedSince === null) return clock;
  return {
    ...clock,
    pausedTotalMs: clock.pausedTotalMs + Math.max(0, now - clock.autoPausedSince),
    autoPausedSince: null,
  };
}

export function manualPause(clock: Clock, now: number): Clock {
  return { ...endAutoPause(clock, now), pausedAt: now };
}

export function manualResume(clock: Clock, now: number): Clock {
  if (clock.pausedAt === null) return clock;
  return { ...clock, pausedAt: null, pausedTotalMs: clock.pausedTotalMs + (now - clock.pausedAt) };
}
