import React, { useState, useRef } from 'react';
import {
  Select,
  MenuItem,
  FormControl,
  Box,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CreateMapDialog from './CreateMapDialog';

const MapSelectMenu = ({
  userEmail,
  userMaps,
  currentMapId,
  onMapSelect,
  onMapCreated,
  anchorEl,
  open,
  onClose
}) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const pendingCreateRef = useRef(false);

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
            <MenuItem key={map.id} value={map.id}>
              <ListItemText primary={map.name || 'Untitled Map'} />
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
        <CreateMapDialog
          userEmail={userEmail}
          onMapCreated={handleMapCreated}
          onClose={() => setShowCreateDialog(false)}
        />
      )}
    </>
  );
};

export default MapSelectMenu;