import React, {useRef, useEffect, useState, useMemo} from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';
import { createRegularMarker, createSelectedMarker } from '../shared/utils/markerTemplates';
import { createInfoWindow } from '../shared/utils/infoWindow';
import { createCustomEqual } from 'fast-equals';
import { isLatLngLiteral } from '@googlemaps/typescript-guards';
import MapChips from './MapChips';
import {AccessMap, Location, Place, PlaceGroup, SelectableAccessMap, UserRole} from "../shared/types";

const deepCompareEqualsForMaps = createCustomEqual({
  createCustomConfig: () => ({
    areObjectsEqual: (a: any, b: any) => {
      const googleMaps = (window as any).google?.maps;
      if (googleMaps && (
        isLatLngLiteral(a) ||
        a instanceof googleMaps.LatLng ||
        isLatLngLiteral(b) ||
        b instanceof googleMaps.LatLng
      )) {
        return new googleMaps.LatLng(a).equals(new googleMaps.LatLng(b));
      }
      return undefined;
    }
  })
});

function useDeepCompareMemoize(value: any) {
  const ref = useRef<any>(undefined);
  if (!deepCompareEqualsForMaps(value, ref.current)) {
    ref.current = value;
  }
  return ref.current;
}

function useDeepCompareEffectForMaps(callback: React.EffectCallback, dependencies: any[]) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(callback, dependencies.map(useDeepCompareMemoize));
}

interface MapWrapperProps {
  center?: Location;
  zoom?: number;
  onClick?: (e: any) => void;
  onIdle?: (map: any) => void;
  children?: React.ReactNode;
  sx?: React.CSSProperties;
  onMapReady?: (map: any) => void;
  mapTypeControl?: boolean;
  streetViewControl?: boolean;
  fullscreenControl?: boolean;
  gestureHandling?: string;
  mapId?: string;
}

const MapWrapper: React.FC<MapWrapperProps> = ({ onClick, onIdle, children, sx, onMapReady, center, zoom, ...options }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>();

  useEffect(() => {
    if (ref.current && !map) {
      const newMap = new (window as any).google.maps.Map(ref.current, {
        center,
        zoom,
      });
      setMap(newMap);
      if (onMapReady) {
        onMapReady(newMap);
      }
    }
  }, [ref, map, onMapReady, center, zoom]);

  // Update only non-camera options (exclude center and zoom to prevent auto-panning)
  useDeepCompareEffectForMaps(() => {
    if (map) {
      map.setOptions(options);
    }
  }, [map, options]);

  useEffect(() => {
    if (map) {
      ['click', 'idle'].forEach((eventName) =>
        (window as any).google.maps.event.clearListeners(map, eventName)
      );

      if (onClick) {
        map.addListener('click', onClick);
      }

      if (onIdle) {
        map.addListener('idle', () => onIdle(map));
      }
    }
  }, [map, onClick, onIdle]);

  return (
    <>
      <div ref={ref} style={{ width: '100%', height: '100%', ...sx }} />
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { map });
        }
        return null;
      })}
    </>
  );
};

interface MarkersProps {
  map?: any;
  places: Place[];
  selectedPlace: Place | null;
  onPlaceSelect: (place: Place | null) => void;
  activeFilters: Set<PlaceGroup>;
  onEmojiChangeRequest: (place: Place) => void;
  onChangeGroup: (place: Place, newGroup: PlaceGroup) => Promise<void>;
  onRemovePlace: (place: Place) => Promise<void>;
  onInfoWindowRefUpdate?: (ref: React.MutableRefObject<any | null>) => void;
  accessMaps?: Map<string, AccessMap>;
}

