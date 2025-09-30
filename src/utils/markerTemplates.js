/**
 * Utility functions for generating marker HTML templates
 */

/**
 * Creates a regular marker SVG element
 * @param {string} emoji - The emoji to display in the marker
 * @returns {HTMLElement} The marker SVG element
 */
export const createRegularMarker = (emoji) => {
  const content = document.createElement('div');
  content.innerHTML = `
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <text x="16" y="22" text-anchor="middle" font-size="24">${emoji}</text>
    </svg>
  `;
  content.style.cursor = 'pointer';
  return content.firstElementChild;
};

/**
 * Creates a selected marker SVG element with glow effect
 * @param {string} emoji - The emoji to display in the marker
 * @returns {HTMLElement} The selected marker SVG element
 */
export const createSelectedMarker = (emoji) => {
    const content = document.createElement('div');
    content.innerHTML = `
    <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" overflow="visible">
      <defs>
        <filter id="glow-selected" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
          <feOffset dx="0" dy="0" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.6"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <!-- Outer white border ring -->
      <circle cx="24" cy="28" r="20" fill="white" filter="url(#glow-selected)"/>
      <!-- Colored inner circle -->
      <circle cx="24" cy="28" r="16" fill="#ededed"/>
      <!-- Emoji -->
      <text x="24" y="38" text-anchor="middle" font-size="24">${emoji}</text>
    </svg>
  `;
    content.style.cursor = 'pointer';
    return content.firstElementChild;
};
