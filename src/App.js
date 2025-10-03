import React, { useState, useEffect } from 'react';
import MapComponent from './components/MapComponent';
import ControlPanel from './components/ControlPanel';
import PlaceSearch from './components/PlaceSearch';
import EmojiPicker, {EmojiStyle} from 'emoji-picker-react';
import Auth from './components/Auth';
import PlacesService from './services/PlacesService';
import { auth } from './config/firebase';
import './App.css';

const App = () => {
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerPlace, setEmojiPickerPlace] = useState(null);
  const [hiddenLayers, setHiddenLayers] = useState(new Set());
  const [groups] = useState(['want to go', 'favorite']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [sharedFromUsers, setSharedFromUsers] = useState([]);

  const availableLayers = groups;

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Load shared users when user changes
  useEffect(() => {
    const migrateLegacyMarkers = async () => {
      if (!currentUser?.email) return;
      try {
        const migratedCount = await PlacesService.migrateLegacyMarkers(currentUser.email);
        if (migratedCount > 0) {
          console.log(`Migrated ${migratedCount} legacy markers to your account`);
        }
      } catch (err) {
        console.error('Error migrating legacy markers:', err);
      }
    };

    const loadSharedUsers = async () => {
      if (!currentUser?.email) return;
      try {
        const sharedUsers = await PlacesService.getSharedFromUsers(currentUser.email);
        setSharedFromUsers(sharedUsers);
      } catch (err) {
        console.error('Error loading shared users:', err);
      }
    };

    if (currentUser?.email) {
      loadSharedUsers();
      migrateLegacyMarkers();
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.email) {
      setPlaces([]);
      setLoading(false);
      return;
    }

    const unsubscribe = PlacesService.subscribeToPlaces(
      currentUser.email,
      sharedFromUsers,
      (placesData) => {
        setPlaces(placesData);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [currentUser, sharedFromUsers]);

  const handleAddPlace = () => {
    setShowSearch(true);
  };

  const handlePlaceSelect = async (place) => {
    if (place && currentUser?.email) {
      try {
        setError(null);
        const addedPlace = await PlacesService.addPlace(place, currentUser.email);
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

  const handleEmojiChangeRequest = (place) => {
    setEmojiPickerPlace(place);
    setShowEmojiPicker(true);
  };

  const handleEmojiSelect = async (emojiObject) => {
    if (emojiPickerPlace) {
      const placeToUpdate = emojiPickerPlace;
      setShowEmojiPicker(false);
      setEmojiPickerPlace(null);

      try {
        setError(null);
        await PlacesService.updatePlaceEmoji(placeToUpdate.id, emojiObject.emoji);
        // Update selected place if it's the one being changed
        if (selectedPlace && selectedPlace.id === placeToUpdate.id) {
          setSelectedPlace({ ...selectedPlace, emoji: emojiObject.emoji });
        }
        console.log('Place emoji updated successfully');
      } catch (error) {
        console.error('Failed to update place emoji:', error);
        setError('Failed to update emoji. Please try again.');
      }
    }
  };

  const handleEmojiCancel = () => {
    setShowEmojiPicker(false);
    setEmojiPickerPlace(null);
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
            onEmojiChangeRequest={handleEmojiChangeRequest}
            onChangeGroup={handleChangeGroup}
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

        {showEmojiPicker && emojiPickerPlace && (
          <div className="emoji-picker-overlay" onClick={handleEmojiCancel}>
            <div className="emoji-picker-container" onClick={(e) => e.stopPropagation()}>
              <div className="emoji-picker-header">
                <h3>Choose an emoji for {emojiPickerPlace.name}</h3>
                <button onClick={handleEmojiCancel} className="close-button">×</button>
              </div>
              <div className="emoji-picker-content">
                <EmojiPicker
                  onEmojiClick={handleEmojiSelect}
                  width="100%"
                  height={400}
                  previewConfig={{showPreview: false}}
                  emojiStyle={EmojiStyle.APPLE}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Auth>
  );
};

export default App;
