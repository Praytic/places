import React, { useState, useEffect } from 'react';
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
  Chip,
  Divider,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LayersIcon from '@mui/icons-material/Layers';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { getUserMaps, deleteMap, updateMap, ROLES } from '../services/MapsService';
import CreateMapDialog from './CreateMapDialog';

const ManageMapsDialog = ({ userEmail, currentMapId, onMapSelect, onClose }) => {
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedMapId, setSelectedMapId] = useState(null);
  const [editingMapId, setEditingMapId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    const loadMaps = async () => {
      try {
        setLoading(true);
        const userMaps = await getUserMaps(userEmail);
        setMaps(userMaps);
      } catch (err) {
        console.error('Error loading maps:', err);
        setError('Failed to load maps');
      } finally {
        setLoading(false);
      }
    };

    loadMaps();
  }, [userEmail]);

  const handleMapClick = (map) => {
    if (map.id !== currentMapId) {
      if (selectedMapId === map.id) {
        onMapSelect(map.id, map.userRole);
        onClose();
      } else {
        setSelectedMapId(map.id);
      }
    }
  };

  const handleCreateMap = () => {
    setShowCreateDialog(true);
  };

  const handleMapCreated = (mapId, userRole) => {
    setShowCreateDialog(false);
    onMapSelect(mapId, userRole);
    onClose();
  };

  const handleStartEditing = (map) => {
    setEditingMapId(map.id);
    setEditingName(map.name || '');
  };

  const handleSaveMapName = async (mapId) => {
    const trimmedName = editingName.trim();

    if (!trimmedName) {
      // If name is empty, delete the map if it's new or revert to original name
      const map = maps.find(m => m.id === mapId);
      if (!map.name) {
        // New map with no name, delete it
        try {
          await deleteMap(mapId);
          setMaps(maps.filter(m => m.id !== mapId));
          if (selectedMapId === mapId) {
            setSelectedMapId(null);
          }
        } catch (err) {
          console.error('Error deleting empty map:', err);
        }
      }
      setEditingMapId(null);
      setEditingName('');
      return;
    }

    try {
      await updateMap(mapId, { name: trimmedName });
      setMaps(maps.map(m => m.id === mapId ? { ...m, name: trimmedName } : m));
    } catch (err) {
      console.error('Error updating map name:', err);
      setError('Failed to update map name');
    }

    setEditingMapId(null);
    setEditingName('');
  };

  const handleCancelEditing = (mapId) => {
    const map = maps.find(m => m.id === mapId);

    // If it's a new map with no name, delete it
    if (!map.name) {
      deleteMap(mapId).catch(err => console.error('Error deleting cancelled map:', err));
      setMaps(maps.filter(m => m.id !== mapId));
      if (selectedMapId === mapId) {
        setSelectedMapId(null);
      }
    }

    setEditingMapId(null);
    setEditingName('');
  };

  const handleDeleteMap = async () => {
    if (!selectedMapId) return;

    const selectedMap = maps.find(m => m.id === selectedMapId);
    if (!selectedMap || selectedMap.userRole !== ROLES.OWNER) return;

    if (!window.confirm('Are you sure you want to delete this map? All places will be deleted.')) {
      return;
    }

    try {
      setDeleting(true);
      await deleteMap(selectedMapId);

      const updatedMaps = maps.filter(m => m.id !== selectedMapId);
      setMaps(updatedMaps);

      if (selectedMapId === currentMapId && updatedMaps.length > 0) {
        onMapSelect(updatedMaps[0].id, updatedMaps[0].userRole);
      }

      setSelectedMapId(null);
    } catch (err) {
      console.error('Error deleting map:', err);
      setError('Failed to delete map');
    } finally {
      setDeleting(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case ROLES.OWNER:
        return <LayersIcon fontSize="small" />;
      case ROLES.EDITOR:
        return <EditIcon fontSize="small" />;
      case ROLES.VIEWER:
        return <VisibilityIcon fontSize="small" />;
      default:
        return null;
    }
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
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error" align="center" sx={{ py: 5 }}>
              {error}
            </Typography>
          ) : maps.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 5 }}>
              No maps found
            </Typography>
          ) : (
            <List>
              {maps.map((map) => (
                <ListItem
                  key={map.id}
                  onClick={() => handleMapClick(map)}
                  sx={{
                    bgcolor: map.id === selectedMapId ? 'primary.light' : map.id === currentMapId ? 'action.hover' : 'transparent',
                    borderRadius: 1,
                    mb: 1,
                    border: 2,
                    borderColor: map.id === selectedMapId ? 'primary.main' : 'transparent',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: map.id === selectedMapId ? 'primary.light' : 'action.hover',
                    },
                  }}
                  secondaryAction={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getRoleIcon(map.userRole)}
                    </Box>
                  }
                >
                  <ListItemText
                    primary={
                      editingMapId === map.id ? (
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
                        />
                      ) : (
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            if (map.userRole === ROLES.OWNER) {
                              handleStartEditing(map);
                            }
                          }}
                        >
                          <Typography>{map.name || 'Untitled Map'}</Typography>
                          {map.id === currentMapId && (
                            <Chip label="Current" size="small" color="primary" />
                          )}
                        </Box>
                      )
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>

        <Divider />

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, p: 1.5 }}>
          <IconButton
            onClick={handleCreateMap}
            disabled={loading}
            title="Create new map"
            color="primary"
          >
            <AddIcon />
          </IconButton>
          <IconButton
            onClick={handleDeleteMap}
            disabled={!selectedMapId || deleting || loading || maps.find(m => m.id === selectedMapId)?.userRole !== ROLES.OWNER}
            title="Delete selected map"
            color="error"
          >
            <DeleteIcon />
          </IconButton>
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