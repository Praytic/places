# Places App

A mobile-friendly web app for managing places on a map with emoji markers, similar to Google MyMaps.

<p align="center">
  <img src="docs/images/overall.png" width="30%" />
  <img src="docs/images/emoji-picker.png" width="30%" />
  <img src="docs/images/marker.png" width="30%" />
</p>

## Quick Start

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/) (enable Maps JavaScript API and Places API)

3. Create a `.env` file and add your API key:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env`:
   ```
   REACT_APP_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

4. Start the app:
   ```bash
   npm start
   ```