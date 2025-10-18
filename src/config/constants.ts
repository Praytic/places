// Welcome page animation constants

// Camera movement speed (latitude change per update interval)
export const CAMERA_SPEED_LAT = 0.00001;

// Camera update interval in milliseconds
export const CAMERA_UPDATE_INTERVAL = 50;

// Camera movement speed in pixels per update (for emoji positioning)
export const CAMERA_SPEED_PIXELS = {
  x: 0,
  y: -0.5, // Moving north means y decreases
};

// Emoji animation constants
export const EMOJI_SPAWN_INTERVAL = 1500; // milliseconds
export const EMOJI_FADE_IN_DELAY = 50; // milliseconds
export const EMOJI_FADE_OUT_DELAY = 4500; // milliseconds
export const EMOJI_REMOVE_DELAY = 5500; // milliseconds

// Available emojis for welcome page
export const WELCOME_PAGE_EMOJIS = [
  '🍕', '🍔', '🍣', '🍜', '🍰', '☕', '🍺',
  '🎨', '🎭', '🎪', '🎡', '🎢',
  '🏛️', '🗽', '🌉', '🏰'
];
