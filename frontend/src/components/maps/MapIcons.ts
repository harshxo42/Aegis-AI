import L from 'leaflet';

/**
 * Aegis AI – Leaflet Map Icons
 *
 * Uses external image icons for hospitals/ambulances/emergencies
 * and a local DivIcon for the user's selected emergency location.
 */

export const hospitalIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/508/508757.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export const ambulanceIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2854/2854060.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export const emergencyIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/564/564249.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
  className: 'animate-pulse-ring',
});

/**
 * User-selected emergency location marker.
 *
 * Uses DivIcon instead of an external image so the marker
 * does not depend on a third-party image CDN.
 */
export const userLocationIcon = L.divIcon({
  className: 'aegis-user-location-marker',
  html: `
    <div style="
      width: 24px;
      height: 24px;
      background: #ef4444;
      border: 4px solid white;
      border-radius: 50%;
      box-shadow:
        0 0 0 6px rgba(239, 68, 68, 0.25),
        0 4px 12px rgba(0, 0, 0, 0.45);
    "></div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -14],
});