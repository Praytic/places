/* global google */
import React, {useRef, useEffect, useState} from 'react';
import {Wrapper} from '@googlemaps/react-wrapper';
import {createRegularMarker, createSelectedMarker} from '../utils/markerTemplates';
import {createInfoWindow} from '../utils/infoWindow';
import {createCustomEqual} from 'fast-equals';
import {isLatLngLiteral} from '@googlemaps/typescript-guards';

const deepCompareEqualsForMaps = createCustomEqual((deepEqual) => (a, b) => {
    if (
        isLatLngLiteral(a) ||
        a instanceof google.maps.LatLng ||
        isLatLngLiteral(b) ||
        b instanceof google.maps.LatLng
    ) {
        return new google.maps.LatLng(a).equals(new google.maps.LatLng(b));
    }
    return deepEqual(a, b);
});

function useDeepCompareMemoize(value) {
    const ref = useRef();
    if (!deepCompareEqualsForMaps(value, ref.current)) {
        ref.current = value;
    }
    return ref.current;
}

function useDeepCompareEffectForMaps(callback, dependencies) {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(callback, dependencies.map(useDeepCompareMemoize));
}

const MapWrapper = ({onClick, onIdle, children, style, ...options}) => {
    const ref = useRef(null);
    const [map, setMap] = useState();

    useEffect(() => {
        if (ref.current && !map) {
            setMap(new window.google.maps.Map(ref.current, {}));
        }
    }, [ref, map]);

    useDeepCompareEffectForMaps(() => {
        if (map) {
            map.setOptions(options);
        }
    }, [map, options]);

    useEffect(() => {
        if (map) {
            ['click', 'idle'].forEach((eventName) =>
                google.maps.event.clearListeners(map, eventName)
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
            <div ref={ref} style={style}/>
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child, {map});
                }
            })}
        </>
    );
};

const Markers = ({map, places, selectedPlace, onPlaceSelect, hiddenLayers, onEmojiChangeRequest, onChangeGroup, userRole}) => {
    const markersRef = useRef(new Map()); // Map of placeId -> marker
    const infoWindowRef = useRef(null);
    const onPlaceSelectRef = useRef(onPlaceSelect);
    const onEmojiChangeRequestRef = useRef(onEmojiChangeRequest);
    const onChangeGroupRef = useRef(onChangeGroup);

    useEffect(() => {
        onPlaceSelectRef.current = onPlaceSelect;
        onEmojiChangeRequestRef.current = onEmojiChangeRequest;
        onChangeGroupRef.current = onChangeGroup;
    }, [onPlaceSelect, onEmojiChangeRequest, onChangeGroup]);

    // Create/remove markers when places are added/removed
    useEffect(() => {
        if (!map) return;

        const currentMarkers = markersRef.current;

        const updateMarkers = async () => {
            const {AdvancedMarkerElement} = await window.google.maps.importLibrary('marker');
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
                    const shouldShow = !hiddenLayers.has(group);

                    const marker = new AdvancedMarkerElement({
                        map: shouldShow ? map : null,
                        position: place.geometry.location,
                        content,
                        title: place.name,
                        zIndex: 1
                    });

                    marker.addListener('click', () => {
                        if (infoWindowRef.current) {
                            infoWindowRef.current.close();
                        }

                        const createInfoWindowWithToggle = (currentPlace) => {
                            infoWindowRef.current = createInfoWindow(
                                map,
                                marker,
                                currentPlace,
                                () => onPlaceSelectRef.current(null),
                                onEmojiChangeRequestRef.current,
                                async (placeToToggle) => {
                                    const newGroup = placeToToggle.group === 'favorite' ? 'want to go' : 'favorite';
                                    await onChangeGroupRef.current(placeToToggle, newGroup);

                                    // Close and reopen the info window to reflect the change
                                    if (infoWindowRef.current) {
                                        infoWindowRef.current.close();
                                    }

                                    // Update the place data with new group and recreate info window
                                    const updatedPlace = { ...placeToToggle, group: newGroup };
                                    createInfoWindowWithToggle(updatedPlace);
                                },
                                userRole
                            );
                        };

                        createInfoWindowWithToggle(place);
                        onPlaceSelectRef.current(place);
                    });

                    marker.placeData = place;
                    currentMarkers.set(place.id, marker);
                }
            });
        };

        updateMarkers();
    }, [map, places, hiddenLayers, userRole]);

    // Update marker appearance when emoji changes
    useEffect(() => {
        places.forEach(place => {
            const marker = markersRef.current.get(place.id);
            if (marker && marker.placeData.emoji !== place.emoji) {
                const emoji = place.emoji || '📍';
                marker.content = createRegularMarker(emoji);
                marker.placeData = place;
            }
        });
    }, [places]);

    // Update marker visibility based on hidden layers
    useEffect(() => {
        places.forEach(place => {
            const marker = markersRef.current.get(place.id);
            if (marker) {
                const group = place.group || 'want to go';
                marker.setMap(hiddenLayers.has(group) ? null : map);
            }
        });
    }, [hiddenLayers, places, map]);

    // Update marker appearance when selection changes
    useEffect(() => {
        if (!map) return;

        if (!selectedPlace && infoWindowRef.current) {
            infoWindowRef.current.close();
        }

        markersRef.current.forEach(marker => {
            const emoji = marker.placeData.emoji || '📍';
            marker.content = createRegularMarker(emoji);
            marker.zIndex = 1;
        });

        if (!selectedPlace) return;

        // Find the selected marker
        let selectedMarker = null;
        for (const marker of markersRef.current.values()) {
            if (marker.placeData?.id === selectedPlace.id) {
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

const MapComponent = ({
                          places,
                          selectedPlace,
                          onPlaceSelect,
                          onMapClick,
                          onEmojiChangeRequest,
                          onChangeGroup,
                          hiddenLayers,
                          userRole
                      }) => {
    const [center] = useState({lat: 37.7749, lng: -122.4194});
    const [zoom] = useState(13);

    const onClick = (e) => {
        if (onMapClick) {
            onMapClick(e.latLng);
        }
    };

    const onIdle = (map) => {
        console.log('Map idle');
    };

    const render = (status) => {
        return <h1>{status}</h1>;
    };

    return (
        <Wrapper
            apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
            render={render}
            libraries={['places', 'marker']}
        >
            <MapWrapper
                center={center}
                zoom={zoom}
                onClick={onClick}
                onIdle={onIdle}
                mapTypeControl={false}
                streetViewControl={false}
                fullscreenControl={false}
                mapId={process.env.REACT_APP_GOOGLE_MAP_ID || 'DEMO_MAP_ID'}
                style={{width: '100%', height: '100%'}}
            >
                <Markers
                    places={places}
                    selectedPlace={selectedPlace}
                    onPlaceSelect={onPlaceSelect}
                    onEmojiChangeRequest={onEmojiChangeRequest}
                    onChangeGroup={onChangeGroup}
                    hiddenLayers={hiddenLayers}
                    userRole={userRole}
                />
            </MapWrapper>
        </Wrapper>
    );
};

export default MapComponent;
