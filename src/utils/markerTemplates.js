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
      <circle cx="16" cy="16" r="15" fill="transparent"/>
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
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="18" fill="#ffffff80" stroke="#e6e6e6" stroke-width="4"/>
      <text x="16" y="23" text-anchor="middle" font-size="24">${emoji}</text>
    </svg>
  `;
  content.style.cursor = 'pointer';
  return content.firstElementChild;
};
