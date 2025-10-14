import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Alert, Backdrop, Box, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MapComponent from './components/MapComponent';
import ControlPanel from './components/ControlPanel';
import PlaceSearch from './components/PlaceSearch';
import ManageMapDialog from './components/ManageMapDialog';
import EmojiPicker, { EmojiStyle } from 'emoji-picker-react';
import { AuthProvider, MapsProvider, PlacesProvider, useAuthContext, useMapsContext, usePlacesContext } from './providers';
import { useEmojiPicker } from './shared/hooks';
import { getCurrentLocation } from './shared/utils/locationService';
import { ErrorBoundary } from './shared/components';
import { AccessMap, Location, SelectableAccessMap } from './shared/types/domain';

const AppContent: React.FC = () => {
  const { user } = useAuthContext();
  const { maps, accessibleViews, visibleMapIds, toggleMapVisibility } = useMapsContext();
  const {
    filteredPlaces,
    loading,
    selectedPlace,
    setSelectedPlace,
    activeFilters,
    toggleFilter,
    createPlace,
    updatePlace,
    deletePlace,
  } = usePlacesContext();

  const [showSearch, setShowSearch] = useState(false);
  const [showMapDialog, setShowMapDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<Location | null>(null);
  const infoWindowRef = React.useRef<any>(null);

  const { showEmojiPicker, emojiPickerPlace, openEmojiPicker, closeEmojiPicker } = useEmojiPicker();

  // Combine maps and views into accessMaps for MapComponent
  const accessMaps = useMemo(() => {
    const mapsByMapId = new Map<string, AccessMap>();
    maps.forEach(map => mapsByMapId.set(map.id, map));
    accessibleViews.forEach(view => {
      // Only add view if map not already owned
      if (!mapsByMapId.has(view.mapId)) {
        mapsByMapId.set(view.mapId, view);
      }
    });
    return mapsByMapId;
  }, [maps, accessibleViews]);

  useEffect(() => {
    getCurrentLocation()
      .then(setMapCenter)
      .catch(() => {
        // Silently fail - map will use default center
      });
  }, []);

  // Calculate if Add Place button should be disabled
  // Button is disabled when no visible maps are owned by the user (only owners can add places)
  const isAddPlaceDisabled = useMemo(() => {
    const visibleMaps = maps.filter((map) => visibleMapIds.has(map.id));
    const hasEditableVisibleMap = visibleMaps.some(
      (map) => user?.email === map.owner
    );
    return !hasEditableVisibleMap;
  }, [maps, visibleMapIds, user]);

  const handleAddPlace = useCallback((): void => {
    setShowSearch(true);
  }, []);

  const handlePlaceSelect = useCallback(
    async (place: any): Promise<void> => {
      if (place) {
        if (!place.mapId) {
          setError('No map available to add place');
          return;
        }

        try {
          setError(null);
          await createPlace(place);
        } catch (err) {
          setError('Failed to add place. Please try again.');
        }
      }
    },
    [createPlace]
  );

  const handleRemovePlace = useCallback(
    async (place?: any): Promise<void> => {
      const placeToRemove = place || selectedPlace;
      if (placeToRemove) {
        try {
          setError(null);
          await deletePlace({ mapId: placeToRemove.mapId, id: placeToRemove.id });
          setSelectedPlace(null);
        } catch (err) {
          setError('Failed to remove place. Please try again.');
        }
      }
    },
    [selectedPlace, deletePlace, setSelectedPlace]
  );

  const handleChangeGroup = useCallback(
    async (place: any, newGroup: string): Promise<void> => {
      try {
        setError(null);
        await updatePlace({ mapId: place.mapId, id: place.id, group: newGroup as any, emoji: place.emoji });
        if (selectedPlace && selectedPlace.id === place.id) {
          setSelectedPlace({ ...selectedPlace, group: newGroup as any });
        }
      } catch (err) {
        setError('Failed to update place. Please try again.');
      }
    },
    [updatePlace, selectedPlace, setSelectedPlace]
  );

  const handleToggleFilter = useCallback(
    (filter: string): void => {
      if (infoWindowRef.current?.current) {
        infoWindowRef.current.current.close();
      }
      setSelectedPlace(null);
      toggleFilter(filter as any);
    },
    [toggleFilter, setSelectedPlace]
  );

  const handleMapPlaceSelect = useCallback(
    (place: any): void => {
      if (place) {
        const fullPlace = filteredPlaces.find((p) => p.id === place.id) || place;
        setSelectedPlace(fullPlace);
      } else {
        setSelectedPlace(null);
      }
    },
    [filteredPlaces, setSelectedPlace]
  );

  const handleMapClick = useCallback((): void => {
    setSelectedPlace(null);
  }, [setSelectedPlace]);

  const handleEmojiSelect = useCallback(
    async (emojiObject: any): Promise<void> => {
      if (emojiPickerPlace) {
        const placeToUpdate = emojiPickerPlace;
        closeEmojiPicker();

        try {
          setError(null);
          await updatePlace({ mapId: placeToUpdate.mapId, id: placeToUpdate.id, emoji: emojiObject.emoji, group: placeToUpdate.group });
          if (selectedPlace && selectedPlace.id === placeToUpdate.id) {
            setSelectedPlace({ ...selectedPlace, emoji: emojiObject.emoji });
          }
        } catch (err) {
          setError('Failed to update emoji. Please try again.');
        }
      }
    },
    [emojiPickerPlace, closeEmojiPicker, updatePlace, selectedPlace, setSelectedPlace]
  );

  const handleMapVisibilityToggle = useCallback(
    (mapId: string): void => {
      toggleMapVisibility(mapId);
    },
    [toggleMapVisibility]
  );

  const handleInfoWindowRefUpdate = useCallback((ref: any): void => {
    infoWindowRef.current = ref;
  }, []);

  const handleMapCreate = useCallback(() => {
    setShowMapDialog(true);
  }, []);

  // Create selectableAccessMaps for PlaceSearch
  const selectableAccessMaps = useMemo<SelectableAccessMap[]>(() => {
    const allAccessMaps = [
      ...maps.map(map => ({ ...map, selected: visibleMapIds.has(map.id) })),
      ...accessibleViews.map(view => ({ ...view, selected: visibleMapIds.has(view.mapId) }))
    ];
    return allAccessMaps as SelectableAccessMap[];
  }, [maps, accessibleViews, visibleMapIds]);

  return (
    <Box sx={{ position: 'relative', height: '100vh', width: '100vw' }}>
      <Backdrop open={loading} sx={{ color: '#fff', zIndex: 3000 }}>
        <CircularProgress color="inherit" />
      </Backdrop>

      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{
            position: 'fixed',
            top: 20,
            left: 20,
            right: 20,
            zIndex: 2500,
          }}
        >
          {error}
        </Alert>
      )}

      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}>
        <ErrorBoundary>
          <MapComponent
            places={filteredPlaces as any}
            selectedPlace={selectedPlace}
            onPlaceSelect={handleMapPlaceSelect}
            onMapClick={handleMapClick}
            onEmojiChangeRequest={openEmojiPicker}
            onChangeGroup={handleChangeGroup}
            onRemovePlace={handleRemovePlace}
            activeFilters={activeFilters as any}
            onInfoWindowRefUpdate={handleInfoWindowRefUpdate}
            center={mapCenter as any}
            onMapReady={undefined}
            visibleMapIds={visibleMapIds as any}
            onMapVisibilityToggle={handleMapVisibilityToggle}
            showSearch={showSearch}
            userEmail={user?.email || undefined}
            accessMaps={accessMaps}
            onMapCreated={handleMapCreate}
          />
        </ErrorBoundary>
      </Box>

      <ErrorBoundary>
        <ControlPanel
          onAddPlace={handleAddPlace}
          onToggleFilter={handleToggleFilter}
          activeFilters={activeFilters as any}
          isAddPlaceDisabled={isAddPlaceDisabled}
        />
      </ErrorBoundary>

      {showSearch && (
        <ErrorBoundary>
          <PlaceSearch
            onPlaceCreate={handlePlaceSelect}
            onClose={() => setShowSearch(false)}
            selectableAccessMaps={selectableAccessMaps}
            existingPlaces={filteredPlaces as any}
          />
        </ErrorBoundary>
      )}

      <Dialog open={showEmojiPicker && !!emojiPickerPlace} onClose={closeEmojiPicker} maxWidth="sm" fullWidth>
        <ErrorBoundary>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Choose an emoji for {emojiPickerPlace?.name}
            <IconButton onClick={closeEmojiPicker} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <EmojiPicker
              onEmojiClick={handleEmojiSelect}
              width="100%"
              height={400}
              previewConfig={{ showPreview: false }}
              emojiStyle={EmojiStyle.APPLE}
            />
          </DialogContent>
        </ErrorBoundary>
      </Dialog>

      {showMapDialog && (
        <ManageMapDialog
          user={user!}
          onClose={() => setShowMapDialog(false)}
          onMapCreated={() => {
            setShowMapDialog(false);
          }}
        />
      )}
    </Box>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MapsProvider>
        <PlacesProvider>
          <AppContent />
        </PlacesProvider>
      </MapsProvider>
    </AuthProvider>
  );
};

export default App;
