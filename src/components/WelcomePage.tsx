import React, { useEffect, useState, useRef } from 'react';
import { GoogleAuthProvider } from 'firebase/auth';
import { Box, Card, Typography } from '@mui/material';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';
import { auth } from '../config/firebase';
import { MapWrapper, Wrapper } from './MapComponent';

const WelcomePage: React.FC = () => {
  const [mapCenter, setMapCenter] = useState({ lat: 37.7749, lng: -122.4194 });
  const mapRef = useRef<any>(null);

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

  return (
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
            onMapReady={(map) => { mapRef.current = map; }}
          />
        </Wrapper>
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
