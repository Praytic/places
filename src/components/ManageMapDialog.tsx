import React, {useEffect, useState} from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  TextField,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {createMap, deleteMap, getUserMap, updateMap} from '../services/MapsService';
import {UserMap, UserRole} from "../shared/types";
import {User} from "firebase/auth";

type CollaboratorEntry = {
  collaborator: string;
  role: UserRole;
};

interface ManageMapDialogProps {
  userMap?: UserMap;
  user: User;
  onClose: () => void;
  onMapCreated?: (userMap: UserMap) => void;
  onMapEdited?: (userMap: UserMap) => void;
  onMapDeleted?: () => void;
}

const ManageMapDialog: React.FC<ManageMapDialogProps> = ({
                                                           userMap,
                                                           user,
                                                           onClose,
                                                           onMapCreated,
                                                           onMapEdited,
                                                           onMapDeleted
                                                         }) => {
  const [collaborators, setCollaborators] = useState<CollaboratorEntry[]>([]);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newCollaborator, setNewCollaborator] = useState('');
  const [newName, setNewName] = useState<string>(userMap?.name ?? 'My Places');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userMap) {
      const collaboratorEntries: CollaboratorEntry[] = Object.entries(userMap.collaborators).map(([email, role]) => ({
        collaborator: email,
        role: role
      }));
      setCollaborators(collaboratorEntries);
    }
  }, [userMap]);

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollaborator || !newCollaborator.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (newCollaborator === user.email) {
      setError('You cannot share with yourself');
      return;
    }

    if (collaborators.some((item: CollaboratorEntry) => item.collaborator === newCollaborator)) {
      setError('Email already added');
      return;
    }

    setCollaborators([...collaborators, {collaborator: newCollaborator, role: UserRole.VIEW}]);
    setNewCollaborator('');
    setError(null);
  };

  const handleEmailChange = (changingEntry: CollaboratorEntry, email: string) => {
    setCollaborators(collaborators.map((entry: CollaboratorEntry) =>
      entry.collaborator === changingEntry.collaborator ? {...entry, collaborator: email} : entry
    ));
  };

  const handleToggleRole = (changingEntry: CollaboratorEntry, currentRole: UserRole) => {
    const newRole = currentRole === UserRole.EDIT ? UserRole.VIEW : UserRole.EDIT;
    setCollaborators(collaborators.map((entry: CollaboratorEntry) =>
      entry.collaborator === changingEntry.collaborator ? {...entry, role: newRole} : entry
    ));
  };

  const handleRemoveEmail = (removingEntry: CollaboratorEntry) => {
    setCollaborators(collaborators.filter((entry: CollaboratorEntry) => entry.collaborator !== removingEntry.collaborator));
  };

  const handleSave = async () => {
    try {
      setError(null);

      // Convert collaborators array to Record format
      const collaboratorsRecord: Record<string, UserRole> = {};
      collaborators.forEach(entry => {
        collaboratorsRecord[entry.collaborator] = entry.role;
      });

      if (userMap) {
        setUpdating(true);
        await updateMap(userMap.id, {
          name: newName.trim(),
          collaborators: collaboratorsRecord
        });
        const updatedMap = await getUserMap(userMap.id);
        onMapEdited && onMapEdited(updatedMap);
      } else {
        setCreating(true);
        const createdMap = await createMap(
          {name: newName.trim(), collaborators: collaboratorsRecord},
          user.email!
        );
        onMapCreated && onMapCreated(createdMap);
      }

      onClose();
    } catch (err) {
      setError(`Failed to ${userMap ? 'update' : 'create'} map. Please try again.`);
    } finally {
      setCreating(false);
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleDelete = async () => {
    if (!userMap) return;

    if (!window.confirm(`Are you sure you want to delete "${userMap.name}"? This will also delete all places in this map.`)) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);

      await deleteMap(userMap.id);

      onMapDeleted && onMapDeleted();
      onClose();
    } catch (err) {
      setError(`Failed to delete map. Please try again.`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={true} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        {userMap ? 'Edit Map' : 'Create New Map'}
        <IconButton onClick={handleCancel} size="small">
          <CloseIcon/>
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box>
          <Typography variant="body2" sx={{mb: 1, fontWeight: 500}}>
            Map name:
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter map name"
            disabled={creating || updating}
            autoFocus
          />
        </Box>

        <Box sx={{mt: 3}}>
          <Typography variant="body2" sx={{mb: 1, fontWeight: 500}}>
            Add collaborator by email:
          </Typography>

          <List disablePadding>
            {collaborators.map((entry: CollaboratorEntry, index: number) => (
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
                  value={entry.collaborator}
                  onChange={(e) => handleEmailChange({
                    collaborator: entry.collaborator,
                    role: entry.role
                  }, e.target.value)}
                  placeholder="email@example.com"
                  disabled={creating || updating}
                />
                <IconButton
                  size="small"
                  onClick={() => handleToggleRole({collaborator: entry.collaborator, role: entry.role}, entry.role)}
                  disabled={creating || updating}
                  title={entry.role === UserRole.EDIT ? 'Switch to viewer' : 'Switch to editor'}
                >
                  {entry.role === UserRole.EDIT ? <EditIcon/> : <VisibilityIcon/>}
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleRemoveEmail({collaborator: entry.collaborator, role: entry.role})}
                  disabled={creating || updating}
                  title="Remove"
                >
                  <DeleteIcon/>
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
                value={newCollaborator}
                onChange={(e) => setNewCollaborator(e.target.value)}
                placeholder="email@example.com"
                disabled={creating || updating}
              />
              <Button
                type="submit"
                variant="outlined"
                disabled={creating || updating || !newCollaborator}
                sx={{minWidth: 80}}
              >
                Add
              </Button>
            </ListItem>
          </List>
        </Box>

        {error && (
          <Alert severity="error" sx={{mt: 2}} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <Divider/>

      <Box sx={{display: 'flex', justifyContent: 'space-between', gap: 1, p: 1.5}}>
        {userMap && (
          <Button
            onClick={handleDelete}
            disabled={creating || deleting || updating}
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon/>}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        )}
        <Box sx={{display: 'flex', gap: 1, ml: 'auto'}}>
          <Button
            onClick={handleCancel}
            disabled={creating || deleting || updating}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={creating || deleting || updating || !newName.trim()}
            variant="contained"
          >
            {creating ? 'Creating...' : (updating ? 'Saving...' : (userMap ? 'Save' : 'Create'))}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default ManageMapDialog;
