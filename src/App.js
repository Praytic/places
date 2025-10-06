import React, {useEffect, useState} from 'react';
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

const App = () => {
    const [places, setPlaces] = useState([]);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [showSearch, setShowSearch] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [emojiPickerPlace, setEmojiPickerPlace] = useState(null);
    const [showManageMaps, setShowManageMaps] = useState(false);
    const [showShareMap, setShowShareMap] = useState(false);
    const [activeFilters, setActiveFilters] = useState(new Set(['favorite', 'want to go']));
    const [groups] = useState(['want to go', 'favorite']);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [currentMapId, setCurrentMapId] = useState(null);
    const [userRole, setUserRole] = useState(null);

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    // Get or create user's map when user changes
    useEffect(() => {
        const initializeMap = async () => {
            if (!currentUser?.email) {
                setCurrentMapId(null);
                setUserRole(null);
                return;
            }

            try {
                // Get user's maps
                const maps = await getUserMaps(currentUser.email);

                if (maps.length > 0) {
                    // Use first map
                    setCurrentMapId(maps[0].id);
                    setUserRole(maps[0].userRole);
                } else {
                    // Create a new map for the user
                    const newMap = await createMap(currentUser.email, 'My Places');
                    setCurrentMapId(newMap.id);
                    setUserRole(ROLES.OWNER);
                }
            } catch (err) {
                console.error('Error initializing map:', err);
                setError('Failed to initialize map');
            }
        };

        initializeMap();
    }, [currentUser]);

    // Subscribe to places when user or current map changes
    useEffect(() => {
        if (!currentUser?.email) {
            setPlaces([]);
            setLoading(false);
            return;
        }

        const unsubscribe = PlacesService.subscribeToPlaces(
            currentUser.email,
            (placesData) => {
                // Filter places to only show those from the current map
                const filteredPlaces = currentMapId
                    ? placesData.filter(place => place.mapId === currentMapId)
                    : [];
                setPlaces(filteredPlaces);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [currentUser, currentMapId]);

    const handleAddPlace = () => {
        setShowSearch(true);
    };

    const handlePlaceSelect = async (place) => {
        if (place && currentMapId) {
            try {
                setError(null);
                const addedPlace = await PlacesService.addPlace(place, currentMapId);
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

    return (
        <Auth currentMapId={currentMapId} onMapSwitch={handleMapSwitch}>
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
                        userRole={userRole}
                    />
                </Box>

                <ControlPanel
                    onAddPlace={handleAddPlace}
                    onToggleFilter={handleToggleFilter}
                    activeFilters={activeFilters}
                    userRole={userRole}
                    onManageMaps={() => setShowManageMaps(true)}
                    onShareMap={() => setShowShareMap(true)}
                />

                {showSearch && (
                    <PlaceSearch
                        onPlaceSelect={handlePlaceSelect}
                        onClose={() => setShowSearch(false)}
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
