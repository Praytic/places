import React, { useRef, useEffect, useState } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';
import { createRegularMarker, createSelectedMarker } from '../utils/markerTemplates';

// Map component following Google's recommended pattern
const Map = ({ onClick, onIdle, children, style, ...options }) => {
    const ref = useRef(null);
    const [map, setMap] = useState();

    // Initialize map
    useEffect(() => {
        if (ref.current && !map) {
            setMap(new window.google.maps.Map(ref.current, {}));
        }
    }, [ref, map]);

    // Update map options when they change
    useEffect(() => {
        if (map) {
            map.setOptions(options);
        }
    }, [map, options]);

    // Set up event listeners
    useEffect(() => {
        if (map) {
            ['click', 'idle'].forEach((eventName) =>
                window.google.maps.event.clearListeners(map, eventName)
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
            <div ref={ref} style={style} />
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child, { map });
                }
            })}
        </>
    );
};

// Markers component to manage all markers
const Markers = ({ map, places, selectedPlace, onPlaceSelect, hiddenLayers }) => {
    const markersRef = useRef([]);
    const infoWindowRef = useRef(null);

    useEffect(() => {
        if (!map) return;

        const createMarkers = async () => {
            // Remove old markers and close info window
            markersRef.current.forEach(marker => marker.map = null);
            if (infoWindowRef.current) {
                infoWindowRef.current.close();
            }

            const { AdvancedMarkerElement } = await window.google.maps.importLibrary('marker');

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

                    const headerDiv = document.createElement('div');
                    headerDiv.style.cssText = 'padding: 12px 12px 0 12px;';
                    const h3 = document.createElement('h3');
                    h3.style.cssText = 'margin: 0; font-size: 16px; font-weight: 500; color: #202124; line-height: 20px;';
                    h3.textContent = place.name;
                    headerDiv.appendChild(h3);

                    const infoWindow = new window.google.maps.InfoWindow({
                        headerContent: headerDiv,
                        content: `
                            <div style="font-family: 'Google Sans', Roboto, Arial, sans-serif; max-width: 280px;">
                                <div style="padding: 8px 12px 12px 12px;">
                                    <div style="color: #70757a; font-size: 14px; line-height: 20px; margin-bottom: 12px;">
                                        ${place.formatted_address || place.vicinity || 'Address not available'}
                                    </div>
                                    ${place.rating ? `
                                        <div style="display: flex; align-items: center; margin-bottom: 8px;">
                                            <span style="color: #fbbc04; margin-right: 4px;">★</span>
                                            <span style="color: #202124; font-size: 14px;">${place.rating}</span>
                                            ${place.user_ratings_total ? `<span style="color: #70757a; font-size: 14px; margin-left: 4px;">(${place.user_ratings_total})</span>` : ''}
                                        </div>
                                    ` : ''}
                                    <div style="margin-top: 12px;">
                                        <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id || ''}"
                                           target="_blank"
                                           style="color: #1a73e8; text-decoration: none; font-size: 14px; font-weight: 500;">
                                            View on Google Maps
                                        </a>
                                    </div>
                                </div>
                            </div>`,
                        ariaLabel: place.name
                    });

                    infoWindow.addListener('closeclick', () => {
                        onPlaceSelect(null);
                    });

                    infoWindow.open(map, marker);
                    infoWindowRef.current = infoWindow;

                    onPlaceSelect(place);
                });

                marker.placeData = place;
                return marker;
            });

            markersRef.current = newMarkers;
        };

        createMarkers();
    }, [map, places, hiddenLayers, onPlaceSelect]);

    // Update marker appearance when selection changes
    useEffect(() => {
        if (!map) return;

        if (!selectedPlace && infoWindowRef.current) {
            infoWindowRef.current.close();
        }

        markersRef.current.forEach(marker => {
            const emoji = marker.placeData.emoji || '📍';
            const regularContent = createRegularMarker(emoji);
            marker.content = regularContent;
            marker.zIndex = 1;
        });

        if (!selectedPlace) return;

        const selectedMarker = markersRef.current.find(marker =>
            marker.placeData?.name === selectedPlace.name
        );

        if (selectedMarker) {
            const emoji = selectedPlace.emoji || '📍';
            const selectedContent = createSelectedMarker(emoji);
            selectedMarker.content = selectedContent;
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
    hiddenLayers,
    groups
}) => {
    const [center] = useState({ lat: 37.7749, lng: -122.4194 });
    const [zoom] = useState(13);

    const onClick = (e) => {
        if (onMapClick) {
            onMapClick(e.latLng);
        }
    };

    const onIdle = (map) => {
        // Can be used for tracking map state changes
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
                style={{ width: '100%', height: '100%' }}
            >
                <Markers
                    places={places}
                    selectedPlace={selectedPlace}
                    onPlaceSelect={onPlaceSelect}
                    hiddenLayers={hiddenLayers}
                />
            </Map>
        </Wrapper>
    );
};

export default MapComponent;
