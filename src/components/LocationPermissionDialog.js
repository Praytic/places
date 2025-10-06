import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';

const LocationPermissionDialog = ({ open, onAllow, onSkip }) => {
  return (
    <Dialog open={open} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <MyLocationIcon color="primary" />
          <span>Enable Location</span>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          Would you like to share your current location? This will help us center the map on your area.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          You can always change this later from the account menu.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onSkip} color="inherit">
          Skip
        </Button>
        <Button onClick={onAllow} variant="contained" color="primary">
          Allow
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LocationPermissionDialog;