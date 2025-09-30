import React, { useRef, useEffect, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { getEmojiForPlaceType } from '../utils/emojiMapping';
import { createRegularMarker, createSelectedMarker } from '../utils/markerTemplates';

const MapComponent = ({
                          places,
                          selectedPlace,
                          onPlaceSelect,
                          onMapClick,
                          hiddenLayers,
                          groups
                      }) => {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const markersRef = useRef([]);
    const infoWindowRef = useRef(null);
    const onPlaceSelectRef = useRef(onPlaceSelect);
    const onMapClickRef = useRef(onMapClick);

    useEffect(() => {
        onPlaceSelectRef.current = onPlaceSelect;
        onMapClickRef.current = onMapClick;
    }, [onPlaceSelect, onMapClick]);

    useEffect(() => {
        const initMap = async () => {
            const loader = new Loader({
                apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
                version: 'weekly',
                libraries: ['places', 'marker']
            });

            try {
                await loader.load();

                const mapInstance = new window.google.maps.Map(mapRef.current, {
                    center: { lat: 37.7749, lng: -122.4194 },
                    zoom: 13,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
                    mapId: process.env.REACT_APP_GOOGLE_MAP_ID || 'DEMO_MAP_ID'
                });

                mapInstance.addListener('click', (event) => {
                    // Close info window when clicking on map
                    if (infoWindowRef.current) {
                        infoWindowRef.current.close();
                    }

                    if (onMapClickRef.current) {
                        onMapClickRef.current(event.latLng);
                    }
                });

                // Create InfoWindow
                const infoWindow = new window.google.maps.InfoWindow();
                infoWindowRef.current = infoWindow;

                setMap(mapInstance);
                setIsLoaded(true);
            } catch (error) {
                console.error('Error loading Google Maps:', error);
            }
        };

        initMap();
    }, []);

    useEffect(() => {
        if (!map || !isLoaded) return;

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
                const emoji = getEmojiForPlaceType(place.types);
                const content = createRegularMarker(emoji);

                const marker = new AdvancedMarkerElement({
                    map,
                    position: place.geometry.location,
                    content,
                    title: place.name,
                    zIndex: 1
                });

                marker.addListener('click', () => {
                    // Close any existing info window first
                    if (infoWindowRef.current) {
                        infoWindowRef.current.close();
                    }

                    // Create header element
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

                    // Add close event listener to deselect marker when popup is closed
                    infoWindow.addListener('closeclick', () => {
                        if (onMapClickRef.current) {
                            onMapClickRef.current();
                        }
                    });

                    infoWindow.open(map, marker);
                    infoWindowRef.current = infoWindow;

                    onPlaceSelectRef.current(place);
                });

                // Store place reference for later use
                marker.placeData = place;

                return marker;
            });

            markersRef.current = newMarkers;
        };

        createMarkers();
    }, [map, places, hiddenLayers, isLoaded]);

    useEffect(() => {
        if (!map) return;

        // Close info window if no place is selected
        if (!selectedPlace && infoWindowRef.current) {
            infoWindowRef.current.close();
        }

        // Reset all markers to default state
        markersRef.current.forEach(marker => {
            const emoji = getEmojiForPlaceType(marker.placeData.types);
            const regularContent = createRegularMarker(emoji);
            marker.content = regularContent;
            marker.zIndex = 1;
        });

        if (!selectedPlace) return;

        const selectedMarker = markersRef.current.find(marker =>
            marker.placeData?.name === selectedPlace.name
        );

        if (selectedMarker) {
            const emoji = getEmojiForPlaceType(selectedPlace.types);
            const selectedContent = createSelectedMarker(emoji);
            selectedMarker.content = selectedContent;
            selectedMarker.zIndex = 999; // Bring to foreground
        }
    }, [selectedPlace, map]);

    return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
};

export default MapComponent;
