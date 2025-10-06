import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  Divider,
  CircularProgress,
  Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { deleteMap, updateMap, ROLES } from '../services/MapsService';
import CreateMapDialog from './CreateMapDialog';

const ManageMapsDialog = ({
  userEmail,
  userMaps,
  visibleMapIds,
  onMapVisibilityToggle,
  onMapsUpdated,
  onClose
}) => {
  const [deleting, setDeleting] = useState(null);
  const [editingMapId, setEditingMapId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [error, setError] = useState(null);

  const handleStartEditing = (map) => {
    setEditingMapId(map.id);
    setEditingName(map.name || '');
  };

  const handleSaveMapName = async (mapId) => {
    const trimmedName = editingName.trim();

    if (!trimmedName) {
      const map = userMaps.find(m => m.id === mapId);
      if (map && !map.name) {
        // New map with no name, delete it
        try {
          await deleteMap(mapId);
          await onMapsUpdated();
        } catch (err) {
          console.error('Error deleting empty map:', err);
          setError('Failed to delete empty map');
        }
      }
      setEditingMapId(null);
      setEditingName('');
      return;
    }

    try {
      await updateMap(mapId, { name: trimmedName });
      await onMapsUpdated();
    } catch (err) {
      console.error('Error updating map name:', err);
      setError('Failed to update map name');
    }

    setEditingMapId(null);
    setEditingName('');
  };

  const handleCancelEditing = (mapId) => {
    const map = userMaps.find(m => m.id === mapId);

    if (map && !map.name) {
      deleteMap(mapId)
        .then(() => onMapsUpdated())
        .catch(err => console.error('Error deleting cancelled map:', err));
    }

    setEditingMapId(null);
    setEditingName('');
  };

  const handleDeleteMap = async (mapId, mapName) => {
    const map = userMaps.find(m => m.id === mapId);
    if (!map || map.userRole !== ROLES.OWNER) return;

    if (!window.confirm(`Are you sure you want to delete "${mapName}"? All places will be deleted.`)) {
      return;
    }

    try {
      setDeleting(mapId);
      await deleteMap(mapId);
      await onMapsUpdated();
    } catch (err) {
      console.error('Error deleting map:', err);
      setError('Failed to delete map');
    } finally {
      setDeleting(null);
    }
  };

  const handleCreateMap = () => {
    setShowCreateDialog(true);
  };

  const handleMapCreated = async () => {
    setShowCreateDialog(false);
    await onMapsUpdated();
  };

  const handleToggleVisibility = (mapId) => {
    onMapVisibilityToggle(mapId);
  };

  return (
    <>
      <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Manage Maps
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {error && (
            <Typography color="error" align="center" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          {userMaps.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 5 }}>
              No maps found
            </Typography>
          ) : (
            <List>
              {userMaps.map((map) => (
                <ListItem
                  key={map.id}
                  sx={{
                    bgcolor: 'transparent',
                    borderRadius: 1,
                    mb: 1,
                    border: 1,
                    borderColor: visibleMapIds.has(map.id) ? 'primary.main' : 'divider',
                    px: 2,
                    py: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  {editingMapId === map.id ? (
                    <TextField
                      size="small"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleSaveMapName(map.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveMapName(map.id);
                        } else if (e.key === 'Escape') {
                          handleCancelEditing(map.id);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                      placeholder="Enter map name"
                      sx={{ flex: 1 }}
                    />
                  ) : (
                    <ListItemText
                      primary={
                        <Typography sx={{ fontWeight: visibleMapIds.has(map.id) ? 600 : 400 }}>
                          {map.name || 'Untitled Map'}
                        </Typography>
                      }
                      sx={{ flex: 1, my: 0 }}
                    />
                  )}

                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title={visibleMapIds.has(map.id) ? "Hide markers" : "Show markers"}>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleVisibility(map.id)}
                        color={visibleMapIds.has(map.id) ? "primary" : "default"}
                      >
                        {visibleMapIds.has(map.id) ? (
                          <VisibilityIcon fontSize="small" />
                        ) : (
                          <VisibilityOffIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>

                    <Tooltip title={map.userRole === ROLES.OWNER ? "Edit name" : "Only owners can edit"}>
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handleStartEditing(map)}
                          disabled={map.userRole !== ROLES.OWNER}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>

                    <Tooltip title={map.userRole === ROLES.OWNER ? "Delete map" : "Only owners can delete"}>
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteMap(map.id, map.name)}
                          disabled={map.userRole !== ROLES.OWNER || deleting === map.id}
                        >
                          {deleting === map.id ? (
                            <CircularProgress size={20} />
                          ) : (
                            <DeleteIcon fontSize="small" />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>

        <Divider />

        <Box sx={{ display: 'flex', justifyContent: 'center', p: 1.5 }}>
          <Tooltip title="Create new map">
            <IconButton
              onClick={handleCreateMap}
              color="primary"
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Dialog>

      {showCreateDialog && (
        <CreateMapDialog
          userEmail={userEmail}
          onMapCreated={handleMapCreated}
          onClose={() => setShowCreateDialog(false)}
        />
      )}
    </>
  );
};

export default ManageMapsDialog;