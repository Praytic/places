import React, { useEffect, useState, useRef } from 'react';
import { GoogleAuthProvider } from 'firebase/auth';
import { Box, Card, Typography } from '@mui/material';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';
import { auth } from '../config/firebase';
import { MapWrapper, Wrapper } from './MapComponent';

interface FloatingEmoji {
  id: number;
  emoji: string;
  x: number;
  y: number;
  opacity: number;
}

const WelcomePage: React.FC = () => {
  const [mapCenter, setMapCenter] = useState({ lat: 37.7749, lng: -122.4194 });
  const mapRef = useRef<any>(null);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const emojiIdCounter = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const emojis = ['🍕', '🍔', '🍣', '🍜', '🍰', '☕', '🍺', '🎨', '🎭', '🎪', '🎡', '🎢', '🏛️', '🗽', '🌉', '🏰'];

  // Camera movement speed in pixels per 50ms
  const cameraSpeed = useRef({ x: 0, y: -0.5 }); // Moving north means y decreases

  useEffect(() => {
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
    const interval = setInterval(() => {
      if (mapRef.current) {
        setMapCenter(prev => ({
          ...prev,
          lat: prev.lat + 0.00001, // Very slow movement north
        }));

        // Update emoji positions based on camera movement
        setFloatingEmojis(prev => prev.map(emoji => ({
          ...emoji,
          y: emoji.y - cameraSpeed.current.y, // Move emojis with camera
        })));
      }
    }, 50); // Update every 50ms for smooth animation

    return () => clearInterval(interval);
  }, []);

  // Update map center when it changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setCenter(mapCenter);
    }
  }, [mapCenter]);

  // Spawn random emojis
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight;

      const newEmoji: FloatingEmoji = {
        id: emojiIdCounter.current++,
        emoji: emojis[Math.floor(Math.random() * emojis.length)] || '📍',
        x: Math.random() * containerWidth,
        y: Math.random() * containerHeight,
        opacity: 0,
      };

      setFloatingEmojis(prev => [...prev, newEmoji]);

      // Fade in
      setTimeout(() => {
        setFloatingEmojis(prev =>
          prev.map(e => e.id === newEmoji.id ? { ...e, opacity: 1 } : e)
        );
      }, 50);

      // Fade out after 4.5 seconds
      setTimeout(() => {
        setFloatingEmojis(prev =>
          prev.map(e => e.id === newEmoji.id ? { ...e, opacity: 0 } : e)
        );
      }, 4500);

      // Remove after 5 seconds
      setTimeout(() => {
        setFloatingEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
      }, 5500);
    }, 1500); // Spawn new emoji every 1.5 seconds

    return () => clearInterval(spawnInterval);
  }, []);

  return (
    <Box
      ref={containerRef}
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
            onMapReady={(map) => { mapRef.current = map; }}
          />
        </Wrapper>

        {/* Floating Emojis */}
        {floatingEmojis.map(emoji => (
          <Box
            key={emoji.id}
            sx={{
              position: 'absolute',
              left: `${emoji.x}px`,
              top: `${emoji.y}px`,
              fontSize: '48px',
              opacity: emoji.opacity,
              transition: 'opacity 0.5s ease-in-out',
              pointerEvents: 'none',
              userSelect: 'none',
              transform: 'translate(-50%, -50%)',
            }}
          >
            {emoji.emoji}
          </Box>
        ))}
      </Box>

      {/* Login Card */}
      <Card
        sx={{
          position: 'relative',
          zIndex: 1,
          p: 5,
          maxWidth: 400,
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        }}
      >
        <Typography variant="h4" gutterBottom>
          Places App
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Sign in to continue
        </Typography>
        <div id="firebaseui-auth-container"></div>
      </Card>
    </Box>
  );
};

export default WelcomePage;
