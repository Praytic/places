// Welcome page animation constants

// Camera movement speed (latitude change per update interval)
export const CAMERA_SPEED_LAT = 0.00001;

// Camera update interval in milliseconds
export const CAMERA_UPDATE_INTERVAL = 50;

// Emoji animation constants
export const EMOJI_SPAWN_INTERVAL = 6000; // milliseconds
export const EMOJI_FADE_DURATION = 1000; // milliseconds for fade in/out transition
export const EMOJI_FADE_IN_DURATION = 1000; // milliseconds for fade in
export const EMOJI_SIZE = '48px';

// Emoji spawn position multipliers (relative to map center and visible range)
export const EMOJI_SPAWN_LAT_MIN = 0.48; // Top 2% height
export const EMOJI_SPAWN_LAT_MAX = 0.49; // Top 1% height
export const EMOJI_SPAWN_LNG_MIN = -0.4; // Left 80% (centered)
export const EMOJI_SPAWN_LNG_MAX = 0.4; // Right 80% (centered)

// Available emojis for welcome page
export const WELCOME_PAGE_EMOJIS = [
  '🍕', '🍔', '🍣', '🍜', '🍰', '☕', '🍺',
  '🎨', '🎭', '🎪', '🎡', '🎢',
  '🏛️', '🗽', '🌉', '🏰'
];
