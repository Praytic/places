import React, { useState, useRef, useEffect } from 'react';

const ControlPanel = ({
  selectedPlace,
  onAddPlace,
  onRemovePlace,
  onChangeGroup,
  onToggleLayer,
  availableLayers,
  hiddenLayers,
  groups
}) => {
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [showLayerToggle, setShowLayerToggle] = useState(false);
  const groupSelectorRef = useRef(null);
  const layerToggleRef = useRef(null);

  // Handle click outside for group selector
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (groupSelectorRef.current && !groupSelectorRef.current.contains(event.target)) {
        setShowGroupSelector(false);
      }
    };

    if (showGroupSelector) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showGroupSelector]);

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

  const handleGroupChange = (newGroup) => {
    if (selectedPlace) {
      onChangeGroup(selectedPlace, newGroup);
    }
    setShowGroupSelector(false);
  };

  const handleLayerToggle = (layer) => {
    onToggleLayer(layer);
  };

  return (
    <div className="control-panel">
      <div className="control-buttons">
        <button
          className="control-button add-button"
          onClick={() => {
            onAddPlace();
            setShowGroupSelector(false);
            setShowLayerToggle(false);
          }}
        >
          ➕ Add Place
        </button>

        <button
          className={`control-button remove-button ${!selectedPlace ? 'disabled' : ''}`}
          onClick={() => {
            onRemovePlace();
            setShowGroupSelector(false);
            setShowLayerToggle(false);
          }}
          disabled={!selectedPlace}
        >
          ➖ Remove Place
        </button>

        <button
          className={`control-button group-button ${!selectedPlace ? 'disabled' : ''}`}
          onClick={() => {
            setShowGroupSelector(!showGroupSelector);
            setShowLayerToggle(false);
          }}
          disabled={!selectedPlace}
        >
          🏷️ Change Group
        </button>

        <button
          className="control-button layer-button"
          onClick={() => {
            setShowLayerToggle(!showLayerToggle);
            setShowGroupSelector(false);
          }}
        >
          👁️ Layers
        </button>
      </div>

      {showGroupSelector && selectedPlace && (
        <div className="dropdown-panel" ref={groupSelectorRef}>
          <div className="dropdown-header">Select Group for "{selectedPlace.name}"</div>
          {groups.map(group => (
            <button
              key={group}
              className={`dropdown-item ${selectedPlace.group === group ? 'active' : ''}`}
              onClick={() => handleGroupChange(group)}
            >
              {group}
            </button>
          ))}
        </div>
      )}

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
                {hiddenLayers.has(layer) ? '👁️‍🗨️' : '👁️'}
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