import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Box,
  IconButton,
  Divider,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import { createMap, ROLES } from '../services/MapsService';
import ShareDialog from './ShareDialog';

const CreateMapDialog = ({ userEmail, onMapCreated, onClose }) => {
  const [mapName, setMapName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdMapId, setCreatedMapId] = useState(null);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const handleCreate = async () => {
    const trimmedName = mapName.trim();
    if (!trimmedName) {
      return;
    }

    try {
      setCreating(true);
      const newMap = await createMap(userEmail, trimmedName);
      setCreatedMapId(newMap.id);
      setShowShareDialog(true);
    } catch (err) {
      console.error('Error creating map:', err);
      alert('Failed to create map. Please try again.');
      setCreating(false);
    }
  };

  const handleShareDialogClose = () => {
    setShowShareDialog(false);
    if (createdMapId) {
      onMapCreated(createdMapId, ROLES.OWNER);
    }
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (showShareDialog && createdMapId) {
    return (
      <ShareDialog
        userEmail={userEmail}
        mapId={createdMapId}
        onClose={handleShareDialogClose}
      />
    );
  }

  return (
    <Dialog open={true} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Create New Map
        <IconButton onClick={handleCancel} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box component="form" onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
            Map name:
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={mapName}
            onChange={(e) => setMapName(e.target.value)}
            placeholder="Enter map name"
            disabled={creating}
            autoFocus
          />
        </Box>
      </DialogContent>

      <Divider />

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, p: 1.5 }}>
        <IconButton
          onClick={handleCancel}
          disabled={creating}
          title="Cancel"
        >
          <CloseIcon />
        </IconButton>
        <IconButton
          onClick={handleCreate}
          disabled={creating || !mapName.trim()}
          title="Create map"
          color="primary"
        >
          <CheckIcon />
        </IconButton>
      </Box>
    </Dialog>
  );
};

export default CreateMapDialog;