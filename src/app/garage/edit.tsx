import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import { VehicleForm } from '@/components/vehicle-form';
import { getVehicle, updateVehicle, type Vehicle } from '@/db/vehicles';

export default function EditVehicleScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    getVehicle(db, Number(id)).then(setVehicle);
  }, [db, id]);

  // Wait for the vehicle so the form starts with its real values.
  if (!vehicle) return null;

  return (
    <VehicleForm
      initial={vehicle}
      submitLabel="Save changes"
      onSubmit={async (values) => {
        await updateVehicle(db, vehicle.id, values);
        router.back();
      }}
    />
  );
}
