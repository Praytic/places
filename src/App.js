import React, {useEffect, useState, useRef} from 'react';
import {Alert, Backdrop, Box, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MapComponent from './components/MapComponent';
import ControlPanel from './components/ControlPanel';
import PlaceSearch from './components/PlaceSearch';
import ManageMapsDialog from './components/ManageMapsDialog';
import ShareDialog from './components/ShareDialog';
import EmojiPicker, {EmojiStyle} from 'emoji-picker-react';
import Auth from './components/Auth';
import PlacesService from './services/PlacesService';
import {createMap, getUserMaps, ROLES} from './services/MapsService';
import {auth} from './config/firebase';
import {getCurrentLocation, hasLocationPermission} from './services/LocationService';

const App = () => {
    const [places, setPlaces] = useState([]);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [showSearch, setShowSearch] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [emojiPickerPlace, setEmojiPickerPlace] = useState(null);
    const [showManageMaps, setShowManageMaps] = useState(false);
    const [showShareMap, setShowShareMap] = useState(false);
    const [mapCenter, setMapCenter] = useState(null);
    const [activeFilters, setActiveFilters] = useState(() => {
        // Load saved filters from localStorage or use default
        const saved = localStorage.getItem('activeFilters');
        return saved ? new Set(JSON.parse(saved)) : new Set(['favorite', 'want to go']);
    });
    const [groups] = useState(['want to go', 'favorite']);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [visibleMapIds, setVisibleMapIds] = useState(new Set());
    const [userMaps, setUserMaps] = useState([]);
    const [currentMapId, setCurrentMapId] = useState(null); // Keep for ShareDialog backward compatibility
    const infoWindowRef = useRef(null);

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    // Request current location on page load if permission was granted
    useEffect(() => {
        const requestLocationOnLoad = async () => {
            if (hasLocationPermission()) {
                try {
                    const location = await getCurrentLocation();
                    setMapCenter(location);
                } catch (error) {
                    console.error('Error getting location on load:', error);
                    // Silently fail - user can still use the app
                }
            }
        };

        requestLocationOnLoad();
    }, []);

    // Get or create user's maps when user changes
    useEffect(() => {
        const initializeMaps = async () => {
            if (!currentUser?.email) {
                setUserMaps([]);
                setVisibleMapIds(new Set());
                setCurrentMapId(null);
                return;
            }

            try {
                // Get user's maps
                let maps = await getUserMaps(currentUser.email);

                let isNewUser = false;
                if (maps.length === 0) {
                    // Create a new default map for the user
                    const newMap = await createMap(currentUser.email, 'My Places', true);
                    maps = [{ ...newMap, userRole: ROLES.OWNER }];
                    isNewUser = true;
                }

                setUserMaps(maps);

                // Load visible map IDs from localStorage or use default
                const storageKey = `visibleMaps_${currentUser.email}`;
                const savedVisibleMaps = localStorage.getItem(storageKey);

                let visibleIds;
                if (savedVisibleMaps) {
                    // Use saved visibility state
                    const savedIds = JSON.parse(savedVisibleMaps);
                    // Filter to only include maps that still exist
                    const validMapIds = maps.map(m => m.id);
                    visibleIds = savedIds.filter(id => validMapIds.includes(id));
                } else {
                    if (isNewUser) {
                        // Make default map visible for new users
                        visibleIds = maps.filter(m => m.isDefault).map(m => m.id);
                    } else {
                        // Make only owned maps visible by default for existing users
                        visibleIds = maps.filter(m => m.userRole === ROLES.OWNER).map(m => m.id);
                    }
                }

                setVisibleMapIds(new Set(visibleIds));
                // Set currentMapId to first map for backward compatibility (ShareDialog)
                setCurrentMapId(maps[0].id);
            } catch (err) {
                console.error('Error initializing maps:', err);
                setError('Failed to initialize maps');
            }
        };

        initializeMaps();
    }, [currentUser]);

    // Save visible map IDs to localStorage when they change
    useEffect(() => {
        if (currentUser?.email && visibleMapIds.size > 0) {
            const storageKey = `visibleMaps_${currentUser.email}`;
            localStorage.setItem(storageKey, JSON.stringify(Array.from(visibleMapIds)));
        }
    }, [currentUser, visibleMapIds]);

    // Save active filters to localStorage when they change
    useEffect(() => {
        localStorage.setItem('activeFilters', JSON.stringify(Array.from(activeFilters)));
    }, [activeFilters]);

    // Subscribe to places when user or visible maps change
    useEffect(() => {
        if (!currentUser?.email || visibleMapIds.size === 0) {
            setPlaces([]);
            setLoading(false);
            return;
        }

        const unsubscribe = PlacesService.subscribeToPlaces(
            currentUser.email,
            (placesData) => {
                // Filter places to only show those from visible maps
                const filteredPlaces = placesData.filter(place => visibleMapIds.has(place.mapId));
                setPlaces(filteredPlaces);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [currentUser, visibleMapIds]);

    const handleAddPlace = () => {
        setShowSearch(true);
    };

    const handlePlaceSelect = async (place) => {
        if (place) {
            // Add to the first visible map, or currentMapId as fallback
            const targetMapId = visibleMapIds.size > 0
                ? Array.from(visibleMapIds)[0]
                : currentMapId;

            if (!targetMapId) {
                setError('No map available to add place');
                return;
            }

            try {
                setError(null);
                const addedPlace = await PlacesService.addPlace(place, targetMapId);
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
                setSelectedPlace({...selectedPlace, group: newGroup});
            }
            // The real-time listener will update the places state automatically
            console.log('Place group updated successfully');
        } catch (error) {
            console.error('Failed to update place group:', error);
            setError('Failed to update place. Please try again.');
        }
    };

    const handleToggleFilter = (filter) => {
        // Close InfoWindow and unselect marker when filter toggles
        if (infoWindowRef.current?.current) {
            infoWindowRef.current.current.close();
        }
        setSelectedPlace(null);

        setActiveFilters(prev => {
            const newFilters = new Set(prev);
            if (newFilters.has(filter)) {
                newFilters.delete(filter);
            } else {
                newFilters.add(filter);
            }
            return newFilters;
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
                    setSelectedPlace({...selectedPlace, emoji: emojiObject.emoji});
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

    const handleMapSwitch = (mapId, role) => {
        setCurrentMapId(mapId);
        setUserRole(role);
    };

    const handleMapVisibilityToggle = (mapId) => {
        setVisibleMapIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(mapId)) {
                newSet.delete(mapId);
            } else {
                newSet.add(mapId);
            }
            return newSet;
        });
    };

    const handleMapsUpdated = async () => {
        // Reload maps when they're updated (created/deleted)
        if (currentUser?.email) {
            try {
                const maps = await getUserMaps(currentUser.email);
                setUserMaps(maps);

                // Update visibleMapIds to remove deleted maps
                setVisibleMapIds(prev => {
                    const mapIds = new Set(maps.map(m => m.id));
                    return new Set([...prev].filter(id => mapIds.has(id)));
                });

                // If currentMapId was deleted, switch to first available map
                if (maps.length > 0 && !maps.find(m => m.id === currentMapId)) {
                    setCurrentMapId(maps[0].id);
                }
            } catch (err) {
                console.error('Error reloading maps:', err);
            }
        }
    };

    const handleInfoWindowRefUpdate = (ref) => {
        infoWindowRef.current = ref;
    };

    const handleLocationRequest = (location) => {
        setMapCenter(location);
    };

    return (
        <Auth onLocationRequest={handleLocationRequest}>
            <Box sx={{position: 'relative', height: '100vh', width: '100vw'}}>
                <Backdrop open={loading} sx={{color: '#fff', zIndex: 3000}}>
                    <CircularProgress color="inherit"/>
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
                            zIndex: 2500
                        }}
                    >
                        {error}
                    </Alert>
                )}

                <Box sx={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%'}}>
                    <MapComponent
                        places={places}
                        selectedPlace={selectedPlace}
                        onPlaceSelect={handleMapPlaceSelect}
                        onMapClick={handleMapClick}
                        onEmojiChangeRequest={handleEmojiChangeRequest}
                        onChangeGroup={handleChangeGroup}
                        onRemovePlace={handleRemovePlace}
                        activeFilters={activeFilters}
                        groups={groups}
                        onInfoWindowRefUpdate={handleInfoWindowRefUpdate}
                        center={mapCenter}
                    />
                </Box>

                <ControlPanel
                    onAddPlace={handleAddPlace}
                    onToggleFilter={handleToggleFilter}
                    activeFilters={activeFilters}
                    onManageMaps={() => setShowManageMaps(true)}
                    onShareMap={() => setShowShareMap(true)}
                />

                {showSearch && (
                    <PlaceSearch
                        onPlaceSelect={handlePlaceSelect}
                        onClose={() => setShowSearch(false)}
                        existingPlaces={places}
                    />
                )}

                <Dialog
                    open={showEmojiPicker && !!emojiPickerPlace}
                    onClose={handleEmojiCancel}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        Choose an emoji for {emojiPickerPlace?.name}
                        <IconButton onClick={handleEmojiCancel} size="small">
                            <CloseIcon/>
                        </IconButton>
                    </DialogTitle>
                    <DialogContent>
                        <EmojiPicker
                            onEmojiClick={handleEmojiSelect}
                            width="100%"
                            height={400}
                            previewConfig={{showPreview: false}}
                            emojiStyle={EmojiStyle.APPLE}
                        />
                    </DialogContent>
                </Dialog>

                {showManageMaps && currentUser && (
                    <ManageMapsDialog
                        open={showManageMaps}
                        onClose={() => setShowManageMaps(false)}
                        userEmail={currentUser.email}
                        userMaps={userMaps}
                        visibleMapIds={visibleMapIds}
                        onMapVisibilityToggle={handleMapVisibilityToggle}
                        onMapsUpdated={handleMapsUpdated}
                        currentMapId={currentMapId}
                        onMapSwitch={handleMapSwitch}
                    />
                )}

                {showShareMap && currentMapId && currentUser && (
                    <ShareDialog
                        open={showShareMap}
                        onClose={() => setShowShareMap(false)}
                        userEmail={currentUser.email}
                        mapId={currentMapId}
                    />
                )}
            </Box>
        </Auth>
    );
};

export default App;
