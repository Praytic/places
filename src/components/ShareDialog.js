import React, { useState, useEffect } from 'react';
import { getUserMaps, shareMapWithUser, unshareMapWithUser, getMapCollaborators, ROLES } from '../services/MapsService';

const ShareDialog = ({ userEmail, mapId = null, onClose }) => {
  const [email, setEmail] = useState('');
  const [sharedWithList, setSharedWithList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentMapId, setCurrentMapId] = useState(null);

  useEffect(() => {
    const loadMapAndCollaborators = async () => {
      try {
        let targetMapId = mapId;

        // If mapId is not provided, get user's first owned map
        if (!targetMapId) {
          const maps = await getUserMaps(userEmail);
          if (maps.length > 0 && maps[0].userRole === ROLES.OWNER) {
            targetMapId = maps[0].id;
          }
        }

        if (targetMapId) {
          setCurrentMapId(targetMapId);

          // Load collaborators for this map
          const collaborators = await getMapCollaborators(targetMapId);
          const nonOwners = collaborators
            .filter(c => c.userId !== userEmail)
            .map(c => c.userId);
          setSharedWithList(nonOwners);
        }
      } catch (err) {
        console.error('Error loading map and collaborators:', err);
      }
    };

    loadMapAndCollaborators();
  }, [userEmail, mapId]);

  const handleShare = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (email === userEmail) {
      setError('You cannot share with yourself');
      return;
    }

    if (sharedWithList.includes(email)) {
      setError('Already shared with this user');
      return;
    }

    if (!currentMapId) {
      setError('No map to share');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await shareMapWithUser(currentMapId, email, ROLES.VIEWER);
      setSuccess(`Successfully shared map with ${email}`);
      setEmail('');

      // Reload collaborators
      const collaborators = await getMapCollaborators(currentMapId);
      const nonOwners = collaborators
        .filter(c => c.userId !== userEmail)
        .map(c => c.userId);
      setSharedWithList(nonOwners);

      // Close dialog after successful share
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      console.error('Error sharing:', err);
      setError('Failed to share. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveShare = async (collaboratorEmail) => {
    if (!currentMapId) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await unshareMapWithUser(currentMapId, collaboratorEmail);
      setSuccess(`Removed access for ${collaboratorEmail}`);

      // Reload collaborators
      const collaborators = await getMapCollaborators(currentMapId);
      const nonOwners = collaborators
        .filter(c => c.userId !== userEmail)
        .map(c => c.userId);
      setSharedWithList(nonOwners);
    } catch (err) {
      console.error('Error removing share:', err);
      setError('Failed to remove access. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="share-dialog-overlay" onClick={onClose}>
      <div className="share-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="share-dialog-header">
          <h2>Share Map</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        <div className="share-dialog-content">
          <form onSubmit={handleShare} className="share-form">
            <label>Add collaborator by email:</label>
            <div className="share-input-group">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                disabled={loading}
              />
              <button type="submit" disabled={loading || !email}>
                {loading ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </form>

          {error && (
            <div className="share-message error">{error}</div>
          )}

          {success && (
            <div className="share-message success">{success}</div>
          )}

          {sharedWithList.length > 0 && (
            <div className="shared-with-list">
              <h3>Shared with:</h3>
              <ul>
                {sharedWithList.map((collaboratorEmail) => (
                  <li key={collaboratorEmail}>
                    <span>{collaboratorEmail}</span>
                    <button
                      onClick={() => handleRemoveShare(collaboratorEmail)}
                      disabled={loading}
                      className="remove-button"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareDialog;