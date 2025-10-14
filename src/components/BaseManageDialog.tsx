import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  TextField,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';

export interface BaseManageDialogProps {
  onClose: () => void;
}

export interface BaseManageDialogState {
  name: string;
  error: string | null;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
}

export interface BaseManageDialogConfig {
  title: string;
  initialName: string;
  canDelete: boolean;
  showCollaborators: boolean;
}

export const useBaseManageDialog = (
  initialName: string
): [BaseManageDialogState, {
  setName: (name: string) => void;
  setError: (error: string | null) => void;
  setCreating: (creating: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setDeleting: (deleting: boolean) => void;
}] => {
  const [name, setName] = useState<string>(initialName);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return [
    { name, error, creating, updating, deleting },
    { setName, setError, setCreating, setUpdating, setDeleting }
  ];
};

interface BaseDialogLayoutProps {
  config: BaseManageDialogConfig;
  state: BaseManageDialogState;
  onNameChange: (name: string) => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
  setError: (error: string | null) => void;
  children?: React.ReactNode;
}

export const BaseDialogLayout: React.FC<BaseDialogLayoutProps> = ({
  config,
  state,
  onNameChange,
  onSave,
  onCancel,
  onDelete,
  setError,
  children
}) => {
  const { title, canDelete } = config;
  const { name, error, creating, updating, deleting } = state;

  return (
    <Dialog open={true} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {title}
        <IconButton onClick={onCancel} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
            Map name:
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Enter map name"
            disabled={creating || updating}
            autoFocus
          />
        </Box>

        {children}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <Divider />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, p: 1.5 }}>
        {canDelete && onDelete && (
          <Button
            onClick={onDelete}
            disabled={creating || deleting || updating}
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        )}
        <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
          <Button
            onClick={onCancel}
            disabled={creating || deleting || updating}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={creating || deleting || updating || !name.trim()}
            variant="contained"
          >
            {creating ? 'Creating...' : (updating ? 'Saving...' : 'Save')}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};
