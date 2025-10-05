import React, { useState } from 'react';
import { createMap, ROLES } from '../services/MapsService';
import ShareDialog from './ShareDialog';

const CreateMapDialog = ({ userEmail, onMapCreated, onClose }) => {
  const [mapName, setMapName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdMapId, setCreatedMapId] = useState(null);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const handleCreate = async () => {
    const trimmedName = mapName.trim();
    if (!trimmedName) {
      return;
    }

    try {
      setCreating(true);
      const newMap = await createMap(userEmail, trimmedName);
      setCreatedMapId(newMap.id);
      setShowShareDialog(true);
    } catch (err) {
      console.error('Error creating map:', err);
      alert('Failed to create map. Please try again.');
      setCreating(false);
    }
  };

  const handleShareDialogClose = () => {
    setShowShareDialog(false);
    if (createdMapId) {
      onMapCreated(createdMapId, ROLES.OWNER);
    }
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (showShareDialog && createdMapId) {
    return (
      <ShareDialog
        userEmail={userEmail}
        mapId={createdMapId}
        onClose={handleShareDialogClose}
      />
    );
  }

  return (
    <div className="share-dialog-overlay" onClick={handleCancel}>
      <div className="share-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="share-dialog-header">
          <h2>Create New Map</h2>
          <button onClick={handleCancel} className="close-button">×</button>
        </div>

        <div className="share-dialog-content">
          <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="share-form">
            <label>Map name:</label>
            <div className="share-input-group">
              <input
                type="text"
                value={mapName}
                onChange={(e) => setMapName(e.target.value)}
                placeholder="Enter map name"
                disabled={creating}
                autoFocus
              />
            </div>
          </form>
        </div>

        <div className="account-menu-divider"></div>

        <div className="manage-maps-footer">
          <button
            className="footer-button"
            onClick={handleCancel}
            disabled={creating}
            title="Cancel"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <button
            className="footer-button"
            onClick={handleCreate}
            disabled={creating || !mapName.trim()}
            title={creating ? "" : "Create map"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateMapDialog;