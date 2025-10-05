import React from 'react';
import ReactDOM from 'react-dom/client';
import { Box, Typography, Link, IconButton, Divider } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import StarIcon from '@mui/icons-material/Star';

/**
 * Creates and displays an info window for a place marker
 * @param {google.maps.Map} map - The Google Maps instance
 * @param {google.maps.marker.AdvancedMarkerElement} marker - The marker to attach the info window to
 * @param {Object} place - The place data object
 * @param {Function} onClose - Callback function when info window is closed
 * @param {Function} onEmojiChange - Callback function when emoji is changed
 * @param {Function} onToggleFavorite - Callback function when favorite is toggled
 * @param {string} userRole - User's role for the map (owner, editor, viewer)
 * @returns {google.maps.InfoWindow} The created info window instance
 */
export function createInfoWindow(map, marker, place, onClose, onEmojiChange, onToggleFavorite, userRole) {
    const isReadOnly = userRole === 'viewer';
    const isFavorite = place.group === 'favorite';

    const headerDiv = document.createElement('div');
    headerDiv.style.cssText = 'padding: 12px 12px 0 12px;';
    const h3 = document.createElement('h3');
    h3.style.cssText = 'margin: 0; font-size: 16px; font-weight: 500; color: #202124; line-height: 20px;';
    h3.textContent = place.name;
    headerDiv.appendChild(h3);

    // Create content container
    const contentDiv = document.createElement('div');
    const root = ReactDOM.createRoot(contentDiv);

    root.render(
        <Box sx={{ width: 280, overflow: 'visible' }}>
            <Box sx={{ p: '8px 12px 12px 12px' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.43 }}>
                    {place.formatted_address || place.vicinity || 'Address not available'}
                </Typography>

                {place.rating && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <StarIcon sx={{ color: '#fbbc04', fontSize: 16, mr: 0.5 }} />
                        <Typography variant="body2" sx={{ mr: 0.5 }}>
                            {place.rating}
                        </Typography>
                        {place.user_ratings_total && (
                            <Typography variant="body2" color="text.secondary">
                                ({place.user_ratings_total})
                            </Typography>
                        )}
                    </Box>
                )}

                <Link
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id || ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="none"
                    sx={{ display: 'inline-block', mt: 1.5, fontSize: 14, fontWeight: 500 }}
                >
                    View on Google Maps
                </Link>
            </Box>

            <Divider sx={{ mx: 1.5 }} />

            <Box sx={{ p: '6px 8px', display: 'flex', gap: 0.5 }}>
                <IconButton
                    onClick={() => !isReadOnly && onToggleFavorite(place)}
                    disabled={isReadOnly}
                    title={isReadOnly ? '' : (isFavorite ? 'Remove from Favorites' : 'Add to Favorites')}
                    size="small"
                    sx={{
                        flex: 1,
                        borderRadius: 1,
                        color: isFavorite ? 'error.main' : 'text.secondary',
                        '&:hover': !isReadOnly && {
                            bgcolor: 'action.hover'
                        }
                    }}
                >
                    {isFavorite ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                </IconButton>

                <IconButton
                    onClick={() => !isReadOnly && onEmojiChange(place)}
                    disabled={isReadOnly}
                    title={isReadOnly ? '' : 'Change Emoji'}
                    size="small"
                    sx={{
                        flex: 1,
                        borderRadius: 1,
                        color: 'text.secondary',
                        '&:hover': !isReadOnly && {
                            bgcolor: 'action.hover'
                        }
                    }}
                >
                    <EmojiEmotionsIcon fontSize="small" />
                </IconButton>
            </Box>
        </Box>
    );

    const infoWindow = new window.google.maps.InfoWindow({
        headerContent: headerDiv,
        content: contentDiv,
        ariaLabel: place.name,
        maxWidth: 280,
        disableAutoPan: false
    });

    infoWindow.addListener('closeclick', () => {
        if (onClose) {
            onClose();
        }
    });

    infoWindow.open(map, marker);

    return infoWindow;
}
