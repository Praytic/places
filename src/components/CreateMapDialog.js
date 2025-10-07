import React, { useState } from 'react';
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
import { createMap, shareMapWithUser, ROLES } from '../services/MapsService';

const CreateMapDialog = ({ userEmail, onMapCreated, onClose }) => {
  console.log('[CreateMapDialog] Rendering');
  const [mapName, setMapName] = useState('');
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState('');
  const [emailList, setEmailList] = useState([]);
  const [error, setError] = useState(null);

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

      // Create the map
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
      onClose();
    } catch (err) {
      console.error('Error creating map:', err);
      setError('Failed to create map. Please try again.');
      setCreating(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={true} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Create New Map
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

        {/* Email Adding Section */}
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

        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <Divider />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, p: 1.5 }}>
        <Button
          onClick={handleCancel}
          disabled={creating}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          disabled={creating || !mapName.trim()}
          variant="contained"
        >
          {creating ? 'Creating...' : 'Create'}
        </Button>
      </Box>
    </Dialog>
  );
};

export default CreateMapDialog;