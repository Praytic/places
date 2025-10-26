/**
 * Utility functions for generating marker HTML templates
 */

/**
 * Creates a regular marker SVG element
 * @param emoji - The emoji to display in the marker
 * @returns The marker SVG element
 */
export const createRegularMarker = (emoji: string): HTMLElement => {
  const content = document.createElement('div');
  content.innerHTML = `
    <svg width="32" height="32" viewBox="-16 -26 32 32" xmlns="http://www.w3.org/2000/svg" style="display: block; width: 32px; height: 32px; transform-origin: center; position: relative;">
      <text x="0" y="-4" text-anchor="middle" font-size="24">${emoji}</text>
    </svg>
  `;
  content.style.cursor = 'pointer';
  return content.firstElementChild as HTMLElement;
};

/**
 * Creates a selected marker SVG element with glow effect
 * @param emoji - The emoji to display in the marker
 * @returns The selected marker SVG element
 */
export const createSelectedMarker = (emoji: string): HTMLElement => {
  const content = document.createElement('div');
  content.innerHTML = `
    <svg width="48" height="48" viewBox="-24 -38 48 48" xmlns="http://www.w3.org/2000/svg" overflow="visible" style="display: block; width: 48px; height: 48px; transform-origin: center; position: relative;">
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
      <circle cx="0" cy="-10" r="20" fill="white" filter="url(#glow-selected)"/>
      <!-- Colored inner circle -->
      <circle cx="0" cy="-10" r="16" fill="#ededed"/>
      <!-- Emoji -->
      <text x="0" y="0" text-anchor="middle" font-size="24">${emoji}</text>
    </svg>
  `;
  content.style.cursor = 'pointer';
  return content.firstElementChild as HTMLElement;
};

/**
 * Creates a current location marker with pulsating blue dot animation
 * @returns The current location marker SVG element
 */
export const createCurrentLocationMarker = (): HTMLElement => {
  const content = document.createElement('div');
  const uniqueId = `pulse-${Math.random().toString(36).substr(2, 9)}`;

  content.innerHTML = `
    <svg width="60" height="60" viewBox="-30 -30 60 60" xmlns="http://www.w3.org/2000/svg" overflow="visible" style="display: block; width: 60px; height: 60px; transform-origin: center; position: relative;">
      <defs>
        <style>
          @keyframes ${uniqueId}-pulse-wave {
            0% {
              r: 6;
              opacity: 0.8;
            }
            100% {
              r: 24;
              opacity: 0;
            }
          }
          .${uniqueId}-pulse-ring {
            fill: none;
            stroke: #4285F4;
            stroke-width: 2;
            animation: ${uniqueId}-pulse-wave 2s ease-out infinite;
          }
          .${uniqueId}-pulse-ring-1 {
            animation-delay: 0s;
          }
          .${uniqueId}-pulse-ring-2 {
            animation-delay: 0.5s;
          }
          .${uniqueId}-pulse-ring-3 {
            animation-delay: 1s;
          }
          .${uniqueId}-pulse-ring-4 {
            animation-delay: 1.5s;
          }
        </style>
      </defs>
      <!-- Pulsating rings -->
      <circle cx="0" cy="0" r="6" class="${uniqueId}-pulse-ring ${uniqueId}-pulse-ring-1"/>
      <circle cx="0" cy="0" r="6" class="${uniqueId}-pulse-ring ${uniqueId}-pulse-ring-2"/>
      <circle cx="0" cy="0" r="6" class="${uniqueId}-pulse-ring ${uniqueId}-pulse-ring-3"/>
      <circle cx="0" cy="0" r="6" class="${uniqueId}-pulse-ring ${uniqueId}-pulse-ring-4"/>
      <!-- Outer white circle -->
      <circle cx="0" cy="0" r="8" fill="white"/>
      <!-- Inner blue dot -->
      <circle cx="0" cy="0" r="6" fill="#4285F4"/>
    </svg>
  `;

  return content.firstElementChild as HTMLElement;
};