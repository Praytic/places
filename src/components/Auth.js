import React, { useEffect, useRef, useState } from 'react';
import { auth } from '../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';

const Auth = ({ children }) => {
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
          {
            provider: 'google.com',
            customParameters: {
              prompt: 'select_account'
            }
          }
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

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>Places App</h1>
          <p>Sign in to continue</p>
          <div id="firebaseui-auth-container"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="auth-header">
        <div className="user-info">
          <span className="user-name">{user.displayName}</span>
          <button className="sign-out-button" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </div>
      {children}
    </div>
  );
};

export default Auth;