const Markers: React.FC<MarkersProps> = ({
  map,
  places,
  selectedPlace,
  onPlaceSelect,
  activeFilters,
  onEmojiChangeRequest,
  onChangeGroup,
  onRemovePlace,
  onInfoWindowRefUpdate,
  accessMaps = new Map<string, AccessMap>()
}) => {
  const markersRef = useRef<Map<string, any>>(new Map()); // Map of placeId -> marker
  const infoWindowRef = useRef<any | null>(null);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  const onEmojiChangeRequestRef = useRef(onEmojiChangeRequest);
  const onChangeGroupRef = useRef(onChangeGroup);
  const onRemovePlaceRef = useRef(onRemovePlace);

  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect;
    onEmojiChangeRequestRef.current = onEmojiChangeRequest;
    onChangeGroupRef.current = onChangeGroup;
    onRemovePlaceRef.current = onRemovePlace;
  }, [onPlaceSelect, onEmojiChangeRequest, onChangeGroup, onRemovePlace]);

  // Expose infoWindowRef to parent component
  useEffect(() => {
    if (onInfoWindowRefUpdate) {
      onInfoWindowRefUpdate(infoWindowRef);
    }
  }, [onInfoWindowRefUpdate]);

  // Create/remove markers when places are added/removed
  useEffect(() => {
    if (!map) return;

    const currentMarkers = markersRef.current;

    const updateMarkers = async () => {
      const { AdvancedMarkerElement } = await (window as any).google.maps.importLibrary('marker') as any;
      const placeIds = new Set(places.map(p => p.id));

      // Remove markers for places that no longer exist
      currentMarkers.forEach((marker, placeId) => {
        if (!placeIds.has(placeId)) {
          marker.setMap(null);
          currentMarkers.delete(placeId);
        }
      });

      // Add markers for new places
      places.forEach(place => {
        if (!currentMarkers.has(place.id)) {
          const emoji = place.emoji || '📍';
          const content = createRegularMarker(emoji);
          const group = place.group || 'want to go';
          const shouldShow = activeFilters.size === 0 ? false : activeFilters.has(group);

          const marker = new AdvancedMarkerElement({
            map: shouldShow ? map : null,
            position: place.geometry!.location,
            content,
            title: place.name,
            zIndex: 1,
          });

          marker.addListener('click', () => {
            if (infoWindowRef.current) {
              infoWindowRef.current.close();
            }

            const currentPlace = (marker as any).placeData;
            const accessMap = accessMaps.get(currentPlace.mapId);
            const userRole = accessMap ? ('role' in accessMap ? accessMap.role : UserRole.EDIT) : UserRole.VIEW;

            infoWindowRef.current = createInfoWindow(
              map,
              marker,
              currentPlace,
              () => onPlaceSelectRef.current(null),
              onEmojiChangeRequestRef.current,
              async (placeToUpdate: Place, newGroup: PlaceGroup) => {
                await onChangeGroupRef.current(placeToUpdate, newGroup);
              },
              onRemovePlaceRef.current,
              userRole,
              (newEmoji: string) => {
                // Update marker emoji visually
                marker.content = createRegularMarker(newEmoji);
              }
            );

            onPlaceSelectRef.current(currentPlace);
          });

          (marker as any).placeData = place;
          currentMarkers.set(place.id, marker);
        }
      });
    };

    updateMarkers();
  }, [map, places, activeFilters, accessMaps]);

  // Update marker data and appearance when place changes
  useEffect(() => {
    places.forEach(place => {
      const marker = markersRef.current.get(place.id);
      if (marker) {
        // Update emoji if changed
        if ((marker as any).placeData.emoji !== place.emoji) {
          const emoji = place.emoji || '📍';
          marker.content = createRegularMarker(emoji);
        }
        // Always update placeData to keep it in sync
        (marker as any).placeData = place;
      }
    });
  }, [places]);

  // Update marker visibility based on active filters
  useEffect(() => {
    places.forEach(place => {
      const marker = markersRef.current.get(place.id);
      if (marker) {
        const group = place.group || 'want to go';
        const shouldShow = activeFilters.size === 0 ? false : activeFilters.has(group);
        marker.setMap(shouldShow ? map : null);
      }
    });
  }, [activeFilters, places, map]);

  // Update marker appearance when selection changes
  useEffect(() => {
    if (!map) return;

    if (!selectedPlace && infoWindowRef.current) {
      infoWindowRef.current.close();
    }

    markersRef.current.forEach(marker => {
      const emoji = (marker as any).placeData.emoji || '📍';
      marker.content = createRegularMarker(emoji);
      marker.zIndex = 1;
    });

    if (!selectedPlace) return;

    // Find the selected marker
    let selectedMarker = null;
    for (const marker of markersRef.current.values()) {
      if ((marker as any).placeData?.id === selectedPlace.id) {
        selectedMarker = marker;
        break;
      }
    }

    if (selectedMarker) {
      const emoji = selectedPlace.emoji || '📍';
      selectedMarker.content = createSelectedMarker(emoji);
      selectedMarker.zIndex = 999;
    }
  }, [selectedPlace, map]);

  return null;
};

