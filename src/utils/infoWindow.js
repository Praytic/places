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
    const headerDiv = document.createElement('div');
    headerDiv.style.cssText = 'padding: 12px 12px 0 12px;';
    const h3 = document.createElement('h3');
    h3.style.cssText = 'margin: 0; font-size: 16px; font-weight: 500; color: #202124; line-height: 20px;';
    h3.textContent = place.name;
    headerDiv.appendChild(h3);

    // Create content container
    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = 'font-family: "Google Sans", Roboto, Arial, sans-serif; max-width: 280px;';
    contentDiv.innerHTML = `
        <div style="padding: 8px 12px 12px 12px;">
          <div style="color: #70757a; font-size: 14px; line-height: 20px; margin-bottom: 12px;">
            ${place.formatted_address || place.vicinity || 'Address not available'}
          </div>
          ${
              place.rating
                  ? `
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="color: #fbbc04; margin-right: 4px;">★</span>
              <span style="color: #202124; font-size: 14px;">${place.rating}</span>
              ${
                  place.user_ratings_total
                      ? `<span style="color: #70757a; font-size: 14px; margin-left: 4px;">(${place.user_ratings_total})</span>`
                      : ''
              }
            </div>
          `
                  : ''
          }
          <div style="margin-top: 12px;">
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                place.name
            )}&query_place_id=${place.place_id || ''}"
               target="_blank"
               style="color: #1a73e8; text-decoration: none; font-size: 14px; font-weight: 500;">
              View on Google Maps
            </a>
          </div>
        </div>
        <div style="border-top: 0.5px solid rgba(0, 0, 0, 0.1); margin: 0 12px;"></div>
        <div style="padding: 12px; display: flex; gap: 8px;">
          <button id="favorite-button" style="
            background: none;
            color: ${place.group === 'favorite' ? '#ef4444' : '#666'};
            border: none;
            border-radius: 8px;
            padding: 10px;
            cursor: ${isReadOnly ? 'not-allowed' : 'pointer'};
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 1;
            opacity: ${isReadOnly ? '0.5' : '1'};
          " title="${isReadOnly ? 'View-only access' : (place.group === 'favorite' ? 'Remove from Favorites' : 'Add to Favorites')}" ${isReadOnly ? 'disabled' : ''}>
            <svg stroke="currentColor" fill="${place.group === 'favorite' ? '#ef4444' : 'none'}" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
          <button id="emoji-change-button" style="
            background: none;
            color: #666;
            border: none;
            border-radius: 8px;
            padding: 10px;
            cursor: ${isReadOnly ? 'not-allowed' : 'pointer'};
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 1;
            opacity: ${isReadOnly ? '0.5' : '1'};
          " title="${isReadOnly ? 'View-only access' : 'Change Emoji'}" ${isReadOnly ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
              <line x1="9" y1="9" x2="9.01" y2="9"></line>
              <line x1="15" y1="9" x2="15.01" y2="9"></line>
            </svg>
          </button>
        </div>`;

    const infoWindow = new window.google.maps.InfoWindow({
        headerContent: headerDiv,
        content: contentDiv,
        ariaLabel: place.name
    });

    infoWindow.addListener('closeclick', () => {
        if (onClose) {
            onClose();
        }
    });

    // Add event listeners to the buttons after the info window is opened
    infoWindow.addListener('domready', () => {
        const favoriteButton = document.getElementById('favorite-button');
        const emojiButton = document.getElementById('emoji-change-button');

        if (favoriteButton && !isReadOnly) {
            // Add hover effect
            favoriteButton.addEventListener('mouseenter', () => {
                favoriteButton.style.background = 'rgba(0, 0, 0, 0.05)';
            });
            favoriteButton.addEventListener('mouseleave', () => {
                favoriteButton.style.background = 'none';
            });
            favoriteButton.addEventListener('mousedown', () => {
                favoriteButton.style.background = 'rgba(0, 0, 0, 0.1)';
                favoriteButton.style.transform = 'scale(0.95)';
            });
            favoriteButton.addEventListener('mouseup', () => {
                favoriteButton.style.background = 'rgba(0, 0, 0, 0.05)';
                favoriteButton.style.transform = 'scale(1)';
            });

            // Add click handler
            favoriteButton.addEventListener('click', () => {
                if (onToggleFavorite) {
                    onToggleFavorite(place);
                }
            });
        }

        if (emojiButton && !isReadOnly) {
            // Add hover effect
            emojiButton.addEventListener('mouseenter', () => {
                emojiButton.style.background = 'rgba(0, 0, 0, 0.05)';
                emojiButton.style.color = '#333';
            });
            emojiButton.addEventListener('mouseleave', () => {
                emojiButton.style.background = 'none';
                emojiButton.style.color = '#666';
            });
            emojiButton.addEventListener('mousedown', () => {
                emojiButton.style.background = 'rgba(0, 0, 0, 0.1)';
                emojiButton.style.transform = 'scale(0.95)';
            });
            emojiButton.addEventListener('mouseup', () => {
                emojiButton.style.background = 'rgba(0, 0, 0, 0.05)';
                emojiButton.style.transform = 'scale(1)';
            });

            // Add click handler
            emojiButton.addEventListener('click', () => {
                if (onEmojiChange) {
                    onEmojiChange(place);
                }
            });
        }
    });

    infoWindow.open(map, marker);

    return infoWindow;
}