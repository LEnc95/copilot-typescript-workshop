import { Photo } from '@/lib/mock-photo-data';

/**
 * Returns a local calendar-day key in YYYY-MM-DD format.
 */
export function getCalendarDayKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Creates a stable positive numeric hash for a string.
 */
export function getStableStringHash(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

/**
 * Picks a deterministic featured photo using an explicit day key.
 * Returns null when no photos are available.
 */
export function getFeaturedPhotoFromDayKey(photos: Photo[], dayKey: string): Photo | null {
  if (photos.length === 0) {
    return null;
  }

  const index = getStableStringHash(dayKey) % photos.length;

  return photos[index] ?? null;
}

/**
 * Picks a deterministic "photo of the day" from a list.
 * The same photo is returned for all users during the same local calendar day.
 * Returns null when no photos are available.
 */
export function getFeaturedPhotoOfDay(photos: Photo[], date: Date = new Date()): Photo | null {
  const dayKey = getCalendarDayKey(date);

  return getFeaturedPhotoFromDayKey(photos, dayKey);
}
