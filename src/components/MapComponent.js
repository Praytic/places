import React, { useRef, useEffect, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { getEmojiForPlaceType } from '../utils/emojiMapping';

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
                    if (onMapClick) {
                        onMapClick(event.latLng);
                    }
                    if (selectedPlace) {
                        onPlaceSelect(null);
                    }
                });

                setMap(mapInstance);
                setIsLoaded(true);
            } catch (error) {
                console.error('Error loading Google Maps:', error);
            }
        };

        initMap();
    }, [onMapClick, onPlaceSelect, selectedPlace]);

    useEffect(() => {
        if (!map || !isLoaded) return;

        const createMarkers = async () => {
            // Remove old markers
            markersRef.current.forEach(marker => marker.map = null);

            const { AdvancedMarkerElement } = await window.google.maps.importLibrary('marker');

            const filteredPlaces = places.filter(place => {
                const layer = place.types?.[0] || 'default';
                const group = place.group || 'default';
                return !hiddenLayers.has(layer) && !hiddenLayers.has(group);
            });

            const newMarkers = filteredPlaces.map(place => {
                const emoji = getEmojiForPlaceType(place.types);

                const content = document.createElement('div');
                content.innerHTML = `
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="15" fill="white" stroke="#333" stroke-width="2"/>
            <text x="16" y="21" text-anchor="middle" font-size="16">${emoji}</text>
          </svg>
        `;
                content.style.cursor = 'pointer';

                const marker = new AdvancedMarkerElement({
                    map,
                    position: place.geometry.location,
                    content: content.firstElementChild,
                    title: place.name
                });

                marker.addListener('click', () => {
                    onPlaceSelect(place);
                });

                // Store place reference for later use
                marker.placeData = place;

                return marker;
            });

            markersRef.current = newMarkers;
        };

        createMarkers();
    }, [map, places, hiddenLayers, isLoaded, onPlaceSelect]);

    useEffect(() => {
        if (!map || !selectedPlace) return;

        const selectedMarker = markersRef.current.find(marker =>
            marker.placeData?.name === selectedPlace.name
        );

        if (selectedMarker) {
            const emoji = getEmojiForPlaceType(selectedPlace.types);

            const selectedContent = document.createElement('div');
            selectedContent.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="18" fill="#4285f4" stroke="white" stroke-width="3"/>
          <text x="20" y="26" text-anchor="middle" font-size="18" fill="white">${emoji}</text>
        </svg>
      `;
            selectedContent.style.cursor = 'pointer';

            selectedMarker.content = selectedContent.firstElementChild;
        }

        return () => {
            if (selectedMarker) {
                const regularEmoji = getEmojiForPlaceType(selectedPlace.types);

                const regularContent = document.createElement('div');
                regularContent.innerHTML = `
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="15" fill="white" stroke="#333" stroke-width="2"/>
            <text x="16" y="21" text-anchor="middle" font-size="16">${regularEmoji}</text>
          </svg>
        `;
                regularContent.style.cursor = 'pointer';

                selectedMarker.content = regularContent.firstElementChild;
            }
        };
    }, [selectedPlace, map]);

    return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
};

export default MapComponent;