interface MapComponentProps {
  places: Place[];
  selectedPlace: Place | null;
  onPlaceSelect: (place: Place | null) => void;
  onMapClick?: (latLng: any) => void;
  onEmojiChangeRequest: (place: Place) => void;
  onChangeGroup: (place: Place, newGroup: PlaceGroup) => Promise<void>;
  onRemovePlace: (place: Place) => Promise<void>;
  activeFilters: Set<PlaceGroup>;
  onInfoWindowRefUpdate?: (ref: React.MutableRefObject<any | null>) => void;
  center?: Location;
  onMapReady?: (map: any) => void;
  visibleMapIds?: Set<string>;
  onMapVisibilityToggle?: (mapId: string) => void;
  showSearch?: boolean;
  userEmail?: string;
  onMapCreated?: () => void;
  onMapEdit?: (map: AccessMap) => void;
  accessMaps?: Map<string, AccessMap>;
}

const MapComponent: React.FC<MapComponentProps> = ({
  places,
  selectedPlace,
  onPlaceSelect,
  onMapClick,
  onEmojiChangeRequest,
  onChangeGroup,
  onRemovePlace,
  activeFilters,
  onInfoWindowRefUpdate,
  center: propCenter,
  onMapReady,
  visibleMapIds = new Set(),
  onMapVisibilityToggle,
  showSearch = false,
  userEmail,
  onMapCreated,
  onMapEdit,
  accessMaps = new Map<string, AccessMap>()
}) => {
  const center: Location = propCenter ?? { lat: 37.7749, lng: -122.4194 };
  const [zoom] = useState(13);
  const mapRef = useRef<any | null>(null);

  // Convert accessMaps and visibleMapIds to SelectableAccessMap[]
  const selectableAccessMaps = useMemo((): SelectableAccessMap[] => {
    return Array.from(accessMaps.values()).map(accessMap => {
      const mapId = 'mapId' in accessMap ? accessMap.mapId : accessMap.id;
      return {
        ...accessMap,
        selected: visibleMapIds.has(mapId)
      } as SelectableAccessMap;
    });
  }, [accessMaps, visibleMapIds]);

  const onClick = (e: any) => {
    if (onMapClick && e.latLng) {
      onMapClick(e.latLng);
    }
  };

  const onIdle = (map: any) => {
    mapRef.current = map;
  };

  const render = (status: string) => {
    return <h1>{status}</h1>;
  };

  return (
    <Wrapper
      apiKey={process.env['REACT_APP_GOOGLE_MAPS_API_KEY']!}
      render={render}
      libraries={['places', 'marker']}
    >
      <MapWrapper
        center={center}
        zoom={zoom}
        onClick={onClick}
        onIdle={onIdle}
        onMapReady={onMapReady}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={false}
        gestureHandling={'greedy'}
        mapId={process.env['REACT_APP_GOOGLE_MAP_ID'] || 'DEMO_MAP_ID'}
      >
        <Markers
          places={places}
          selectedPlace={selectedPlace}
          onPlaceSelect={onPlaceSelect}
          onEmojiChangeRequest={onEmojiChangeRequest}
          onChangeGroup={onChangeGroup}
          onRemovePlace={onRemovePlace}
          activeFilters={activeFilters}
          onInfoWindowRefUpdate={onInfoWindowRefUpdate}
          accessMaps={accessMaps}
        />
      </MapWrapper>
      {selectableAccessMaps.length > 0 && !showSearch && (
        <MapChips
          selectableMaps={selectableAccessMaps}
          selectedMapIds={visibleMapIds}
          onMapToggle={onMapVisibilityToggle}
          onMapEdit={onMapEdit}
          onViewEdit={onMapEdit}
          userEmail={userEmail}
          onMapCreate={onMapCreated}
          sx={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: '600px',
            width: 'auto',
            px: 2,
            zIndex: 1000,
          }}
        />
      )}
    </Wrapper>
  );
};

export default MapComponent;
