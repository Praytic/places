import React, { useState, useRef, useEffect } from 'react';
import { ROLES } from '../services/MapsService';

const ControlPanel = ({
  selectedPlace,
  onAddPlace,
  onRemovePlace,
  onChangeGroup,
  onToggleLayer,
  availableLayers,
  hiddenLayers,
  groups,
  userRole
}) => {
  const [showLayerToggle, setShowLayerToggle] = useState(false);
  const layerToggleRef = useRef(null);

  // Handle click outside for layer toggle
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (layerToggleRef.current && !layerToggleRef.current.contains(event.target)) {
        setShowLayerToggle(false);
      }
    };

    if (showLayerToggle) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLayerToggle]);

  const handleLayerToggle = (layer) => {
    onToggleLayer(layer);
  };

  const isReadOnly = userRole === ROLES.VIEWER;

  return (
    <div className="control-panel">
      <div className="control-buttons">
        <button
          className="control-button add-button"
          onClick={() => {
            onAddPlace();
            setShowLayerToggle(false);
          }}
          disabled={isReadOnly}
          title={isReadOnly ? "View-only access" : "Add Place"}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>

        <button
          className={`control-button remove-button ${!selectedPlace || isReadOnly ? 'disabled' : ''}`}
          onClick={() => {
            onRemovePlace();
            setShowLayerToggle(false);
          }}
          disabled={!selectedPlace || isReadOnly}
          title={isReadOnly ? "View-only access" : "Remove Place"}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3,6 5,6 21,6"></polyline>
            <path d="m19,6v14a2,2 0 01-2,2H7a2,2 0 01-2-2V6m3,0V4a2,2 0 012-2h4a2,2 0 012,2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>

        <button
          className="control-button layer-button"
          onClick={() => setShowLayerToggle(!showLayerToggle)}
          title="Toggle Layers"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12,2 2,7 12,12 22,7 12,2"></polygon>
            <polyline points="2,17 12,22 22,17"></polyline>
            <polyline points="2,12 12,17 22,12"></polyline>
          </svg>
        </button>
      </div>

      {showLayerToggle && (
        <div className="dropdown-panel" ref={layerToggleRef}>
          <div className="dropdown-header">Toggle Layers</div>
          {availableLayers.map(layer => (
            <button
              key={layer}
              className={`dropdown-item toggle-item ${hiddenLayers.has(layer) ? 'hidden' : 'visible'}`}
              onClick={() => handleLayerToggle(layer)}
            >
              <span className="toggle-icon">
                {hiddenLayers.has(layer) ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-.722-3.25"></path>
                    <path d="m2.036 12.322a1 1 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"></path>
                    <path d="m15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path d="m2 2 20 20"></path>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.036 12.322a1 1 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"></path>
                    <path d="m15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                )}
              </span>
              {layer}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ControlPanel;