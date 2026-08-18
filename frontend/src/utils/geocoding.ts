/**
 * Aegis AI – Geocoding Utilities
 *
 * Reverse geocoding with in-memory caching and LocationIQ / OpenStreetMap Nominatim fallback.
 */

export interface AddressDetails {
  primary: string;
  secondary: string;
  full: string;
}

const geocodeCache: Record<string, AddressDetails> = {};

export const reverseGeocode = async (
  lat: number,
  lng: number
): Promise<AddressDetails | null> => {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (geocodeCache[cacheKey]) {
    return geocodeCache[cacheKey];
  }

  const apiKey = import.meta.env.VITE_LOCATIONIQ_API_KEY;

  try {
    let res: Response;
    if (apiKey) {
      res = await fetch(
        `https://us1.locationiq.com/v1/reverse?key=${apiKey}&lat=${lat}&lon=${lng}&format=json`
      );
    } else {
      res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
    }

    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address || {};

    const primary =
      addr.road ||
      addr.suburb ||
      addr.neighbourhood ||
      addr.residential ||
      addr.amenity ||
      addr.building ||
      addr.commercial ||
      addr.name ||
      addr.city_district ||
      addr.city ||
      'Selected Location';

    const secondaryParts = [
      addr.city || addr.town || addr.village || addr.county,
      addr.state || addr.province,
      addr.country,
    ].filter(Boolean);

    const secondary = secondaryParts.join(', ');
    const full = data.display_name || `${primary}, ${secondary}`;

    const result: AddressDetails = {
      primary,
      secondary,
      full,
    };

    geocodeCache[cacheKey] = result;
    return result;
  } catch (err) {
    console.warn('[Aegis AI] Reverse geocoding lookup failed:', err);
    return null;
  }
};
