import React, { useState } from 'react';
import { Box, Avatar, Menu, MenuItem, ListItemIcon, ListItemText, Divider, Typography } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ShareIcon from '@mui/icons-material/Share';
import HomeIcon from '@mui/icons-material/Home';
import { signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../config/firebase';
import ShareDialog from './ShareDialog';
import ManageMapsDialog from './ManageMapsDialog';

const AccountMenu = ({ user, currentMapId, onMapSwitch }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showManageMapsDialog, setShowManageMapsDialog] = useState(false);
  const open = Boolean(anchorEl);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setAnchorEl(null);
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
      setAnchorEl(null);
    } catch (error) {
      console.error('Error adding account:', error);
    }
  };

  const handleShareClick = () => {
    setShowShareDialog(true);
    setAnchorEl(null);
  };

  const handleShareDialogClose = () => {
    setShowShareDialog(false);
    setShowManageMapsDialog(false);
  };

  const handleManageMapsClick = () => {
    setShowManageMapsDialog(true);
    setAnchorEl(null);
  };

  if (!user.photoURL) {
    return null;
  }

  return (
    <>
      <Box sx={{ position: 'fixed', top: 20, right: 20, zIndex: 2000 }}>
        <Avatar
          src={user.photoURL}
          alt={user.displayName || user.email}
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            cursor: 'pointer',
            boxShadow: 'rgba(0, 0, 0, 0.3) 0px 1px 4px -1px',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
          }}
        />

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              mt: 1.5,
              minWidth: 300,
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 2, bgcolor: 'action.hover' }}>
            <Avatar
              src={user.photoURL}
              alt={user.displayName || user.email}
              sx={{ width: 48, height: 48, border: '2px solid rgba(0, 0, 0, 0.1)' }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" color="text.secondary" noWrap>
                {user.email}
              </Typography>
            </Box>
          </Box>
          <Divider />
          <MenuItem onClick={handleManageMapsClick}>
            <ListItemIcon>
              <HomeIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Manage maps</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleShareClick}>
            <ListItemIcon>
              <ShareIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Share places</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleAddAccount}>
            <ListItemIcon>
              <PersonAddIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Add another account</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleSignOut}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Sign out</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
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
