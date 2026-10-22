/** Altitude readings less accurate than this (meters) are ignored. */
export const MAX_ALTITUDE_ACCURACY_M = 15;
/** The altitude has to move this far (meters) from the last counted level to count as a climb. */
export const CLIMB_THRESHOLD_M = 3;
/** How many recent readings are averaged to smooth out GPS altitude noise. */
const SMOOTHING_WINDOW = 3;

/**
 * Adds up how much a ride climbed. GPS altitude is noisy, so readings are averaged and a climb
 * only counts once the level has moved by at least `CLIMB_THRESHOLD_M`. Descents are not counted.
 * Pure logic with no native dependencies.
 */
export class ElevationGain {
  private recent: number[] = [];
  private level: number | null = null;
  private gain = 0;
  private seen = false;

  /** Feed an altitude reading (meters). `accuracy` is the vertical accuracy, if the OS gives one. */
  add(altitude: number | null, accuracy: number | null) {
    if (altitude === null || !Number.isFinite(altitude)) return;
    // iOS reports a negative accuracy when the altitude is not valid.
    if (accuracy !== null && (accuracy < 0 || accuracy > MAX_ALTITUDE_ACCURACY_M)) return;

    this.seen = true;
    this.recent.push(altitude);
    if (this.recent.length > SMOOTHING_WINDOW) this.recent.shift();
    const smooth = this.recent.reduce((sum, value) => sum + value, 0) / this.recent.length;

    if (this.level === null) {
      this.level = smooth;
      return;
    }
    const delta = smooth - this.level;
    if (Math.abs(delta) < CLIMB_THRESHOLD_M) return;
    if (delta > 0) this.gain += delta;
    this.level = smooth;
  }

  /** Total climb in meters, or null when no usable altitude was ever received. */
  total(): number | null {
    return this.seen ? Math.round(this.gain) : null;
  }
}
