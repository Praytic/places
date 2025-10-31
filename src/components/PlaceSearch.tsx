import React, {useEffect, useRef, useState} from 'react';
import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {EmojiClickData} from 'emoji-picker-react';
import MapChips from './MapChips';
import CustomEmojiPicker from './CustomEmojiPicker';
import {Place, SelectableAccessMap, UserRole} from '../shared/types';


type AutocompleteSuggestion = google.maps.places.AutocompleteSuggestion;
type PlacePrediction = google.maps.places.PlacePrediction;
type PlaceCreation = Pick<Place, 'placeId' | 'name' | 'geometry' | 'types' | 'formattedAddress' | 'group' | 'emoji' | 'mapId'>

interface PlaceSearchProps {
  onPlaceCreate: (placeCreation: PlaceCreation) => Promise<void>;
  onClose: () => void;
  selectableAccessMaps: SelectableAccessMap[];
  existingPlaces: Place[];
  onMapToggle?: (mapId: string) => void;
  coordinates?: { lat: number; lng: number } | null;
}

const PlaceSearch: React.FC<PlaceSearchProps> = ({
                                                   onPlaceCreate,
                                                   onClose,
                                                   selectableAccessMaps = [],
                                                   existingPlaces = [],
                                                   onMapToggle,
                                                   coordinates = null,
                                                 }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [showSearching, setShowSearching] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(coordinates !== null);
  const [placeName, setPlaceName] = useState('');
  const [placeNameError, setPlaceNameError] = useState('');
  const [placeCreation, setPlaceCreation] = useState<Pick<Place, 'placeId' | 'name' | 'geometry' | 'types' | 'formattedAddress' | 'group'> | null>(
    coordinates ? {
      placeId: `custom_${Date.now()}`,
      name: '',
      geometry: { location: coordinates },
      types: [],
      formattedAddress: null,
      group: 'want to go'
    } : null
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const placeNameInputRef = useRef<HTMLInputElement>(null);
  const searchingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (searchingTimeoutRef.current) {
        clearTimeout(searchingTimeoutRef.current);
      }
    };
  }, []);

  const getExistingPlaceInfo = (placeId: string): { emoji: string; mapName: string } | null => {
    const matchingPlaces = existingPlaces.filter(p => p.placeId === placeId);
    if (matchingPlaces.length === 0) return null;
    // Pick a random place if multiple exist
    const randomPlace = matchingPlaces[Math.floor(Math.random() * matchingPlaces.length)];
    if (!randomPlace) return null;

    // Find the map or view name
    // MapView has 'mapId' property, UserMap has 'id'
    const mapOrView = selectableAccessMaps.find(m =>
      'mapId' in m ? m.mapId === randomPlace.mapId : m.id === randomPlace.mapId
    );

    return {
      emoji: randomPlace.emoji,
      mapName: mapOrView?.name ?? 'Unknown Map'
    };
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.length > 2) {
      // Only show "Searching..." if it takes more than 1 second
      searchingTimeoutRef.current = setTimeout(() => {
        setShowSearching(true);
      }, 1000);

      try {
        const {suggestions} = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: value,
          includedPrimaryTypes: ['establishment', 'street_address']
        });

        setSuggestions(suggestions || []);
      } catch (error) {
        setSuggestions([]);
      } finally {
        setShowSearching(false);
        if (searchingTimeoutRef.current) {
          clearTimeout(searchingTimeoutRef.current);
          searchingTimeoutRef.current = null;
        }
      }
    }
  };

  const handleSuggestionClick = async (placePrediction: PlacePrediction) => {
    try {
      const place = placePrediction.toPlace();

      await place.fetchFields({
        fields: ['displayName', 'location', 'types', 'id', 'formattedAddress']
      });

      const placeData: Pick<Place, 'placeId' | 'name' | 'geometry' | 'types' | 'formattedAddress' | 'group'> = {
        name: place.displayName ?? "Unknown",
        geometry: (place.location?.lat() != null && place.location?.lng() != null ?
          {location: {lng: place.location.lng(), lat: place.location.lat()}} : null),
        types: place.types ?? [],
        placeId: place.id,
        formattedAddress: place.formattedAddress ?? null,
        group: 'want to go'
      };

      setPlaceCreation(placeData);
      setPlaceName(place.displayName ?? "Unknown"); // Pre-fill name for search places
      setPlaceNameError(''); // Clear any previous errors
      setShowEmojiPicker(true);
    } catch (error) {
      // Handle error silently or add error handling if needed
    }
  };

  const handleEmojiSelect = async (emojiObject: EmojiClickData) => {
    // Get the current value from the input ref to avoid stale state
    const currentPlaceName = placeNameInputRef.current?.value || '';

    // Validate place name using the current ref value
    if (!currentPlaceName.trim()) {
      setPlaceNameError('Place name cannot be empty');
      return;
    }

    const selectedMapOrViewChipProps = selectableAccessMaps.filter(p => p.selected);
    if (placeCreation && selectedMapOrViewChipProps.length > 0) {
      // Use the current input value, not the potentially stale state
      const finalPlaceCreation = { ...placeCreation, name: currentPlaceName.trim() };

      // Create the place on each visible/selected map or view (with edit access)
      for (const mapOrViewChip of selectedMapOrViewChipProps) {
        // MapView has 'mapId' property, UserMap has 'id'
        let mapId: string | null = null;

        if ('mapId' in mapOrViewChip) {
          // It's a MapView - only create place if user has EDIT role
          if (mapOrViewChip.role === UserRole.EDIT) {
            mapId = mapOrViewChip.mapId;
          }
        } else {
          // It's a UserMap - use the map's id
          mapId = mapOrViewChip.id;
        }

        if (mapId) {
          const newPlace = {...finalPlaceCreation, mapId, emoji: emojiObject.emoji};
          await onPlaceCreate(newPlace);
        }
      }

      onClose();
    }
  };

  const handleEmojiCancel = () => {
    setPlaceNameError(''); // Clear error on cancel
    if (coordinates) {
      // In coordinate mode (custom point), close the entire component
      onClose();
    } else {
      // In search mode, go back to the search dialog
      setShowEmojiPicker(false);
      setPlaceCreation(null);
      setPlaceName('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <>
      {selectableAccessMaps.length > 0 && !showEmojiPicker && (
        <MapChips
          selectableMaps={selectableAccessMaps}
          onMapToggle={onMapToggle}
          sx={{
            position: 'fixed',
            top: 'calc(33% - 50px)',
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: '600px',
            width: '100%',
            px: 2,
            pb: 1,
            zIndex: 1301,
          }}
        />
      )}

      {/* Place Search Dialog */}
      <Dialog
        open={!showEmojiPicker && !coordinates}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              position: 'fixed',
              top: '33%',
              m: 0,
              maxHeight: '80vh',

            }
          }
        }}
      >
        <Box sx={{p: 2, display: 'flex', alignItems: 'center', gap: 2, borderBottom: 1, borderColor: 'divider'}}>
          <TextField
            inputRef={inputRef}
            fullWidth
            variant="standard"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Search for places..."
            slotProps={{
              input: {
                disableUnderline: true,
              }
            }}
          />
          <IconButton onClick={onClose} size="small">
            <CloseIcon/>
          </IconButton>
        </Box>

        <DialogContent sx={{p: 0}}>
          {showSearching && (
            <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2}}>
              <CircularProgress size={24}/>
              <Typography sx={{ml: 2}} color="text.secondary">Searching...</Typography>
            </Box>
          )}

          {suggestions.length > 0 && (
            <List sx={{maxHeight: 400, overflow: 'auto'}}>
              {suggestions.map((suggestion) => {
                const prediction = suggestion.placePrediction;
                const existingPlaceInfo = prediction ? getExistingPlaceInfo(prediction.placeId) : null;
                return (prediction &&
                    <ListItem key={prediction.placeId} disablePadding>
                        <ListItemButton onClick={() => handleSuggestionClick(prediction)}>
                            <ListItemText
                                primary={prediction.mainText?.text}
                                secondary={prediction.secondaryText?.text}
                            />
                          {existingPlaceInfo && (
                            <Box sx={{ml: 2, display: 'flex', alignItems: 'center', gap: 1}}>
                              <Typography variant="caption" color="text.secondary">
                                {existingPlaceInfo.mapName}
                              </Typography>
                              <Typography sx={{fontSize: '1.5rem'}}>
                                {existingPlaceInfo.emoji}
                              </Typography>
                            </Box>
                          )}
                        </ListItemButton>
                    </ListItem>
                );
              })}
            </List>
          )}
        </DialogContent>
      </Dialog>

      {/* Emoji Picker Dialog */}
      <Dialog
        open={showEmojiPicker && !!placeCreation}
        onClose={handleEmojiCancel}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{p: 2, pb: 1, display: 'flex', alignItems: 'flex-start', gap: 2, borderBottom: 1, borderColor: 'divider'}}>
          <Box sx={{ flexGrow: 1 }}>
            <TextField
              inputRef={placeNameInputRef}
              autoFocus
              fullWidth
              variant="standard"
              value={placeName}
              onChange={(e) => {
                setPlaceName(e.target.value);
                // Clear error when user starts typing
                if (placeNameError) {
                  setPlaceNameError('');
                }
              }}
              placeholder="Enter place name..."
              slotProps={{
                input: {
                  disableUnderline: true,
                }
              }}
            />
            {/* Fixed height error container to prevent layout shifts */}
            <Box sx={{ height: '20px', mt: 0.5 }}>
              {placeNameError && (
                <Typography variant="caption" color="error">
                  {placeNameError}
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton onClick={handleEmojiCancel} size="small" sx={{ mt: -0.5 }}>
            <CloseIcon/>
          </IconButton>
        </Box>
        <CustomEmojiPicker onEmojiClick={handleEmojiSelect} />
      </Dialog>
    </>
  );
};

export default PlaceSearch;
