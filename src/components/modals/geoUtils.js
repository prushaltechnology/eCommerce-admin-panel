export const MUMBAI_CENTER = { lat: 19.076, lon: 72.8777 };
export const MUMBAI_RADIUS_METERS = 45000;

export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isWithinMumbai(lat, lon) {
  return (
    haversineDistance(lat, lon, MUMBAI_CENTER.lat, MUMBAI_CENTER.lon) <=
    MUMBAI_RADIUS_METERS
  );
}