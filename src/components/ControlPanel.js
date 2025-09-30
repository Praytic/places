import React, { useState } from 'react';

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
          onClick={onAddPlace}
        >
          ➕ Add Place
        </button>

        <button
          className={`control-button remove-button ${!selectedPlace ? 'disabled' : ''}`}
          onClick={onRemovePlace}
          disabled={!selectedPlace}
        >
          ➖ Remove Place
        </button>

        <button
          className={`control-button group-button ${!selectedPlace ? 'disabled' : ''}`}
          onClick={() => setShowGroupSelector(!showGroupSelector)}
          disabled={!selectedPlace}
        >
          🏷️ Change Group
        </button>

        <button
          className="control-button layer-button"
          onClick={() => setShowLayerToggle(!showLayerToggle)}
        >
          👁️ Layers
        </button>
      </div>

      {showGroupSelector && selectedPlace && (
        <div className="dropdown-panel">
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
        <div className="dropdown-panel">
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