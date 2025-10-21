import React, {useEffect, useRef, useState} from 'react';
import {GoogleAuthProvider} from 'firebase/auth';
import {Box, Typography, GlobalStyles} from '@mui/material';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';
import {auth} from '../config/firebase';
import {MapWrapper, Wrapper} from './MapComponent';
import {
  CAMERA_SPEED_LAT,
  CAMERA_UPDATE_INTERVAL,
  EMOJI_FADE_DURATION,
  EMOJI_FADE_IN_DURATION,
  EMOJI_SIZE,
  EMOJI_SPAWN_INTERVAL,
  EMOJI_SPAWN_LAT_MAX,
  EMOJI_SPAWN_LAT_MIN,
  EMOJI_SPAWN_LNG_MAX,
  EMOJI_SPAWN_LNG_MIN,
  WELCOME_PAGE_EMOJIS,
} from '../config/constants';

interface FloatingEmoji {
  id: number;
  emoji: string;
  lat: number;
  lng: number;
  opacity: number;
}

interface EmojiMarkersProps {
  map?: any;
  emojis: FloatingEmoji[];
}

const EmojiMarkers: React.FC<EmojiMarkersProps> = ({map, emojis}) => {
  const markersRef = useRef<Map<number, any>>(new Map());

  // Create/remove markers when emojis are added/removed
  useEffect(() => {
    if (!map) return;

    const currentMarkers = markersRef.current;

    const updateMarkers = async () => {
      const {AdvancedMarkerElement} = await (window as any).google.maps.importLibrary('marker') as any;
      const emojiIds = new Set(emojis.map(e => e.id));

      // Remove markers for emojis that no longer exist
      currentMarkers.forEach((marker, emojiId) => {
        if (!emojiIds.has(emojiId)) {
          marker.map = null;
          currentMarkers.delete(emojiId);
        }
      });

      // Add markers for new emojis
      emojis.forEach(emoji => {
        if (!currentMarkers.has(emoji.id)) {
          const content = document.createElement('div');
          content.style.fontSize = EMOJI_SIZE;
          content.style.pointerEvents = 'none';
          content.style.userSelect = 'none';
          content.textContent = emoji.emoji;
          content.style.opacity = String(emoji.opacity);
          content.style.transition = `opacity ${EMOJI_FADE_DURATION}ms ease-in-out`;

          const marker = new AdvancedMarkerElement({
            map,
            position: {lat: emoji.lat, lng: emoji.lng},
            content,
            zIndex: 0,
          });

          currentMarkers.set(emoji.id, marker);
        }
      });
    };

    updateMarkers();
  }, [map, emojis]);

  // Update marker opacity when emoji opacity changes
  useEffect(() => {
    emojis.forEach(emoji => {
      const marker = markersRef.current.get(emoji.id);
      if (marker && marker.content) {
        marker.content.style.opacity = String(emoji.opacity);
      }
    });
  }, [emojis]);

  return null;
};

