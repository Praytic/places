import React, { useState, useRef, useEffect } from 'react';
import { Box, Dialog, DialogContent, TextField, IconButton, List, ListItem, ListItemButton, ListItemText, Typography, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmojiPicker, { EmojiStyle, EmojiClickData } from 'emoji-picker-react';
import MapChips from './MapChips';
import {MapView, Place, PlaceGroup, UserMap} from '../shared/types/domain';

interface PlaceSearchProps {
  onPlaceSelect: (place: any, mapId: string) => Promise<void>;
  onClose: () => void;
  existingPlaces?: Place[];
  userMaps: (UserMap | MapView)[];
  visibleMapIds?: Set<string>;
  onMapVisibilityToggle?: (mapId: string) => void;
}

interface GooglePlacePrediction {
  mainText: { text: string };
  secondaryText?: { text: string };
  placeId: string;
  toPlace: () => any;
}

interface GoogleSuggestion {
  placePrediction: GooglePlacePrediction;
}

interface SelectedPlaceData {
  name: string;
  geometry: { location: any };
  types?: string[];
  place_id: string;
  formatted_address?: string;
  group: PlaceGroup;
}

const PlaceSearch: React.FC<PlaceSearchProps> = ({
  onPlaceSelect,
  onClose,
  existingPlaces = [],
  userMaps = [],
  visibleMapIds = new Set(),
  onMapVisibilityToggle
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GoogleSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedPlaceData, setSelectedPlaceData] = useState<SelectedPlaceData | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.length > 2 && (window as any).google) {
      setIsLoading(true);
      try {
        const { AutocompleteSuggestion } = await (window as any).google.maps.importLibrary('places');

        const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: value,
          includedPrimaryTypes: ['establishment', 'street_address']
        });

        setSuggestions(suggestions || []);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = async (suggestion: GoogleSuggestion) => {
    setIsLoading(true);
    try {
      const place = suggestion.placePrediction.toPlace();

      await place.fetchFields({
        fields: ['displayName', 'location', 'types', 'id', 'formattedAddress']
      });

      const placeData: SelectedPlaceData = {
        name: place.displayName,
        geometry: { location: place.location },
        types: place.types,
        place_id: place.id,
        formatted_address: place.formattedAddress,
        group: 'want to go'
      };

      setSelectedPlaceData(placeData);
      setShowEmojiPicker(true);
    } catch (error) {
      console.error('Failed to fetch place details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmojiSelect = async (emojiObject: EmojiClickData) => {
    if (selectedPlaceData && visibleMapIds.size > 0) {
      const placeWithEmoji = {
        ...selectedPlaceData,
        emoji: emojiObject.emoji
      };

      // Create the place on each visible/selected map
      for (const mapId of visibleMapIds) {
        await onPlaceSelect(placeWithEmoji, mapId);
      }

      onClose();
    }
  };

  const handleEmojiCancel = () => {
    setShowEmojiPicker(false);
    setSelectedPlaceData(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <>
      {userMaps.length > 0 && !showEmojiPicker && (
        <MapChips
          userMaps={userMaps}
          selectedMapIds={visibleMapIds}
          onMapToggle={onMapVisibilityToggle}
          enableManagement={false}
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
        PaperProps={{
          sx: {
            position: 'fixed',
            top: '33%',
            m: 0,
            maxHeight: '80vh',
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
            InputProps={{
              disableUnderline: true,
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
                const existingPlace = existingPlaces.find(p => (p as any).place_id === prediction.placeId);
                return (
                  <ListItem key={prediction.placeId} disablePadding>
                    <ListItemButton onClick={() => handleSuggestionClick(suggestion)}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {existingPlace && (
                              <span style={{ fontSize: '1.2em' }}>{existingPlace.emoji}</span>
                            )}
                            <span>{prediction.mainText.text}</span>
                          </Box>
                        }
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
        open={showEmojiPicker && !!selectedPlaceData}
        onClose={handleEmojiCancel}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">
            Choose an emoji for {selectedPlaceData?.name}
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
