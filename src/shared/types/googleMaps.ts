/**
 * Type definitions for Google Maps API objects
 * These types provide proper typing for Google Maps objects used throughout the app
 */

/// <reference types="@types/google.maps" />

// Re-export commonly used Google Maps types
export type GoogleMap = google.maps.Map;
export type GoogleMapOptions = google.maps.MapOptions;
export type GoogleLatLng = google.maps.LatLng;
export type GoogleLatLngLiteral = google.maps.LatLngLiteral;
export type GoogleMapMouseEvent = google.maps.MapMouseEvent;
export type GoogleInfoWindow = google.maps.InfoWindow;
export type GoogleMapsEvent = google.maps.MapsEventListener;

// Advanced Marker types (from the marker library)
export interface GoogleAdvancedMarkerElement {
  map: GoogleMap | null;
  position: GoogleLatLngLiteral | GoogleLatLng | null;
  content: Node | null;
  title: string;
  zIndex: number;
  addListener(eventName: string, handler: (event?: unknown) => void): GoogleMapsEvent;
  setMap(map: GoogleMap | null): void;
}

// Marker library import type
export interface MarkerLibrary {
  AdvancedMarkerElement: new (options: {
    map?: GoogleMap | null;
    position?: GoogleLatLngLiteral | GoogleLatLng | null;
    content?: Node | null;
    title?: string;
    zIndex?: number;
  }) => GoogleAdvancedMarkerElement;
}

// Custom event types with proper typing
export interface MapClickEvent extends google.maps.MapMouseEvent {
  latLng: GoogleLatLng;
}

export interface MapLongPressEvent {
  latLng: GoogleLatLng;
}

// Type guards
export function isGoogleLatLng(obj: unknown): obj is GoogleLatLng {
  if (!obj || typeof obj !== 'object') return false;
  return 'lat' in obj && 'lng' in obj && typeof (obj as GoogleLatLng).lat === 'function';
}

export function isGoogleLatLngLiteral(obj: unknown): obj is GoogleLatLngLiteral {
  if (!obj || typeof obj !== 'object') return false;
  const literal = obj as GoogleLatLngLiteral;
  return typeof literal.lat === 'number' && typeof literal.lng === 'number';
}

// Helper type for marker with custom data
export interface MarkerWithPlaceData extends GoogleAdvancedMarkerElement {
  placeData?: {
    id: string;
    mapId: string;
    emoji: string;
    name: string;
    group: string;
    [key: string]: unknown;
  };
}

// Type for window.google namespace
export interface WindowWithGoogleMaps extends Window {
  google: {
    maps: typeof google.maps;
  };
}

// Deep compare types for fast-equals
export type DeepCompareValue = unknown;