const WelcomePage: React.FC = () => {
  const [mapCenter, setMapCenter] = useState({lat: 37.7749, lng: -122.4194});
  const mapRef = useRef<any>(null);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const emojiIdCounter = useRef(0);
  const [isPageVisible, setIsPageVisible] = useState(!document.hidden);

  // Track page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!auth) return;

    const ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(auth);

    const uiConfig: firebaseui.auth.Config = {
      signInOptions: [GoogleAuthProvider.PROVIDER_ID],
      signInFlow: 'popup',
      callbacks: {
        signInSuccessWithAuthResult: () => false,
      },
    };

    ui.start('#firebaseui-auth-container', uiConfig);

    return () => ui.reset();
  }, []);

  // Slow infinite northward movement
  useEffect(() => {
    if (!isPageVisible) {
      return;
    }

    const interval = setInterval(() => {
      if (mapRef.current) {
        setMapCenter(prev => ({
          ...prev,
          lat: prev.lat + CAMERA_SPEED_LAT,
        }));

        // Get map bounds to determine visible area
        const bounds = mapRef.current.getBounds();
        if (!bounds) return;

        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const latRange = ne.lat() - sw.lat();
        const lngRange = ne.lng() - sw.lng();

        // Update emoji opacity based on proximity to bounds
        setFloatingEmojis(prev => {
          return prev
            .map(emoji => {
              // Calculate distance from each border (in degrees)
              const distanceFromNorth = ne.lat() - emoji.lat;
              const distanceFromSouth = emoji.lat - sw.lat();
              const distanceFromEast = ne.lng() - emoji.lng;
              const distanceFromWest = emoji.lng - sw.lng();

              // Find minimum distance to any border (as percentage of range)
              const minLatDistance = Math.min(distanceFromNorth, distanceFromSouth) / latRange;
              const minLngDistance = Math.min(distanceFromEast, distanceFromWest) / lngRange;
              const minDistance = Math.min(minLatDistance, minLngDistance);

              // Fade threshold (10% of visible range from edge)
              const fadeThreshold = 0.1;

              let opacity = emoji.opacity;
              if (minDistance < fadeThreshold) {
                // Start fading when approaching border
                opacity = Math.max(0, minDistance / fadeThreshold);
              } else if (emoji.opacity < 1) {
                // Gradually fade in if not at full opacity and not near border
                // Calculate increment based on EMOJI_FADE_IN_DURATION and update interval
                const fadeInIncrement = CAMERA_UPDATE_INTERVAL / EMOJI_FADE_IN_DURATION;
                opacity = Math.min(1, emoji.opacity + fadeInIncrement);
              }

              return {...emoji, opacity};
            })
            // Remove emojis that are outside expanded bounds
            .filter(emoji => {
              const margin = latRange * 0.2; // 20% margin outside visible area
              return emoji.lat > sw.lat() - margin && emoji.lat < ne.lat() + margin &&
                emoji.lng > sw.lng() - margin && emoji.lng < ne.lng() + margin;
            });
        });
      }
    }, CAMERA_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [isPageVisible]);

  // Update map center when it changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setCenter(mapCenter);
    }
  }, [mapCenter]);

  // Spawn random emojis
  useEffect(() => {
    if (!isPageVisible) {
      return;
    }

    const spawnInterval = setInterval(() => {
      if (!mapRef.current) return;

      // Get map bounds to determine visible area
      const bounds = mapRef.current.getBounds();
      if (!bounds) return;

      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const center = mapRef.current.getCenter();

      // Calculate visible lat/lng range
      const latRange = ne.lat() - sw.lat();
      const lngRange = ne.lng() - sw.lng();

      // Spawn in top 10% of visible area, centered 80% width
      const spawnLatMin = center.lat() + latRange * EMOJI_SPAWN_LAT_MIN;
      const spawnLatMax = center.lat() + latRange * EMOJI_SPAWN_LAT_MAX;
      const spawnLngMin = center.lng() + lngRange * EMOJI_SPAWN_LNG_MIN;
      const spawnLngMax = center.lng() + lngRange * EMOJI_SPAWN_LNG_MAX;

      const newEmoji: FloatingEmoji = {
        id: emojiIdCounter.current++,
        emoji: WELCOME_PAGE_EMOJIS[Math.floor(Math.random() * WELCOME_PAGE_EMOJIS.length)] || '📍',
        lat: spawnLatMin + Math.random() * (spawnLatMax - spawnLatMin),
        lng: spawnLngMin + Math.random() * (spawnLngMax - spawnLngMin),
        opacity: 0,
      };

      setFloatingEmojis(prev => [...prev, newEmoji]);
    }, EMOJI_SPAWN_INTERVAL);

    return () => clearInterval(spawnInterval);
  }, [isPageVisible]);

  return (
    <>
      <GlobalStyles
        styles={{
          '.firebaseui-idp-button': {
            width: 'auto !important',
            height: 'auto !important',
            maxWidth: 'none !important',
            minHeight: 'auto !important',
            padding: '0 !important',
            backgroundColor: 'transparent !important',
            boxShadow: 'none !important',
            overflow: 'visible !important',
            pointerEvents: 'none !important',
          },
          '.firebaseui-idp-text': {
            display: 'none !important',
          },
          '.firebaseui-idp-icon-wrapper': {
            margin: '0 !important',
            transform: 'scale(2) !important',
            pointerEvents: 'auto !important',
          },
          '#firebaseui-auth-container': {
            marginTop: '0 !important',
          },
          '.firebaseui-container': {
            backgroundColor: 'transparent !important',
            boxShadow: 'none !important',
            padding: '0 !important',
            margin: '0 !important',
          },
          '.firebaseui-card-content': {
            padding: '0 !important',
          },
          '.firebaseui-card-actions': {
            padding: '0 !important',
          },
        }}
      />
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          width: '100vw',
          overflow: 'hidden',
        }}
      >
      {/* Map Background */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        <Wrapper
          apiKey={process.env['REACT_APP_GOOGLE_MAPS_API_KEY']!}
          libraries={['places', 'marker']}
        >
          <MapWrapper
            center={mapCenter}
            zoom={18}
            mapTypeControl={false}
            streetViewControl={false}
            fullscreenControl={false}
            gestureHandling="none"
            mapId="8af90efb7301ef1d8d294cee"
            tilt={40}
            disableDefaultUI={true}
            onMapReady={(map) => {
              mapRef.current = map;
            }}
          >
            <EmojiMarkers map={mapRef.current} emojis={floatingEmojis}/>
          </MapWrapper>
        </Wrapper>
      </Box>

      {/* White Vignette Overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
          background: `
            radial-gradient(circle at top left, transparent 0%, transparent 50%, rgba(255, 255, 255, 0.6) 100%),
            radial-gradient(circle at top right, transparent 0%, transparent 50%, rgba(255, 255, 255, 0.6) 100%),
            radial-gradient(circle at bottom left, transparent 0%, transparent 50%, rgba(255, 255, 255, 0.6) 100%),
            radial-gradient(circle at bottom right, transparent 0%, transparent 50%, rgba(255, 255, 255, 0.6) 100%)
          `,
        }}
      />

      {/* Content Container */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
        }}
      >
        <Typography variant="h2" gutterBottom color="primary">
          PLACES
        </Typography>
        <Typography variant="h6" gutterBottom color="primary" sx={{mb: 3, textAlign: 'center'}}>
          SAVE AND SHARE YOUR FAVORITE SPOTS<br />
          IN A SIMPLEST WAY POSSIBLE
        </Typography>
        <div id="firebaseui-auth-container"></div>
      </Box>
    </Box>
    </>
  );
};

export default WelcomePage;
