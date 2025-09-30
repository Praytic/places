# Places App

A minimal web application for mobile that imitates Google MyMaps functionality using Google Maps API and Google Places API.

## Features

- **Interactive Map**: Google Maps widget with emoji markers for different place types
- **Place Management**: Add, remove, and categorize places
- **Smart Search**: Integrated Google Places search with autocomplete
- **Group Organization**: Organize places into groups (favorite, wants to go, visited)
- **Layer Control**: Hide/show different categories of places
- **Mobile Optimized**: Responsive design optimized for vertical mobile view

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Get Google Maps API credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the following APIs:
     - Maps JavaScript API
     - Places API
   - Create credentials (API key)
   - Restrict the API key to your domain for security

4. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

5. Add your Google Maps API key to the `.env` file:
   ```
   REACT_APP_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

6. Start the development server:
   ```bash
   npm start
   ```

## Usage

### Control Panel

The app features a control panel with 4 main buttons:

1. **Add Place**: Opens a search interface to find and add new places
2. **Remove Place**: Removes the currently selected place from the map
3. **Change Group**: Changes the group assignment of the selected place
4. **Layers**: Toggle visibility of different place categories

### Place Types

Places are automatically categorized using emojis based on their Google Places types:
- 🍽️ Restaurants
- ☕ Cafes
- 🛒 Grocery stores
- 🌳 Parks
- 🏥 Hospitals
- And many more...

### Groups

Organize your places into different groups:
- **favorite**: Your favorite places
- **wants to go**: Places you want to visit
- **visited**: Places you've been to
- **default**: Uncategorized places

## Technical Details

- Built with React 18
- Uses Google Maps JavaScript API
- Uses Google Places API for search
- Responsive CSS Grid layout
- Local storage for data persistence
- Mobile-first design approach

## Browser Support

- Modern browsers with ES6+ support
- Mobile Safari (iOS 12+)
- Chrome Mobile (Android 8+)
- Desktop browsers (Chrome, Firefox, Safari, Edge)