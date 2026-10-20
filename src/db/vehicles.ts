import type { SQLiteDatabase } from 'expo-sqlite';

export type VehicleType = {
  id: number;
  name: string;
  isCustom: boolean;
};

export type Vehicle = {
  id: number;
  name: string;
  typeId: number;
  typeName: string;
  brandModel: string | null;
  photoUri: string | null;
  createdAt: number;
};

export type NewVehicleInput = {
  name: string;
  /** Id of an existing type. Ignored when `customTypeName` is given. */
  typeId?: number;
  /** A type the user typed in. It is reused if one with the same name already exists. */
  customTypeName?: string;
  brandModel?: string;
};

export async function listVehicleTypes(db: SQLiteDatabase): Promise<VehicleType[]> {
  const rows = await db.getAllAsync<{ id: number; name: string; is_custom: number }>(
    'SELECT id, name, is_custom FROM vehicle_types ORDER BY is_custom, id',
  );
  return rows.map((row) => ({ id: row.id, name: row.name, isCustom: row.is_custom === 1 }));
}

/** Active (not archived) vehicles, newest first. */
export async function listActiveVehicles(db: SQLiteDatabase): Promise<Vehicle[]> {
  const rows = await db.getAllAsync<{
    id: number;
    name: string;
    type_id: number;
    type_name: string;
    brand_model: string | null;
    photo_uri: string | null;
    created_at: number;
  }>(
    `SELECT v.id, v.name, v.type_id, t.name AS type_name, v.brand_model, v.photo_uri, v.created_at
       FROM vehicles v
       JOIN vehicle_types t ON t.id = v.type_id
      WHERE v.archived = 0
      ORDER BY v.created_at DESC, v.id DESC`,
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    typeId: row.type_id,
    typeName: row.type_name,
    brandModel: row.brand_model,
    photoUri: row.photo_uri,
    createdAt: row.created_at,
  }));
}

async function findOrCreateType(db: SQLiteDatabase, rawName: string): Promise<number> {
  const name = rawName.trim().replace(/\s+/g, ' ');
  if (!name) throw new Error('Type name is required.');

  const existing = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM vehicle_types WHERE name = ? COLLATE NOCASE',
    name,
  );
  if (existing) return existing.id;

  const result = await db.runAsync(
    'INSERT INTO vehicle_types (name, is_custom) VALUES (?, 1)',
    name,
  );
  return result.lastInsertRowId;
}

/** Creates a vehicle (and its custom type, if any) in one transaction. Returns the new id. */
export async function createVehicle(db: SQLiteDatabase, input: NewVehicleInput): Promise<number> {
  const name = input.name.trim();
  if (!name) throw new Error('Vehicle name is required.');

  let vehicleId = 0;
  await db.withTransactionAsync(async () => {
    const typeId = input.customTypeName?.trim()
      ? await findOrCreateType(db, input.customTypeName)
      : input.typeId;
    if (typeId === undefined) throw new Error('Vehicle type is required.');

    const result = await db.runAsync(
      'INSERT INTO vehicles (name, type_id, brand_model, created_at) VALUES (?, ?, ?, ?)',
      name,
      typeId,
      input.brandModel?.trim() || null,
      Date.now(),
    );
    vehicleId = result.lastInsertRowId;
  });
  return vehicleId;
}

/** Hides a vehicle from the garage. Its sessions are kept. */
export async function archiveVehicle(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('UPDATE vehicles SET archived = 1 WHERE id = ?', id);
}
