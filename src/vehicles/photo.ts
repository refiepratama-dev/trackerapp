import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

/**
 * Vehicle photos are copied into the app's own storage. The database only keeps the file name,
 * because the full path of the app folder can change when iOS updates or reinstalls the app.
 */
const photoDir = () => new Directory(Paths.document, 'vehicle-photos');

/** Full `file://` address for a stored photo name, or null when there is no (readable) photo. */
export function photoUriFor(fileName: string | null | undefined): string | null {
  if (!fileName) return null;
  const file = new File(photoDir(), fileName);
  return file.exists ? file.uri : null;
}

/** Removes a stored photo. Safe to call with null or a name that no longer exists. */
export function deletePhotoFile(fileName: string | null | undefined): void {
  if (!fileName) return;
  try {
    const file = new File(photoDir(), fileName);
    if (file.exists) file.delete();
  } catch {
    // A leftover file is harmless; never block the user over it.
  }
}

export type PickResult =
  { status: 'picked'; fileName: string } | { status: 'cancelled' } | { status: 'denied' };

/** Opens the photo library, lets the user crop to a square, and stores the result. */
export async function pickVehiclePhoto(): Promise<PickResult> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return { status: 'denied' };

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset) return { status: 'cancelled' };

  const dir = photoDir();
  dir.create({ idempotent: true, intermediates: true });
  const fileName = `${Date.now()}.jpg`;
  new File(asset.uri).copy(new File(dir, fileName));
  return { status: 'picked', fileName };
}
