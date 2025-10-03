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
    useEffect(callback, dependencies.map(useDeepCompareMemoize));
}

const Map = ({onClick, onIdle, children, style, ...options}) => {
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

const Markers = ({map, places, selectedPlace, onPlaceSelect, hiddenLayers, onEmojiChangeRequest}) => {
    const markersRef = useRef([]);
    const infoWindowRef = useRef(null);

    useEffect(() => {
        if (!map) return;

        const createMarkers = async () => {
            // Cleanup old markers
            markersRef.current.forEach(marker => marker.setMap(null));
            if (infoWindowRef.current) {
                infoWindowRef.current.close();
            }

            const {AdvancedMarkerElement} = await window.google.maps.importLibrary('marker');

            const filteredPlaces = places.filter(place => {
                const group = place.group || 'want to go';
                return !hiddenLayers.has(group);
            });

            const newMarkers = filteredPlaces.map(place => {
                const emoji = place.emoji || '📍';
                const content = createRegularMarker(emoji);

                const marker = new AdvancedMarkerElement({
                    map,
                    position: place.geometry.location,
                    content,
                    title: place.name,
                    zIndex: 1
                });

                marker.addListener('click', () => {
                    if (infoWindowRef.current) {
                        infoWindowRef.current.close();
                    }

                    infoWindowRef.current = createInfoWindow(
                        map,
                        marker,
                        place,
                        () => onPlaceSelect(null),
                        onEmojiChangeRequest
                    );

                    onPlaceSelect(place);
                });

                marker.placeData = place;
                return marker;
            });

            markersRef.current = newMarkers;
        };

        createMarkers();

        return () => {
            markersRef.current.forEach(marker => marker.setMap(null));
        };
    }, [map, places, hiddenLayers, onPlaceSelect, onEmojiChangeRequest]);

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

        const selectedMarker = markersRef.current.find(
            marker => marker.placeData?.name === selectedPlace.name
        );

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
                          hiddenLayers
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
            <Map
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
                    hiddenLayers={hiddenLayers}
                />
            </Map>
        </Wrapper>
    );
};

export default MapComponent;
