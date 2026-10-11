import React from 'react';
import { Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Hospital, Flame, ShieldAlert, CheckCircle2 } from 'lucide-react';

function createPOIDivIcon(type, label) {
  const isHospital = type === 'hospital';
  const color = isHospital ? '#ec4899' : '#f97316';
  const iconSymbol = isHospital ? '🏥' : '🚒';

  const html = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      transform: translate(-50%, -100%);
      cursor: pointer;
    ">
      <div style="
        background: #0b1329;
        border: 2px solid ${color};
        box-shadow: 0 0 12px ${color}80;
        border-radius: 8px;
        padding: 4px 6px;
        display: flex;
        align-items: center;
        gap: 4px;
        font-family: 'Outfit', sans-serif;
        font-weight: 700;
        font-size: 11px;
        color: #ffffff;
        white-space: nowrap;
      ">
        <span>${iconSymbol}</span>
        <span>${label}</span>
      </div>
      <div style="
        width: 0; 
        height: 0; 
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 6px solid ${color};
      "></div>
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'custom-poi-marker',
    iconSize: [80, 30],
    iconAnchor: [40, 30]
  });
}

// Fixed Key Emergency Facilities
const EMERGENCY_POIS = [
  {
    id: "POI-HOSPITAL",
    name: "St. Jude Trauma Emergency Hospital",
    type: "hospital",
    label: "Trauma Hospital",
    lat: 19.0880,
    lng: 72.9020,
    elevation_m: 19.2,
    status: "100% OPERATIONAL (HIGH ELEVATION)"
  },
  {
    id: "POI-DISPATCH",
    name: "Fire Station #7 / Ambulance Unit 104",
    type: "station",
    label: "Ambulance Bay #4",
    lat: 19.0680,
    lng: 72.8910,
    elevation_m: 16.8,
    status: "FIRST RESPONDER DISPATCH ACTIVE"
  }
];

// Demonstration Road Networks
const BLOCKED_SHORTEST_PATH = [
  [19.0680, 72.8910],
  [19.0720, 72.8850],
  [19.0760, 72.8777], // Submerged Central Underpass (82cm depth)
  [19.0840, 72.8950],
  [19.0880, 72.9020]
];

const SAFE_EVACUATION_PATH = [
  [19.0680, 72.8910],
  [19.0750, 72.8980],
  [19.0840, 72.9020], // Highground ridge route (19.2m elevation)
  [19.0880, 72.9020]
];

export default function EmergencyPOILayer({ 
  showRoutes = true, 
  showPois = true,
  activeRoute = null 
}) {
  const safeWaypoints = activeRoute?.safe_flood_avoidance_route?.waypoints?.length > 1
    ? activeRoute.safe_flood_avoidance_route.waypoints
    : SAFE_EVACUATION_PATH;

  const blockedWaypoints = activeRoute?.standard_shortest_route?.waypoints?.length > 1
    ? activeRoute.standard_shortest_route.waypoints
    : BLOCKED_SHORTEST_PATH;

  const safeInfo = activeRoute?.safe_flood_avoidance_route;
  const standardInfo = activeRoute?.standard_shortest_route;

  return (
    <>
      {/* Route Overlays: Green Safe Route vs Red Flooded Route */}
      {showRoutes && (
        <>
          {/* Safe Route (Recommended - Green Neon) */}
          <Polyline
            positions={safeWaypoints}
            pathOptions={{
              color: '#10b981',
              weight: 5,
              opacity: 0.9,
              dashArray: undefined
            }}
          >
            <Popup className="floodguard-popup">
              <div style={{ padding: '4px' }}>
                <span className="panel-badge badge-safe">RECOMMENDED SAFE ROUTE</span>
                <div style={{ fontWeight: 700, marginTop: '4px', color: '#10b981' }}>
                  {safeInfo?.narrative || 'Via Eastern Ridge Flyover (Elev 19.2m)'}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#cbd5e1', marginTop: '2px' }}>
                  100% passability • {safeInfo?.distance_km ?? 5.6} km ({safeInfo?.eta_min ?? 13} mins)
                </div>
              </div>
            </Popup>
          </Polyline>

          {/* Blocked Shortest Route (Warning - Red Dashed) */}
          <Polyline
            positions={blockedWaypoints}
            pathOptions={{
              color: '#ef4444',
              weight: 4,
              opacity: 0.75,
              dashArray: '8, 8'
            }}
          >
            <Popup className="floodguard-popup">
              <div style={{ padding: '4px' }}>
                <span className="panel-badge badge-critical">
                  {standardInfo?.passability === 'CLEAR & SAFE' ? 'STANDARD GPS ROUTE' : 'HAZARD: IMPASSABLE ROUTE'}
                </span>
                <div style={{ fontWeight: 700, marginTop: '4px', color: '#ef4444' }}>
                  {standardInfo?.narrative || 'Central Underpass Submerged (82cm Depth)'}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#cbd5e1', marginTop: '2px' }}>
                  Max water depth: {standardInfo?.max_flood_depth_cm ?? 82.4} cm • {standardInfo?.distance_km ?? 4.8} km
                </div>
              </div>
            </Popup>
          </Polyline>
        </>
      )}

      {/* POI Markers */}
      {showPois && (
        <>
          {EMERGENCY_POIS.map((poi) => (
            <Marker
              key={poi.id}
              position={[poi.lat, poi.lng]}
              icon={createPOIDivIcon(poi.type, poi.label)}
            >
              <Popup className="floodguard-popup">
                <div style={{ padding: '4px', minWidth: '180px' }}>
                  <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.88rem' }}>
                    {poi.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '4px 0' }}>
                    Elevation: {poi.elevation_m}m • {poi.status}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </>
      )}
    </>
  );
}
