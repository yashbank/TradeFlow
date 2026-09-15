// ==============================================================================
// src/lib/map/mapUtils.ts — Pure Map Tile & Satellite Toggle State Engine
// ==============================================================================

export type MapViewMode = 'standard' | 'satellite';

export interface MapLayerConfig {
  mode: MapViewMode;
  isSatellite: boolean;
  tileUrl: string;
  attribution: string;
  maxZoom: number;
  contrastFilter: string;
}

/**
 * Toggles map view mode between standard vector and satellite imagery.
 */
export function toggleMapLayer(current: MapViewMode): MapViewMode {
  return current === 'satellite' ? 'standard' : 'satellite';
}

/**
 * Returns true if the map is currently in satellite mode.
 */
export function isSatelliteMap(mode: string): boolean {
  return mode === 'satellite';
}

/**
 * Returns the layer configuration and tile URL for the specified mode.
 */
export function getMapLayerConfig(mode: MapViewMode): MapLayerConfig {
  const isSatellite = mode === 'satellite';
  return {
    mode,
    isSatellite,
    tileUrl: isSatellite
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: isSatellite
      ? 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      : '© OpenStreetMap contributors',
    maxZoom: isSatellite ? 19 : 18,
    contrastFilter: isSatellite ? 'contrast(105%) brightness(95%)' : 'none',
  };
}

/**
 * Coordinate distance calculation (Haversine formula in kilometers).
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}
