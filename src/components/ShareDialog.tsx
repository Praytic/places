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
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { getUserMaps, shareMapWithUser, unshareMapWithUser, getMapCollaborators } from '../services/MapsService';
import { UserRole } from '../shared/types/domain';

interface Collaborator {
  email: string;
  role: UserRole;
}

interface ShareDialogProps {
  userEmail: string;
  mapId?: string | null;
  onClose: () => void;
}

const ShareDialog: React.FC<ShareDialogProps> = ({ userEmail, mapId = null, onClose }) => {
  const [email, setEmail] = useState('');
  const [sharedWithList, setSharedWithList] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentMapId, setCurrentMapId] = useState<string | null>(null);

  useEffect(() => {
    const loadMapAndCollaborators = async () => {
      try {
        let targetMapId = mapId;

        // If mapId is not provided, get user's first owned map
        if (!targetMapId) {
          const maps = await getUserMaps(userEmail);
          const firstMap = maps[0];
          if (maps.length > 0 && firstMap && firstMap.userRole === UserRole.OWNER) {
            targetMapId = firstMap.id;
          }
        }

        if (targetMapId) {
          setCurrentMapId(targetMapId);

          // Load collaborators for this map
          const collaborators = await getMapCollaborators(targetMapId);
          const nonOwners = collaborators
            .filter(c => c.userId !== userEmail)
            .map(c => ({ email: c.userId, role: c.userRole }));
          setSharedWithList(nonOwners);
        }
      } catch (err) {
        console.error('Error loading map and collaborators:', err);
      }
    };

    loadMapAndCollaborators();
  }, [userEmail, mapId]);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (email === userEmail) {
      setError('You cannot share with yourself');
      return;
    }

    if (sharedWithList.some(item => item.email === email)) {
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
      await shareMapWithUser(currentMapId, email, UserRole.VIEW);
      setSuccess(`Successfully shared map with ${email}`);
      setEmail('');

      // Reload collaborators
      const collaborators = await getMapCollaborators(currentMapId);
      const nonOwners = collaborators
        .filter(c => c.userId !== userEmail)
        .map(c => ({ email: c.userId, role: c.userRole }));
      setSharedWithList(nonOwners);
    } catch (err) {
      console.error('Error sharing:', err);
      setError('Failed to share. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (collaboratorEmail: string, currentRole: UserRole) => {
    if (!currentMapId) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const newRole = currentRole === UserRole.EDIT ? UserRole.VIEW : UserRole.EDIT;

    try {
      await shareMapWithUser(currentMapId, collaboratorEmail, newRole);
      setSuccess(`Updated ${collaboratorEmail} to ${newRole}`);

      // Reload collaborators
      const collaborators = await getMapCollaborators(currentMapId);
      const nonOwners = collaborators
        .filter(c => c.userId !== userEmail)
        .map(c => ({ email: c.userId, role: c.userRole }));
      setSharedWithList(nonOwners);
    } catch (err) {
      console.error('Error updating role:', err);
      setError('Failed to update role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveShare = async (collaboratorEmail: string) => {
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
        .map(c => ({ email: c.userId, role: c.userRole }));
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
              {sharedWithList.map((collaborator) => (
                <ListItem
                  key={collaborator.email}
                  sx={{
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    mb: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <ListItemText
                    primary={collaborator.email}
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      mr: 1
                    }}
                  />
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleToggleRole(collaborator.email, collaborator.role)}
                      disabled={loading}
                      title={collaborator.role === UserRole.EDIT ? 'Switch to viewer' : 'Switch to editor'}
                    >
                      {collaborator.role === UserRole.EDIT ? <EditIcon /> : <VisibilityIcon />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveShare(collaborator.email)}
                      disabled={loading}
                      title="Remove access"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
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