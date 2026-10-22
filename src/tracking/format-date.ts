/** "Tue, 21 Oct, 06:37" */
export function formatSessionDate(timestampMs: number): string {
  return new Date(timestampMs).toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
