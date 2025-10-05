import React, { useEffect, useRef, useState } from 'react';
import { signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../config/firebase';
import ShareDialog from './ShareDialog';
import ManageMapsDialog from './ManageMapsDialog';

const AccountMenu = ({ user, currentMapId, onMapSwitch }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showManageMapsDialog, setShowManageMapsDialog] = useState(false);
  const menuRef = useRef(null);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setShowMenu(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAddAccount = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      await signInWithPopup(auth, provider);
      setShowMenu(false);
    } catch (error) {
      console.error('Error adding account:', error);
    }
  };

  const handleShareClick = () => {
    setShowShareDialog(true);
    setShowMenu(false);
  };

  const handleShareDialogClose = () => {
    setShowShareDialog(false);
    setShowManageMapsDialog(false);
  };

  const handleManageMapsClick = () => {
    setShowManageMapsDialog(true);
    setShowMenu(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  if (!user.photoURL) {
    return null;
  }

  return (
    <>
      <div className="avatar-menu-container" ref={menuRef}>
        <img
          src={user.photoURL}
          alt=""
          className="floating-avatar"
          onClick={() => setShowMenu(!showMenu)}
        />

        {showMenu && (
          <div className="account-menu">
            <div className="account-menu-header">
              <img
                src={user.photoURL}
                alt=""
                className="menu-avatar"
              />
              <div className="menu-user-info">
                <div className="menu-user-email">{user.email}</div>
              </div>
            </div>
            <div className="account-menu-divider"></div>
            <button className="account-menu-item" onClick={handleManageMapsClick}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="9 22 9 12 15 12 15 22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Manage maps
            </button>
            <button className="account-menu-item" onClick={handleShareClick}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="16 6 12 2 8 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="2" x2="12" y2="15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Share places
            </button>
            <button className="account-menu-item" onClick={handleAddAccount}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="7" r="4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="19" y1="8" x2="19" y2="14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="22" y1="11" x2="16" y2="11" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Add another account
            </button>
            <button className="account-menu-item" onClick={handleSignOut}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="16 17 21 12 16 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="21" y1="12" x2="9" y2="12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Sign out
            </button>
          </div>
        )}
      </div>
      {showShareDialog && (
        <ShareDialog
          userEmail={user.email}
          mapId={currentMapId}
          onClose={handleShareDialogClose}
        />
      )}
      {showManageMapsDialog && (
        <ManageMapsDialog
          userEmail={user.email}
          currentMapId={currentMapId}
          onMapSelect={onMapSwitch}
          onClose={() => setShowManageMapsDialog(false)}
        />
      )}
    </>
  );
};

export default AccountMenu;
