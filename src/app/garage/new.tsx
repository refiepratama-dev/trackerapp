import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { VehicleForm } from '@/components/vehicle-form';
import { createVehicle } from '@/db/vehicles';

export default function NewVehicleScreen() {
  const db = useSQLiteContext();
  const router = useRouter();

  return (
    <VehicleForm
      submitLabel="Save"
      onSubmit={async (values) => {
        await createVehicle(db, values);
        router.back();
      }}
    />
  );
}
