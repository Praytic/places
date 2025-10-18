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
export const EMOJI_FADE_DURATION = 500; // milliseconds for fade in/out transition
export const EMOJI_SIZE = '48px';

// Emoji spawn area (percentage of container)
export const EMOJI_SPAWN_AREA = {
  topOffset: 0, // Start from top
  heightPercent: 10, // 10% height from top
  widthPercent: 80, // 80% width centered
};

// Distance from border (in pixels) to start fading
export const EMOJI_FADE_BORDER_DISTANCE = 100;

// Available emojis for welcome page
export const WELCOME_PAGE_EMOJIS = [
  '🍕', '🍔', '🍣', '🍜', '🍰', '☕', '🍺',
  '🎨', '🎭', '🎪', '🎡', '🎢',
  '🏛️', '🗽', '🌉', '🏰'
];
