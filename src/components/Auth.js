import React, { useEffect, useRef, useState } from 'react';
import { Box, Card, Typography, CircularProgress } from '@mui/material';
import { auth } from '../config/firebase';
import { onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';
import AccountMenu from './AccountMenu';

const Auth = ({ children, currentMapId, onMapSwitch }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const uiRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user && !loading) {
      // Initialize FirebaseUI
      if (!uiRef.current) {
        uiRef.current = new firebaseui.auth.AuthUI(auth);
      }

      const uiConfig = {
        signInOptions: [
          GoogleAuthProvider.PROVIDER_ID
        ],
        signInFlow: 'popup',
        callbacks: {
          signInSuccessWithAuthResult: () => {
            // Don't redirect, just close the widget
            return false;
          }
        }
      };

      uiRef.current.start('#firebaseui-auth-container', uiConfig);
    }

    return () => {
      if (uiRef.current) {
        uiRef.current.reset();
      }
    };
  }, [user, loading]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <CircularProgress sx={{ color: 'white' }} />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Card
          sx={{
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
  }

  return (
    <div>
      <AccountMenu user={user} currentMapId={currentMapId} onMapSwitch={onMapSwitch} />
      {children}
    </div>
  );
};

export default Auth;