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
  activeFilter = 'all'
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
        {/* CartoDB High-Performance Dark Matter Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        {/* 1. Dynamic Flood Severity Polygons */}
        {layers.zones && <ZonePolygonLayer zonesGeoJSON={zonesGeoJSON} />}

        {/* 2. Ultrasonic Sensor Telemetry Markers */}
        {layers.sensors && <SensorMarkerLayer sensors={sensors} />}

        {/* 3. Emergency Routes & POIs */}
        <EmergencyPOILayer 
          showRoutes={layers.route}
          showPois={layers.pois}
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
