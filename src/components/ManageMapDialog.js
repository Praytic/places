import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Box,
  IconButton,
  Divider,
  Typography,
  Alert,
  List,
  ListItem
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { createMap, shareMapWithUser, unshareMapWithUser, updateMap, getMapCollaborators, deleteMap, ROLES } from '../services/MapsService';
import { updateMapViewDisplayedName } from '../services/MapViewService';

const ManageMapDialog = ({ userEmail, onMapCreated, onClose, existingMap = null }) => {
  console.log('[ManageMapDialog] Rendering', existingMap ? 'in edit mode' : 'in create mode');
  const isEditMode = !!existingMap;
  const isOwner = isEditMode && existingMap.userRole === ROLES.OWNER;
  const [mapName, setMapName] = useState(existingMap?.displayedName || existingMap?.name || '');
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [email, setEmail] = useState('');
  const [emailList, setEmailList] = useState([]);
  const [originalEmailList, setOriginalEmailList] = useState([]);
  const [error, setError] = useState(null);

  // Load existing collaborators when in edit mode
  useEffect(() => {
    if (isEditMode && existingMap?.id) {
      const loadCollaborators = async () => {
        try {
          const collaborators = await getMapCollaborators(existingMap.id);
          // Filter out the owner and convert to emailList format
          const filteredCollaborators = collaborators
            .filter(collab => collab.userId !== existingMap.owner)
            .map(collab => ({
              email: collab.userId,
              role: collab.userRole
            }));
          setEmailList(filteredCollaborators);
          setOriginalEmailList(filteredCollaborators);
        } catch (err) {
          console.error('Error loading collaborators:', err);
        }
      };
      loadCollaborators();
    }
  }, [isEditMode, existingMap]);

  const handleAddEmail = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (email === userEmail) {
      setError('You cannot share with yourself');
      return;
    }

    if (emailList.some(item => item.email === email)) {
      setError('Email already added');
      return;
    }

    setEmailList([...emailList, { email, role: ROLES.VIEWER }]);
    setEmail('');
    setError(null);
  };

  const handleEmailChange = (index, value) => {
    const newList = [...emailList];
    newList[index] = { ...newList[index], email: value };
    setEmailList(newList);
  };

  const handleToggleRole = (emailToToggle, currentRole) => {
    const newRole = currentRole === ROLES.EDITOR ? ROLES.VIEWER : ROLES.EDITOR;
    setEmailList(emailList.map(item =>
      item.email === emailToToggle ? { ...item, role: newRole } : item
    ));
  };

  const handleRemoveEmail = (emailToRemove) => {
    setEmailList(emailList.filter(item => item.email !== emailToRemove));
  };

  const handleCreate = async () => {
    const trimmedName = mapName.trim();
    if (!trimmedName) {
      return;
    }

    try {
      setCreating(true);
      setError(null);

      if (isEditMode) {
        // Edit mode
        if (isOwner) {
          // Owner updates the Map entity directly
          await updateMap(existingMap.id, { name: trimmedName });
        } else {
          // Collaborator updates their MapView's displayedName
          if (!existingMap.mapViewId) {
            throw new Error('MapView ID is missing for collaborator');
          }
          await updateMapViewDisplayedName(existingMap.mapViewId, trimmedName);
        }

        // Only owners can manage collaborators
        if (isOwner) {
          // Find emails that were removed (in original but not in current list)
          const currentEmails = emailList.map(item => item.email);
          const originalEmails = originalEmailList.map(item => item.email);
          const removedEmails = originalEmails.filter(email => !currentEmails.includes(email));

          // Unshare with removed collaborators
          for (const email of removedEmails) {
            try {
              await unshareMapWithUser(existingMap.id, email);
            } catch (err) {
              console.error(`Error unsharing with ${email}:`, err);
            }
          }

          // Share with all emails in the current list (will add new ones or update existing roles)
          for (const { email, role } of emailList) {
            try {
              await shareMapWithUser(existingMap.id, email, role);
            } catch (err) {
              console.error(`Error sharing with ${email}:`, err);
              // Continue with other emails even if one fails
            }
          }
        }

        onMapCreated(existingMap.id);
      } else {
        // Create mode - create new map and share with collaborators
        const newMap = await createMap(userEmail, trimmedName);

        // Share with all emails in the list
        for (const { email, role } of emailList) {
          try {
            await shareMapWithUser(newMap.id, email, role);
          } catch (err) {
            console.error(`Error sharing with ${email}:`, err);
            // Continue with other emails even if one fails
          }
        }

        onMapCreated(newMap.id, ROLES.OWNER);
      }

      onClose();
    } catch (err) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} map:`, err);
      setError(`Failed to ${isEditMode ? 'update' : 'create'} map. Please try again.`);
      setCreating(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${existingMap.name}"? This will also delete all places in this map.`)) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      await deleteMap(existingMap.id);
      onClose();
    } catch (err) {
      console.error('Error deleting map:', err);
      setError('Failed to delete map. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <Dialog open={true} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {isEditMode ? (isOwner ? 'Edit Map' : 'Rename Map') : 'Create New Map'}
        <IconButton onClick={handleCancel} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Map Creation Section */}
        <Box>
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

        {/* Email Adding Section - Only for owners */}
        {(!isEditMode || isOwner) && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
            Add collaborator by email:
          </Typography>

          <List disablePadding>
          {emailList.map((item, index) => (
            <ListItem
              key={index}
              sx={{
                display: 'flex',
                gap: 1,
                p: 0,
                mb: 1
              }}
            >
              <TextField
                fullWidth
                size="small"
                type="email"
                value={item.email}
                onChange={(e) => handleEmailChange(index, e.target.value)}
                placeholder="email@example.com"
                disabled={creating}
              />
              <IconButton
                size="small"
                onClick={() => handleToggleRole(item.email, item.role)}
                disabled={creating}
                title={item.role === ROLES.EDITOR ? 'Switch to viewer' : 'Switch to editor'}
              >
                {item.role === ROLES.EDITOR ? <EditIcon /> : <VisibilityIcon />}
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleRemoveEmail(item.email)}
                disabled={creating}
                title="Remove"
              >
                <DeleteIcon />
              </IconButton>
            </ListItem>
          ))}

          {/* Active input field with ADD button */}
          <ListItem
            component="form"
            onSubmit={handleAddEmail}
            sx={{
              display: 'flex',
              gap: 1,
              p: 0
            }}
          >
            <TextField
              fullWidth
              size="small"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              disabled={creating}
            />
            <Button
              type="submit"
              variant="outlined"
              disabled={creating || !email}
              sx={{ minWidth: 80 }}
            >
              Add
            </Button>
          </ListItem>
        </List>
      </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <Divider />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, p: 1.5 }}>
        {isEditMode && isOwner && (
          <Button
            onClick={handleDelete}
            disabled={creating || deleting}
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        )}
        <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
          <Button
            onClick={handleCancel}
            disabled={creating || deleting}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={creating || deleting || !mapName.trim()}
            variant="contained"
          >
            {creating ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save' : 'Create')}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default ManageMapDialog;