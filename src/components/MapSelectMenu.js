import React, { useState, useRef } from 'react';
import {
  Select,
  MenuItem,
  FormControl,
  Box,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  TextField,
  CircularProgress,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ManageMapDialog from './ManageMapDialog';
import { deleteMap, updateMap, ROLES } from '../services/MapsService';

const MapSelectMenu = ({
  userEmail,
  userMaps,
  currentMapId,
  onMapSelect,
  onMapCreated,
  anchorEl,
  open,
  onClose,
  visibleMapIds,
  onMapVisibilityToggle,
  onMapsUpdated
}) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const pendingCreateRef = useRef(false);
  const [deleting, setDeleting] = useState(null);
  const [editingMapId, setEditingMapId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const handleChange = (event) => {
    const value = event.target.value;
    console.log('[MapSelectMenu] handleChange called with value:', value);

    if (value === 'create-new') {
      console.log('[MapSelectMenu] Setting pendingCreateRef=true and showCreateDialog=true');
      pendingCreateRef.current = true;
      setShowCreateDialog(true);
    } else {
      console.log('[MapSelectMenu] Selecting map:', value);
      onMapSelect(value);
    }
  };

  const handleSelectClose = () => {
    console.log('[MapSelectMenu] handleSelectClose called, pendingCreateRef.current:', pendingCreateRef.current);
    // Don't close the parent if we're opening the create dialog
    if (!pendingCreateRef.current) {
      console.log('[MapSelectMenu] Calling onClose()');
      onClose();
    } else {
      console.log('[MapSelectMenu] Skipping onClose() because pendingCreateRef=true');
    }
    pendingCreateRef.current = false;
  };

  const handleMapCreated = async (mapId) => {
    console.log('[MapSelectMenu] handleMapCreated called with mapId:', mapId);
    setShowCreateDialog(false);
    onClose();
    if (onMapCreated) {
      await onMapCreated();
    }
    // Select the newly created map
    if (mapId) {
      onMapSelect(mapId);
    }
  };

  const handleStartEditing = (e, map) => {
    e.stopPropagation();
    setEditingMapId(map.id);
    setEditingName(map.name || '');
  };

  const handleSaveMapName = async (e, mapId) => {
    if (e) e.stopPropagation();
    const trimmedName = editingName.trim();

    if (!trimmedName) {
      const map = userMaps.find(m => m.id === mapId);
      if (map && !map.name) {
        // New map with no name, delete it
        try {
          await deleteMap(mapId);
          if (onMapsUpdated) await onMapsUpdated();
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
      if (onMapsUpdated) await onMapsUpdated();
    } catch (err) {
      console.error('Error updating map name:', err);
    }

    setEditingMapId(null);
    setEditingName('');
  };

  const handleCancelEditing = (mapId) => {
    const map = userMaps.find(m => m.id === mapId);

    if (map && !map.name) {
      deleteMap(mapId)
        .then(() => onMapsUpdated && onMapsUpdated())
        .catch(err => console.error('Error deleting cancelled map:', err));
    }

    setEditingMapId(null);
    setEditingName('');
  };

  const handleDeleteMap = async (e, mapId, mapName) => {
    e.stopPropagation();
    const map = userMaps.find(m => m.id === mapId);
    if (!map || map.userRole !== ROLES.OWNER) return;

    if (!window.confirm(`Are you sure you want to delete "${mapName}"? All places will be deleted.`)) {
      return;
    }

    try {
      setDeleting(mapId);
      await deleteMap(mapId);
      if (onMapsUpdated) await onMapsUpdated();
    } catch (err) {
      console.error('Error deleting map:', err);
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleVisibility = (e, mapId) => {
    e.stopPropagation();
    if (onMapVisibilityToggle) {
      onMapVisibilityToggle(mapId);
    }
  };

  console.log('[MapSelectMenu] Rendering, showCreateDialog:', showCreateDialog, 'open:', open);

  return (
    <>
      <FormControl fullWidth>
        <Select
          value={currentMapId || ''}
          onChange={handleChange}
          open={open}
          onClose={handleSelectClose}
          onOpen={() => {}}
          MenuProps={{
            anchorEl,
            anchorOrigin: {
              vertical: 'top',
              horizontal: 'left',
            },
            transformOrigin: {
              vertical: 'bottom',
              horizontal: 'left',
            },
            PaperProps: {
              sx: {
                maxHeight: 400,
                width: 250,
              }
            }
          }}
          sx={{ display: 'none' }}
        >
          {userMaps.map((map) => (
            <MenuItem
              key={map.id}
              value={map.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                py: 1.5,
              }}
            >
              {editingMapId === map.id ? (
                <TextField
                  size="small"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={(e) => handleSaveMapName(e, map.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveMapName(e, map.id);
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
                  primary={map.name || 'Untitled Map'}
                  sx={{ flex: 1 }}
                />
              )}

              <Box sx={{ display: 'flex', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                {visibleMapIds && (
                  <Tooltip title={visibleMapIds.has(map.id) ? "Hide markers" : "Show markers"}>
                    <IconButton
                      size="small"
                      onClick={(e) => handleToggleVisibility(e, map.id)}
                      color={visibleMapIds.has(map.id) ? "primary" : "default"}
                    >
                      {visibleMapIds.has(map.id) ? (
                        <VisibilityIcon fontSize="small" />
                      ) : (
                        <VisibilityOffIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                )}

                <Tooltip title={map.userRole === ROLES.OWNER ? "Edit name" : "Only owners can edit"}>
                  <span>
                    <IconButton
                      size="small"
                      onClick={(e) => handleStartEditing(e, map)}
                      disabled={map.userRole !== ROLES.OWNER || editingMapId === map.id}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>

                <Tooltip title={
                  map.isDefault ? "Default map cannot be deleted" :
                  map.userRole === ROLES.OWNER ? "Delete map" : "Only owners can delete"
                }>
                  <span>
                    <IconButton
                      size="small"
                      onClick={(e) => handleDeleteMap(e, map.id, map.name)}
                      disabled={map.userRole !== ROLES.OWNER || deleting === map.id || map.isDefault}
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
            </MenuItem>
          ))}

          <Divider />

          <MenuItem value="create-new">
            <ListItemIcon>
              <AddIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText primary="Create New Map" />
          </MenuItem>
        </Select>
      </FormControl>

      {showCreateDialog && (
        <ManageMapDialog
          userEmail={userEmail}
          onMapCreated={handleMapCreated}
          onClose={() => setShowCreateDialog(false)}
        />
      )}
    </>
  );
};

export default MapSelectMenu;