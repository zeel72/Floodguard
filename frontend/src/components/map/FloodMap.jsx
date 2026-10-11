import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import ZonePolygonLayer from './ZonePolygonLayer';
import SensorMarkerLayer from './SensorMarkerLayer';
import EmergencyPOILayer from './EmergencyPOILayer';
import MapLegend from './MapLegend';

const DEFAULT_CENTER = [19.0760, 72.8777];
const DEFAULT_ZOOM = 13;

export default function FloodMap({
  zonesGeoJSON,
  sensors = [],
  activeFilter = 'all',
  activeRoute = null
}) {
  const [layers, setLayers] = useState({
    zones: true,
    sensors: true,
    route: true,
    pois: true
  });

  // Sync with external filter pill from header/console if provided
  useEffect(() => {
    if (activeFilter === 'all') {
      setLayers({ zones: true, sensors: true, route: true, pois: true });
    } else if (activeFilter === 'sensors') {
      setLayers({ zones: false, sensors: true, route: false, pois: false });
    } else if (activeFilter === 'flood-zones') {
      setLayers({ zones: true, sensors: false, route: false, pois: false });
    } else if (activeFilter === 'routes') {
      setLayers({ zones: false, sensors: false, route: true, pois: true });
    }
  }, [activeFilter]);

  const handleToggleLayer = (layerKey) => {
    setLayers((prev) => ({
      ...prev,
      [layerKey]: !prev[layerKey]
    }));
  };

  return (
    <div className="floodmap-wrapper" id="leaflet-floodmap-container">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', minHeight: '440px', background: '#070d18' }}
      >
        {/* Clean High-Performance Dark Matter Tile Layer (Zero Watermark) */}
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>, DeLorme, NAVTEQ'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          maxZoom={16}
        />

        {/* 1. Dynamic Flood Severity Polygons */}
        {layers.zones && <ZonePolygonLayer zonesGeoJSON={zonesGeoJSON} />}

        {/* 2. Ultrasonic Sensor Telemetry Markers */}
        {layers.sensors && <SensorMarkerLayer sensors={sensors} />}

        {/* 3. Emergency Routes & POIs */}
        <EmergencyPOILayer 
          showRoutes={layers.route}
          showPois={layers.pois}
          activeRoute={activeRoute}
        />
      </MapContainer>

      {/* Floating Tactical GIS Legend & Layer Control HUD */}
      <MapLegend 
        layers={layers}
        onToggleLayer={handleToggleLayer}
      />
    </div>
  );
}
