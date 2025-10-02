import React, { useState, useEffect } from 'react';
import MapComponent from './components/MapComponent';
import ControlPanel from './components/ControlPanel';
import PlaceSearch from './components/PlaceSearch';
import Auth from './components/Auth';
import PlacesService from './services/PlacesService';
import './App.css';

const App = () => {
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [hiddenLayers, setHiddenLayers] = useState(new Set());
  const [groups] = useState(['want to go', 'favorite']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const availableLayers = groups;

  useEffect(() => {
    const unsubscribe = PlacesService.subscribeToPlaces((placesData) => {
      setPlaces(placesData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddPlace = () => {
    setShowSearch(true);
  };

  const handlePlaceSelect = async (place) => {
    if (place) {
      try {
        setError(null);
        const addedPlace = await PlacesService.addPlace(place);
        // The real-time listener will update the places state automatically
        console.log('Place added successfully:', addedPlace);
      } catch (error) {
        console.error('Failed to add place:', error);
        setError('Failed to add place. Please try again.');
      }
    }
  };

  const handleRemovePlace = async () => {
    if (selectedPlace) {
      try {
        setError(null);
        await PlacesService.deletePlace(selectedPlace.id);
        setSelectedPlace(null);
        // The real-time listener will update the places state automatically
        console.log('Place removed successfully');
      } catch (error) {
        console.error('Failed to remove place:', error);
        setError('Failed to remove place. Please try again.');
      }
    }
  };

  const handleChangeGroup = async (place, newGroup) => {
    try {
      setError(null);
      await PlacesService.updatePlaceGroup(place.id, newGroup);
      // Update selected place if it's the one being changed
      if (selectedPlace && selectedPlace.id === place.id) {
        setSelectedPlace({ ...selectedPlace, group: newGroup });
      }
      // The real-time listener will update the places state automatically
      console.log('Place group updated successfully');
    } catch (error) {
      console.error('Failed to update place group:', error);
      setError('Failed to update place. Please try again.');
    }
  };

  const handleToggleLayer = (layer) => {
    setHiddenLayers(prev => {
      const newHidden = new Set(prev);
      if (newHidden.has(layer)) {
        newHidden.delete(layer);
      } else {
        newHidden.add(layer);
      }
      return newHidden;
    });
  };

  const handleMapPlaceSelect = (place) => {
    if (place) {
      const fullPlace = places.find(p => p.id === place.id) || place;
      setSelectedPlace(fullPlace);
    } else {
      setSelectedPlace(null);
    }
  };

  const handleMapClick = () => {
    // Deselect any currently selected place when clicking on the map
    setSelectedPlace(null);
  };

  return (
    <Auth>
      <div className="app">
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner">Loading places...</div>
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        <div className="map-container">
          <MapComponent
            places={places}
            selectedPlace={selectedPlace}
            onPlaceSelect={handleMapPlaceSelect}
            onMapClick={handleMapClick}
            hiddenLayers={hiddenLayers}
            groups={groups}
          />
        </div>

        <ControlPanel
          selectedPlace={selectedPlace}
          onAddPlace={handleAddPlace}
          onRemovePlace={handleRemovePlace}
          onChangeGroup={handleChangeGroup}
          onToggleLayer={handleToggleLayer}
          availableLayers={availableLayers}
          hiddenLayers={hiddenLayers}
          groups={groups}
        />

        {showSearch && (
          <PlaceSearch
            onPlaceSelect={handlePlaceSelect}
            onClose={() => setShowSearch(false)}
          />
        )}
      </div>
    </Auth>
  );
};

export default App;
