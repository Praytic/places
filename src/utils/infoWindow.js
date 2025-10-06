import React from 'react';
import ReactDOM from 'react-dom/client';
import {Box, IconButton, Link, Typography} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import DeleteIcon from '@mui/icons-material/Delete';

/**
 * Creates and displays an info window for a place marker
 * Fully rewritten to use MUI components
 */
export function createInfoWindow(
    map,
    marker,
    place,
    onClose,
    onEmojiChange,
    onToggleFavorite,
    onDelete,
    userRole
) {
    const isReadOnly = userRole === 'viewer';
    const isFavorite = place.group === 'favorite';

    // Create React root
    const contentDiv = document.createElement('div');
    const root = ReactDOM.createRoot(contentDiv);

    root.render(
        <Box
            sx={{
                width: 260,
                p: 1.5,
                bgcolor: 'transparent', // don’t fight Google Maps styling
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
                sx={{mb: 1.5, lineHeight: 1.43, wordBreak: 'break-word'}}
            >
                {place.formatted_address || place.vicinity || 'Address not available'}
            </Typography>

            <Link
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    place.name
                )}&query_place_id=${place.place_id || ''}`}
                target="_blank"
                rel="noopener noreferrer"
                underline="none"
                sx={{display: 'inline-block', mt: 1.5, fontSize: 14, fontWeight: 500}}
            >
                View on Google Maps
            </Link>

            <Box sx={{mt: 1.5, display: 'flex', justifyContent: 'space-around'}}>
                <IconButton
                    onClick={() => !isReadOnly && onToggleFavorite(place)}
                    disabled={isReadOnly}
                    title={
                        isReadOnly ? '' : isFavorite ? 'Remove from Favorites' : 'Add to Favorites'
                    }
                    size="small"
                >
                    {isFavorite ? <FavoriteIcon/> : <FavoriteBorderIcon/>}
                </IconButton>

                <IconButton
                    onClick={() => !isReadOnly && onEmojiChange(place)}
                    disabled={isReadOnly}
                    title={isReadOnly ? '' : 'Change Emoji'}
                    size="small"
                >
                    <EmojiEmotionsIcon/>
                </IconButton>

                <IconButton
                    onClick={() => !isReadOnly && onDelete(place)}
                    disabled={isReadOnly}
                    title={isReadOnly ? '' : 'Delete Place'}
                    size="small"
                    color="error"
                >
                    <DeleteIcon/>
                </IconButton>
            </Box>
        </Box>
    );

    const infoWindow = new window.google.maps.InfoWindow({
        content: contentDiv,
        ariaLabel: place.name,
        maxWidth: 280,
        disableAutoPan: false,
    });

    infoWindow.addListener('closeclick', () => {
        onClose?.();
    });

    infoWindow.open(map, marker);

    window.google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
        const iwContainer = document.querySelector('.gm-style-iw-d');
        if (iwContainer) {
            // Force override max-height continuously
            const observer = new MutationObserver(() => {
                iwContainer.style.setProperty('max-height', 'none', 'important');
            });
            observer.observe(iwContainer, { attributes: true, attributeFilter: ['style'] });

            iwContainer.style.overflow = 'visible';
            iwContainer.style.setProperty('max-height', 'none', 'important');
        }

        // Remove the gm-style-iw-chr div completely
        const iwChr = document.querySelector('.gm-style-iw-chr');
        if (iwChr) {
            iwChr.remove();
        }

        // Remove padding from .gm-style-iw-c
        const iwC = document.querySelector('.gm-style .gm-style-iw-c');
        if (iwC) {
            iwC.style.padding = '0';
        }

        // Remove the close button
        const closeButton = document.querySelector('.gm-style-iw button[aria-label="Close"]');
        if (closeButton) {
            closeButton.remove();
        }
    });

    return infoWindow;
}
