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
import EmojiPicker, {EmojiClickData, EmojiStyle} from 'emoji-picker-react';
import MapChips from './MapChips';
import {MapView, Place, SelectableAccessMap, UserRole} from '../shared/types';


type AutocompleteSuggestion = google.maps.places.AutocompleteSuggestion;
type PlacePrediction = google.maps.places.PlacePrediction;
type PlaceCreation = Pick<Place, 'placeId' | 'name' | 'geometry' | 'types' | 'formattedAddress' | 'group' | 'emoji' | 'mapId'>

interface PlaceSearchProps {
  onPlaceCreate: (placeCreation: PlaceCreation) => Promise<void>;
  onClose: () => void;
  selectableAccessMaps: SelectableAccessMap[];
  existingPlaces: Place[];
}

const PlaceSearch: React.FC<PlaceSearchProps> = ({
  onPlaceCreate,
  onClose,
  selectableAccessMaps = [],
  existingPlaces = [],
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [placeCreation, setPlaceCreation] = useState<Pick<Place, 'placeId' | 'name' | 'geometry' | 'types' | 'formattedAddress' | 'group'> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.length > 2) {
      setIsLoading(true);
      try {
        const { suggestions } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: value,
          includedPrimaryTypes: ['establishment', 'street_address']
        });

        setSuggestions(suggestions || []);
      } catch (error) {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSuggestionClick = async (placePrediction: PlacePrediction) => {
    setIsLoading(true);
    try {
      const place = placePrediction.toPlace();

      await place.fetchFields({
        fields: ['displayName', 'location', 'types', 'id', 'formattedAddress']
      });

      // Check if place already exists using the actual place ID (not the prediction ID)
      const existingPlace = existingPlaces.find(p => p.placeId === place.id);
      if (existingPlace) {
        setIsLoading(false);
        alert(`This place "${existingPlace.name}" ${existingPlace.emoji} has already been added to your map.`);
        return;
      }

      const placeData: Pick<Place, 'placeId' | 'name' | 'geometry' | 'types' | 'formattedAddress' | 'group'> = {
        name: place.displayName ?? "Unknown",
        geometry: (place.location?.lat() != null && place.location?.lng() != null ?
          { location: { lng: place.location.lng(), lat: place.location.lat() } } : null),
        types: place.types ?? [],
        placeId: place.id,
        formattedAddress: place.formattedAddress ?? null,
        group: 'want to go'
      };

      setPlaceCreation(placeData);
      setShowEmojiPicker(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmojiSelect = async (emojiObject: EmojiClickData) => {
    const selectedMapOrViewChipProps = selectableAccessMaps.filter(p => p.selected);
    if (placeCreation && selectedMapOrViewChipProps.length > 0) {
      // Create the place on each visible/selected map or view (with edit access)
      for (const mapOrViewChip of selectedMapOrViewChipProps) {
        const newPlace = mapOrViewChip instanceof MapView && mapOrViewChip.role === UserRole.EDIT
          ? {...placeCreation, mapId: mapOrViewChip.mapId, emoji: emojiObject.emoji}
          : {...placeCreation, mapId: mapOrViewChip.id, emoji: emojiObject.emoji};
        await onPlaceCreate(newPlace);
      }

      onClose();
    }
  };

  const handleEmojiCancel = () => {
    setShowEmojiPicker(false);
    setPlaceCreation(null);
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
      <Dialog
        open={!showEmojiPicker}
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
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderBottom: 1, borderColor: 'divider' }}>
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
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 0 }}>
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
              <CircularProgress size={24} />
              <Typography sx={{ ml: 2 }} color="text.secondary">Searching...</Typography>
            </Box>
          )}

          {suggestions.length > 0 && (
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {suggestions.map((suggestion) => {
                const prediction = suggestion.placePrediction;
                return (prediction &&
                  <ListItem key={prediction.placeId} disablePadding>
                    <ListItemButton onClick={() => handleSuggestionClick(prediction)}>
                      <ListItemText
                        primary={prediction.mainText?.text}
                        secondary={prediction.secondaryText?.text}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={showEmojiPicker && !!placeCreation}
        onClose={handleEmojiCancel}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">
            Choose an emoji for {placeCreation?.name}
          </Typography>
          <IconButton onClick={handleEmojiCancel} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent>
          <EmojiPicker
            onEmojiClick={handleEmojiSelect}
            width="100%"
            height={400}
            previewConfig={{ showPreview: false }}
            emojiStyle={EmojiStyle.APPLE}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PlaceSearch;
