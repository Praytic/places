import React from 'react';
import ReactDOM from 'react-dom/client';
import { Box, IconButton, Link, Typography } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import DeleteIcon from '@mui/icons-material/Delete';
import { Place, UserRole } from '../types';

type AdvancedMarkerElement = google.maps.marker.AdvancedMarkerElement;
type Map = google.maps.Map;
type InfoWindow = google.maps.InfoWindow;

interface InfoWindowContentProps {
  place: Place & { vicinity?: string };
  onEmojiChange: (place: Place) => void;
  onToggleFavorite: (place: Place) => void;
  onDelete: (place: Place) => void;
  userRole?: UserRole;
}

const InfoWindowContent: React.FC<InfoWindowContentProps> = ({
  place,
  onEmojiChange,
  onToggleFavorite,
  onDelete,
  userRole,
}) => {
  const isReadOnly = userRole === UserRole.VIEW;
  const isFavorite = place.group === 'favorite';

  return (
    <Box
      sx={{
        width: 260,
        p: 1.5,
        bgcolor: 'transparent', // don't fight Google Maps styling
        overflow: 'visible',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography variant="subtitle1" fontWeight={600}>
        {place.name}
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 1.5, lineHeight: 1.43, wordBreak: 'break-word' }}
      >
        {place.formattedAddress || place.vicinity || 'Address not available'}
      </Typography>

      <Link
        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          place.name
        )}&query_place_id=${place.placeId || ''}`}
        target="_blank"
        rel="noopener noreferrer"
        underline="none"
        sx={{ display: 'inline-block', mt: 1.5, fontSize: 14, fontWeight: 500 }}
      >
        View on Google Maps
      </Link>

      <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'space-around' }}>
        <IconButton
          onClick={() => onToggleFavorite(place)}
          disabled={isReadOnly}
          title={isReadOnly ? '' : isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
          size="small"
          color={isFavorite ? 'error' : 'default'}
        >
          {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
        </IconButton>

        <IconButton
          onClick={() => onEmojiChange(place)}
          disabled={isReadOnly}
          title={isReadOnly ? '' : 'Change Emoji'}
          size="small"
        >
          <EmojiEmotionsIcon />
        </IconButton>

        <IconButton
          onClick={() => onDelete(place)}
          disabled={isReadOnly}
          title={isReadOnly ? '' : 'Delete Place'}
          size="small"
        >
          <DeleteIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

/**
 * Creates and displays an info window for a place marker
 */
export function createInfoWindow(
  map: Map,
  marker: AdvancedMarkerElement,
  place: Place & { vicinity?: string },
  onClose: () => void,
  onEmojiChange: (place: Place) => void,
  onToggleFavorite: (place: Place) => void,
  onDelete: (place: Place) => void,
  userRole?: UserRole
): InfoWindow {
  const contentDiv = document.createElement('div');
  const root = ReactDOM.createRoot(contentDiv);

  root.render(
    <InfoWindowContent
      place={place}
      onEmojiChange={onEmojiChange}
      onToggleFavorite={onToggleFavorite}
      onDelete={onDelete}
      userRole={userRole}
    />
  );

  const infoWindow = new google.maps.InfoWindow({
    content: contentDiv,
    ariaLabel: place.name,
    maxWidth: 280,
    disableAutoPan: false,
  });

  infoWindow.addListener('closeclick', () => {
    onClose?.();
  });

  infoWindow.open(map, marker);

  // Customization of InfoWindow
  google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
    const iwContainer = document.querySelector('.gm-style-iw-d');
    if (iwContainer) {
      // Force override max-height continuously
      const observer = new MutationObserver(() => {
        (iwContainer as HTMLElement).style.setProperty('max-height', 'none', 'important');
      });
      observer.observe(iwContainer, { attributes: true, attributeFilter: ['style'] });

      (iwContainer as HTMLElement).style.overflow = 'visible';
      (iwContainer as HTMLElement).style.setProperty('max-height', 'none', 'important');
    }

    // Remove the gm-style-iw-chr div completely
    const iwChr = document.querySelector('.gm-style-iw-chr');
    if (iwChr) {
      iwChr.remove();
    }

    // Remove padding from .gm-style-iw-c
    const iwC = document.querySelector('.gm-style .gm-style-iw-c');
    if (iwC) {
      (iwC as HTMLElement).style.padding = '0';
    }

    // Remove the close button
    const closeButton = document.querySelector('.gm-style-iw button[aria-label="Close"]');
    if (closeButton) {
      closeButton.remove();
    }
  });

  return infoWindow;
}
