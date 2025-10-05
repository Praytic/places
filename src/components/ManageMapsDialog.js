import React, { useState, useEffect } from 'react';
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
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" title="Owner">
            <path d="M12 2L2 7l10 5 10-5-10-5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17l10 5 10-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12l10 5 10-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case ROLES.EDITOR:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" title="Editor">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case ROLES.VIEWER:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" title="Viewer">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="share-dialog-overlay" onClick={onClose}>
        <div className="share-dialog manage-maps-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="share-dialog-header">
          <h2>Manage Maps</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        <div className="share-dialog-content">
          {loading ? (
            <div className="maps-loading">Loading maps...</div>
          ) : error ? (
            <div className="maps-error">{error}</div>
          ) : maps.length === 0 ? (
            <div className="maps-empty">No maps found</div>
          ) : (
            <div className="maps-list">
              {maps.map((map) => (
                <div
                  key={map.id}
                  className={`map-item ${map.id === selectedMapId ? 'selected' : ''} ${map.id === currentMapId ? 'active' : ''}`}
                  onClick={() => handleMapClick(map)}
                >
                  <div className="map-item-content">
                    {editingMapId === map.id ? (
                      <input
                        type="text"
                        className="map-name-input"
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
                      <span
                        className="map-name"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          if (map.userRole === ROLES.OWNER) {
                            handleStartEditing(map);
                          }
                        }}
                      >
                        {map.name || 'Untitled Map'}
                      </span>
                    )}
                    {map.id === currentMapId && (
                      <span className="map-current-badge">Current</span>
                    )}
                  </div>
                  <div className="map-role-icon">
                    {getRoleIcon(map.userRole)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="account-menu-divider"></div>

        <div className="manage-maps-footer">
          <button
            className="footer-button"
            onClick={handleCreateMap}
            disabled={loading}
            title={loading ? "" : "Create new map"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <button
            className="footer-button"
            onClick={handleDeleteMap}
            disabled={!selectedMapId || deleting || loading || maps.find(m => m.id === selectedMapId)?.userRole !== ROLES.OWNER}
            title={!selectedMapId || maps.find(m => m.id === selectedMapId)?.userRole !== ROLES.OWNER ? "" : "Delete selected map"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
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
