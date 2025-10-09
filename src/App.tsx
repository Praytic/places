import React, { useState, useCallback, useMemo } from 'react';
import { Alert, Backdrop, Box, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MapComponent from './components/MapComponent';
import ControlPanel from './components/ControlPanel';
import PlaceSearch from './components/PlaceSearch';
import MapSelectMenu from './components/MapSelectMenu';
import ShareDialog from './components/ShareDialog';
import EmojiPicker, { EmojiStyle } from 'emoji-picker-react';
import Auth from './components/Auth';
import { AuthProvider, MapsProvider, PlacesProvider, useAuthContext, useMapsContext, usePlacesContext } from './providers';
import { useEmojiPicker } from './shared/hooks';
import { useCurrentLocation } from './shared/hooks/useCurrentLocation';
import { ErrorBoundary } from './shared/components';
import { UserRole } from './shared/types/domain';

const AppContent: React.FC = () => {
  const { user } = useAuthContext();
  const { maps, currentMapId, visibleMapIds, toggleMapVisibility, setCurrentMapId } = useMapsContext();
  const {
    filteredPlaces,
    loading,
    selectedPlace,
    setSelectedPlace,
    activeFilters,
    toggleFilter,
    addPlace,
    updatePlaceGroup,
    updatePlaceEmoji,
    deletePlace,
  } = usePlacesContext();

  const [showSearch, setShowSearch] = useState(false);
  const [showManageMaps, setShowManageMaps] = useState(false);
  const [mapSelectAnchorEl, setMapSelectAnchorEl] = useState<HTMLElement | null>(null);
  const [showShareMap, setShowShareMap] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const infoWindowRef = React.useRef<any>(null);

  const { showEmojiPicker, emojiPickerPlace, openEmojiPicker, closeEmojiPicker } = useEmojiPicker();
  const { location: mapCenter } = useCurrentLocation(true);

  // Calculate if Add Place button should be disabled
  // Button is disabled when no visible maps are editable (OWNER or EDIT)
  const isAddPlaceDisabled = useMemo(() => {
    const visibleMaps = maps.filter((map) => visibleMapIds.has(map.id));
    const hasEditableVisibleMap = visibleMaps.some(
      (map) => map.userRole === UserRole.OWNER || map.userRole === UserRole.EDIT
    );
    return !hasEditableVisibleMap;
  }, [maps, visibleMapIds]);

  const handleAddPlace = useCallback((): void => {
    setShowSearch(true);
  }, []);

  const handlePlaceSelect = useCallback(
    async (place: any, mapId?: string): Promise<void> => {
      if (place) {
        const targetMapId = mapId || (visibleMapIds.size > 0 ? Array.from(visibleMapIds)[0] : currentMapId);

        if (!targetMapId) {
          setError('No map available to add place');
          return;
        }

        try {
          setError(null);
          await addPlace(place, targetMapId);
        } catch (err) {
          setError('Failed to add place. Please try again.');
        }
      }
    },
    [visibleMapIds, currentMapId, addPlace]
  );

  const handleRemovePlace = useCallback(
    async (place?: any): Promise<void> => {
      const placeToRemove = place || selectedPlace;
      if (placeToRemove) {
        try {
          setError(null);
          await deletePlace(placeToRemove.mapId, placeToRemove.id);
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
        await updatePlaceGroup(place.mapId, place.id, newGroup as any);
        if (selectedPlace && selectedPlace.id === place.id) {
          setSelectedPlace({ ...selectedPlace, group: newGroup as any });
        }
      } catch (err) {
        setError('Failed to update place. Please try again.');
      }
    },
    [updatePlaceGroup, selectedPlace, setSelectedPlace]
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
          await updatePlaceEmoji(placeToUpdate.mapId, placeToUpdate.id, emojiObject.emoji);
          if (selectedPlace && selectedPlace.id === placeToUpdate.id) {
            setSelectedPlace({ ...selectedPlace, emoji: emojiObject.emoji });
          }
        } catch (err) {
          setError('Failed to update emoji. Please try again.');
        }
      }
    },
    [emojiPickerPlace, closeEmojiPicker, updatePlaceEmoji, selectedPlace, setSelectedPlace]
  );

  const handleMapVisibilityToggle = useCallback(
    (mapId: string): void => {
      toggleMapVisibility(mapId);
    },
    [toggleMapVisibility]
  );

  const handleMapsUpdated = useCallback(async (): Promise<void> => {
    // Maps are automatically updated via real-time subscription in useUserMaps
  }, []);

  const handleMapSelect = useCallback(
    (mapId: string): void => {
      setCurrentMapId(mapId);
      setShowManageMaps(false);
    },
    [setCurrentMapId]
  );

  const handleInfoWindowRefUpdate = useCallback((ref: any): void => {
    infoWindowRef.current = ref;
  }, []);

  const handleLocationRequest = useCallback((_location: any): void => {
    // Location is handled by useCurrentLocation hook
  }, []);

  return (
    <Auth onLocationRequest={handleLocationRequest}>
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
              userMaps={maps as any}
              visibleMapIds={visibleMapIds as any}
              onMapVisibilityToggle={handleMapVisibilityToggle}
              showSearch={showSearch}
              userEmail={user?.email || undefined}
              onMapCreated={handleMapsUpdated}
            />
          </ErrorBoundary>
        </Box>

        <ErrorBoundary>
          <ControlPanel
            onAddPlace={handleAddPlace}
            onToggleFilter={handleToggleFilter}
            activeFilters={activeFilters as any}
            onManageMaps={(event: any) => {
              setMapSelectAnchorEl(event.currentTarget);
              setShowManageMaps(true);
            }}
            onShareMap={() => setShowShareMap(true)}
            isAddPlaceDisabled={isAddPlaceDisabled}
          />
        </ErrorBoundary>

        {showSearch && (
          <ErrorBoundary>
            <PlaceSearch
              onPlaceSelect={handlePlaceSelect}
              onClose={() => setShowSearch(false)}
              existingPlaces={filteredPlaces as any}
              userMaps={maps.filter((map) => map.userRole === UserRole.OWNER || map.userRole === UserRole.EDIT) as any}
              visibleMapIds={visibleMapIds as any}
              onMapVisibilityToggle={handleMapVisibilityToggle}
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

        {showManageMaps && user && (
          <ErrorBoundary>
            <MapSelectMenu
              open={showManageMaps}
              onClose={() => {
                setShowManageMaps(false);
                setMapSelectAnchorEl(null);
              }}
              userEmail={user.email || ''}
              userMaps={maps as any}
              currentMapId={currentMapId}
              onMapSelect={handleMapSelect}
              onMapCreated={handleMapsUpdated}
              anchorEl={mapSelectAnchorEl}
              visibleMapIds={visibleMapIds as any}
              onMapVisibilityToggle={handleMapVisibilityToggle}
              onMapsUpdated={handleMapsUpdated}
            />
          </ErrorBoundary>
        )}

        {showShareMap && currentMapId && user && (
          <ErrorBoundary>
            <ShareDialog
              onClose={() => setShowShareMap(false)}
              userEmail={user.email || ''}
              mapId={currentMapId as any}
            />
          </ErrorBoundary>
        )}
      </Box>
    </Auth>
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