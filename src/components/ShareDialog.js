import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  IconButton,
  Box,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { getUserMaps, shareMapWithUser, unshareMapWithUser, getMapCollaborators, ROLES } from '../services/MapsService';

const ShareDialog = ({ userEmail, mapId = null, onClose }) => {
  const [email, setEmail] = useState('');
  const [sharedWithList, setSharedWithList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentMapId, setCurrentMapId] = useState(null);

  useEffect(() => {
    const loadMapAndCollaborators = async () => {
      try {
        let targetMapId = mapId;

        // If mapId is not provided, get user's first owned map
        if (!targetMapId) {
          const maps = await getUserMaps(userEmail);
          if (maps.length > 0 && maps[0].userRole === ROLES.OWNER) {
            targetMapId = maps[0].id;
          }
        }

        if (targetMapId) {
          setCurrentMapId(targetMapId);

          // Load collaborators for this map
          const collaborators = await getMapCollaborators(targetMapId);
          const nonOwners = collaborators
            .filter(c => c.userId !== userEmail)
            .map(c => c.userId);
          setSharedWithList(nonOwners);
        }
      } catch (err) {
        console.error('Error loading map and collaborators:', err);
      }
    };

    loadMapAndCollaborators();
  }, [userEmail, mapId]);

  const handleShare = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (email === userEmail) {
      setError('You cannot share with yourself');
      return;
    }

    if (sharedWithList.includes(email)) {
      setError('Already shared with this user');
      return;
    }

    if (!currentMapId) {
      setError('No map to share');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await shareMapWithUser(currentMapId, email, ROLES.VIEWER);
      setSuccess(`Successfully shared map with ${email}`);
      setEmail('');

      // Reload collaborators
      const collaborators = await getMapCollaborators(currentMapId);
      const nonOwners = collaborators
        .filter(c => c.userId !== userEmail)
        .map(c => c.userId);
      setSharedWithList(nonOwners);

      // Close dialog after successful share
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      console.error('Error sharing:', err);
      setError('Failed to share. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveShare = async (collaboratorEmail) => {
    if (!currentMapId) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await unshareMapWithUser(currentMapId, collaboratorEmail);
      setSuccess(`Removed access for ${collaboratorEmail}`);

      // Reload collaborators
      const collaborators = await getMapCollaborators(currentMapId);
      const nonOwners = collaborators
        .filter(c => c.userId !== userEmail)
        .map(c => c.userId);
      setSharedWithList(nonOwners);
    } catch (err) {
      console.error('Error removing share:', err);
      setError('Failed to remove access. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Share Map
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box component="form" onSubmit={handleShare} sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
            Add collaborator by email:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              disabled={loading}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !email}
              sx={{ minWidth: 100 }}
            >
              {loading ? 'Sharing...' : 'Share'}
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {sharedWithList.length > 0 && (
          <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600 }}>
              Shared with:
            </Typography>
            <List disablePadding>
              {sharedWithList.map((collaboratorEmail) => (
                <ListItem
                  key={collaboratorEmail}
                  sx={{
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    mb: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <ListItemText primary={collaboratorEmail} />
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleRemoveShare(collaboratorEmail)}
                    disabled={loading}
                  >
                    Remove
                  </Button>
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;