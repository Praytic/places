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

  const handleGroupToggle = () => {
    if (selectedPlace) {
      const newGroup = selectedPlace.group === 'favorite' ? 'want to go' : 'favorite';
      onChangeGroup(selectedPlace, newGroup);
    }
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
            setShowLayerToggle(false);
          }}
          title="Add Place"
        >
          +
        </button>

        <button
          className={`control-button remove-button ${!selectedPlace ? 'disabled' : ''}`}
          onClick={() => {
            onRemovePlace();
            setShowLayerToggle(false);
          }}
          disabled={!selectedPlace}
          title="Remove Place"
        >
          −
        </button>

        <button
          className={`control-button group-button ${!selectedPlace ? 'disabled' : ''} ${selectedPlace?.group === 'favorite' ? 'favorite' : 'want-to-go'}`}
          onClick={handleGroupToggle}
          disabled={!selectedPlace}
          title={selectedPlace?.group === 'favorite' ? 'Move to Want to go' : 'Add to Favorites'}
        >
          <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>

        <button
          className="control-button layer-button"
          onClick={() => setShowLayerToggle(!showLayerToggle)}
          title="Toggle Layers"
        >
          ☰
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