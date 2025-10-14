import React, { useState } from 'react';
import { Box, Avatar, Menu, MenuItem, ListItemIcon, ListItemText, Divider, Typography } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { signOut, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { auth } from '../lib/firebase/config';
import { getCurrentLocation } from '../shared/utils/locationService';
import { Location } from '../shared/types/domain';

interface AccountMenuProps {
  user: User;
  onLocationRequest?: (location: Location) => void;
}

const AccountMenu: React.FC<AccountMenuProps> = ({ user, onLocationRequest }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
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

  const handleGoToCurrentLocation = async () => {
    try {
      const location = await getCurrentLocation();
      if (onLocationRequest) {
        onLocationRequest(location);
      }
      setAnchorEl(null);
    } catch (error) {
      console.error('Error getting current location:', error);
      alert('Unable to get your location. Please check your browser permissions.');
    }
  };

  if (!user.photoURL) {
    return null;
  }

  return (
    <>
      <Box sx={{ position: 'fixed', top: 20, right: 20, zIndex: 2000 }}>
        <Avatar
          src={user.photoURL}
          alt={user.displayName || user.email || undefined}
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
              alt={user.displayName || user.email || undefined}
              sx={{ width: 48, height: 48, border: '2px solid rgba(0, 0, 0, 0.1)' }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" color="text.secondary" noWrap>
                {user.email}
              </Typography>
            </Box>
          </Box>
          <Divider />
          <MenuItem onClick={handleGoToCurrentLocation}>
            <ListItemIcon>
              <MyLocationIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Go to Current Location</ListItemText>
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
    </>
  );
};

export default AccountMenu;
