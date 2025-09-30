import React, { useState, useEffect } from 'react';
import MapComponent from './components/MapComponent';
import ControlPanel from './components/ControlPanel';
import PlaceSearch from './components/PlaceSearch';
import './App.css';

const App = () => {
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [hiddenLayers, setHiddenLayers] = useState(new Set());
  const [groups] = useState(['favorite', 'wants to go', 'visited', 'default']);

  const availableLayers = [...new Set([
    ...places.map(place => place.types?.[0] || 'default'),
    ...groups
  ])];

  useEffect(() => {
    const savedPlaces = localStorage.getItem('placesApp_places');
    if (savedPlaces) {
      setPlaces(JSON.parse(savedPlaces));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('placesApp_places', JSON.stringify(places));
  }, [places]);

  const handleAddPlace = () => {
    setShowSearch(true);
  };

  const handlePlaceSelect = (place) => {
    if (place) {
      const newPlace = {
        ...place,
        id: Date.now(),
        group: place.group || 'default'
      };
      setPlaces(prev => [...prev, newPlace]);
    }
  };

  const handleRemovePlace = () => {
    if (selectedPlace) {
      setPlaces(prev => prev.filter(place => place.id !== selectedPlace.id));
      setSelectedPlace(null);
    }
  };

  const handleChangeGroup = (place, newGroup) => {
    setPlaces(prev =>
      prev.map(p =>
        p.id === place.id ? { ...p, group: newGroup } : p
      )
    );
    if (selectedPlace && selectedPlace.id === place.id) {
      setSelectedPlace({ ...selectedPlace, group: newGroup });
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

  return (
    <div className="app">
      <div className="map-container">
        <MapComponent
          places={places}
          selectedPlace={selectedPlace}
          onPlaceSelect={handleMapPlaceSelect}
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
  );
};

export default App;