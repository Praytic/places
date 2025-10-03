/* global google */

/**
 * Creates and displays an info window for a place marker
 * @param {google.maps.Map} map - The Google Maps instance
 * @param {google.maps.marker.AdvancedMarkerElement} marker - The marker to attach the info window to
 * @param {Object} place - The place data object
 * @param {Function} onClose - Callback function when info window is closed
 * @param {Function} onEmojiChange - Callback function when emoji is changed
 * @returns {google.maps.InfoWindow} The created info window instance
 */
export function createInfoWindow(map, marker, place, onClose, onEmojiChange) {
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
        <div style="padding: 12px;">
          <button id="emoji-change-button" style="
            background: none;
            color: #666;
            border: none;
            border-radius: 8px;
            padding: 10px 14px;
            font-size: 14px;
            font-weight: 400;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            font-family: 'Google Sans', Roboto, Arial, sans-serif;
          ">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
              <line x1="9" y1="9" x2="9.01" y2="9"></line>
              <line x1="15" y1="9" x2="15.01" y2="9"></line>
            </svg>
            <span>Change Emoji</span>
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

    // Add event listener to the button after the info window is opened
    infoWindow.addListener('domready', () => {
        const emojiButton = document.getElementById('emoji-change-button');
        if (emojiButton) {
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