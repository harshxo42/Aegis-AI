import L from 'leaflet';

/**
 * Aegis AI – Leaflet Map Icons
 *
 * Self-contained SVG DivIcons for hospitals, ambulances, emergencies,
 * and user locations. Avoids flaky third-party image CDNs and CORS issues.
 */

export const hospitalIcon = L.divIcon({
  className: 'aegis-map-icon-hospital',
  html: `
    <div style="
      width: 36px;
      height: 36px;
      background: #2563eb;
      border: 3px solid #ffffff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.45);
      color: #ffffff;
    ">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 6v12M6 12h12"/>
      </svg>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
});

export const ambulanceIcon = L.divIcon({
  className: 'aegis-map-icon-ambulance',
  html: `
    <div style="
      width: 36px;
      height: 36px;
      background: #f59e0b;
      border: 3px solid #ffffff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.45);
      color: #ffffff;
    ">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect width="16" height="12" x="1" y="5" rx="2"/>
        <path d="M17 10h4l2 3v4h-6v-7z"/>
        <circle cx="6" cy="18" r="2"/>
        <circle cx="18" cy="18" r="2"/>
      </svg>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
});

export const emergencyIcon = L.divIcon({
  className: 'aegis-map-icon-emergency',
  html: `
    <div style="
      width: 38px;
      height: 38px;
      background: #dc2626;
      border: 3px solid #ffffff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 0 6px rgba(220, 38, 38, 0.3), 0 4px 14px rgba(0, 0, 0, 0.5);
      color: #ffffff;
      animation: pulse 1.5s infinite;
    ">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    </div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -22],
});

/**
 * User-selected emergency location marker.
 */
export const userLocationIcon = L.divIcon({
  className: 'aegis-user-location-marker',
  html: `
    <div style="
      width: 28px;
      height: 28px;
      background: #ef4444;
      border: 4px solid #ffffff;
      border-radius: 50%;
      box-shadow:
        0 0 0 6px rgba(239, 68, 68, 0.3),
        0 4px 12px rgba(0, 0, 0, 0.5);
      position: relative;
    ">
      <div style="
        position: absolute;
        inset: 4px;
        background: #ffffff;
        border-radius: 50%;
      "></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});

/**
 * Temporary interactive location selection pin on the map.
 */
export const selectedPinIcon = L.divIcon({
  className: 'aegis-map-icon-selected-pin',
  html: `
    <div style="
      width: 34px;
      height: 34px;
      background: #6366f1;
      border: 3px solid #ffffff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 0 6px rgba(99, 102, 241, 0.35), 0 4px 14px rgba(0, 0, 0, 0.4);
      color: #ffffff;
    ">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -36],
});