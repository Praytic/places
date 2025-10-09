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
  Tooltip,
  SelectChangeEvent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ManageMapDialog from './ManageMapDialog';
import { deleteMap, updateMap } from '../services/MapsService';
import { PlaceMapWithRole, VisibleMapIds, UserRole } from '../shared/types/domain';

interface MapSelectMenuProps {
  userEmail: string;
  userMaps: PlaceMapWithRole[];
  currentMapId: string | null;
  onMapSelect: (mapId: string) => void;
  onMapCreated?: () => Promise<void>;
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  visibleMapIds?: VisibleMapIds;
  onMapVisibilityToggle?: (mapId: string) => void;
  onMapsUpdated?: () => Promise<void>;
}

const MapSelectMenu: React.FC<MapSelectMenuProps> = ({
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
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingMapId, setEditingMapId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleChange = (event: SelectChangeEvent) => {
    const value = event.target.value;

    if (value === 'create-new') {
      pendingCreateRef.current = true;
      setShowCreateDialog(true);
    } else {
      onMapSelect(value);
    }
  };

  const handleSelectClose = () => {
    // Don't close the parent if we're opening the create dialog
    if (!pendingCreateRef.current) {
      onClose();
    }
    pendingCreateRef.current = false;
  };

  const handleMapCreated = async (mapId?: string) => {
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

  const handleStartEditing = (e: React.MouseEvent, map: PlaceMapWithRole) => {
    e.stopPropagation();
    setEditingMapId(map.id);
    setEditingName(map.name || '');
  };

  const handleSaveMapName = async (e: React.FocusEvent | React.KeyboardEvent | null, mapId: string) => {
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

  const handleCancelEditing = (mapId: string) => {
    const map = userMaps.find(m => m.id === mapId);

    if (map && !map.name) {
      deleteMap(mapId)
        .then(() => onMapsUpdated && onMapsUpdated())
        .catch(err => console.error('Error deleting cancelled map:', err));
    }

    setEditingMapId(null);
    setEditingName('');
  };

  const handleDeleteMap = async (e: React.MouseEvent, mapId: string, mapName: string) => {
    e.stopPropagation();
    const map = userMaps.find(m => m.id === mapId);
    if (!map || map.userRole !== UserRole.OWNER) return;

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

  const handleToggleVisibility = (e: React.MouseEvent, mapId: string) => {
    e.stopPropagation();
    if (onMapVisibilityToggle) {
      onMapVisibilityToggle(mapId);
    }
  };

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
                width: { xs: 250, md: 320 },
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
                py: { xs: 1.5, md: 2 },
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
                      sx={{ p: { xs: 0.5, md: 1 } }}
                    >
                      {visibleMapIds.has(map.id) ? (
                        <VisibilityIcon sx={{ fontSize: { xs: 18, md: 20 } }} />
                      ) : (
                        <VisibilityOffIcon sx={{ fontSize: { xs: 18, md: 20 } }} />
                      )}
                    </IconButton>
                  </Tooltip>
                )}

                <Tooltip title={map.userRole === UserRole.OWNER ? "Edit name" : "Only owners can edit"}>
                  <span>
                    <IconButton
                      size="small"
                      onClick={(e) => handleStartEditing(e, map)}
                      disabled={map.userRole !== UserRole.OWNER || editingMapId === map.id}
                      sx={{ p: { xs: 0.5, md: 1 } }}
                    >
                      <EditIcon sx={{ fontSize: { xs: 18, md: 20 } }} />
                    </IconButton>
                  </span>
                </Tooltip>

                <Tooltip title={
                  map.isDefault ? "Default map cannot be deleted" :
                  map.userRole === UserRole.OWNER ? "Delete map" : "Only owners can delete"
                }>
                  <span>
                    <IconButton
                      size="small"
                      onClick={(e) => handleDeleteMap(e, map.id, map.name)}
                      disabled={map.userRole !== UserRole.OWNER || deleting === map.id || map.isDefault}
                      sx={{ p: { xs: 0.5, md: 1 } }}
                    >
                      {deleting === map.id ? (
                        <CircularProgress size={20} />
                      ) : (
                        <DeleteIcon sx={{ fontSize: { xs: 18, md: 20 } }} />
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