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
                    if (onMapClickRef.current) {
                        onMapClickRef.current(event.latLng);
                    }
                });

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
            // Remove old markers
            markersRef.current.forEach(marker => marker.map = null);

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
                    title: place.name
                });

                marker.addListener('click', () => {
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
        if (!map || !selectedPlace) return;

        const selectedMarker = markersRef.current.find(marker =>
            marker.placeData?.name === selectedPlace.name
        );

        if (selectedMarker) {
            const emoji = getEmojiForPlaceType(selectedPlace.types);
            const selectedContent = createSelectedMarker(emoji);
            selectedMarker.content = selectedContent;
        }

        return () => {
            if (selectedMarker) {
                const regularEmoji = getEmojiForPlaceType(selectedPlace.types);
                const regularContent = createRegularMarker(regularEmoji);
                selectedMarker.content = regularContent;
            }
        };
    }, [selectedPlace, map]);

    return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
};

export default MapComponent;
