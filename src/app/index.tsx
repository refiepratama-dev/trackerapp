import { PrimaryButton } from '@/components/primary-button';
import { ScreenPlaceholder } from '@/components/screen-placeholder';

export default function RecordScreen() {
  return (
    <ScreenPlaceholder
      title="Record"
      description="Pick a vehicle and start a session. The map and live stats will appear here.">
      <PrimaryButton label="Start" />
    </ScreenPlaceholder>
  );
}
