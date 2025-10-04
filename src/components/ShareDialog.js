import React, { useState, useEffect } from 'react';
import PlacesService from '../services/PlacesService';

const ShareDialog = ({ userEmail, onClose }) => {
  const [email, setEmail] = useState('');
  const [sharedWithList, setSharedWithList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loadSharedWithList = async () => {
    try {
      const list = await PlacesService.getSharedWithUsers(userEmail);
      setSharedWithList(list);
    } catch (err) {
      console.error('Error loading shared with list:', err);
    }
  };

  useEffect(() => {
    loadSharedWithList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

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

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await PlacesService.shareAllPlacesWithUser(userEmail, email);
      setSuccess(`Successfully shared with ${email}`);
      setEmail('');
      await loadSharedWithList();
    } catch (err) {
      console.error('Error sharing:', err);
      setError('Failed to share. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveShare = async (collaboratorEmail) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await PlacesService.unshareAllPlacesWithUser(userEmail, collaboratorEmail);
      setSuccess(`Removed access for ${collaboratorEmail}`);
      await loadSharedWithList();
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
          <h2>Share Places</h2>
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