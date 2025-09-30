import React, { useState, useRef, useEffect } from 'react';

const PlaceSearch = ({ onPlaceSelect, onClose }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const handleInputChange = async (e) => {
        const value = e.target.value;
        setQuery(value);

        if (value.length > 2 && window.google) {
            setIsLoading(true);
            try {
                const { AutocompleteSuggestion } = await window.google.maps.importLibrary('places');

                const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
                    input: value,
                    includedPrimaryTypes: ['establishment']
                });

                setSuggestions(suggestions || []);
            } catch (error) {
                console.error('Failed to fetch suggestions:', error);
                setSuggestions([]);
            } finally {
                setIsLoading(false);
            }
        } else {
            setSuggestions([]);
        }
    };

    const handleSuggestionClick = async (suggestion) => {
        setIsLoading(true);
        try {
            const place = suggestion.placePrediction.toPlace();

            await place.fetchFields({
                fields: ['displayName', 'location', 'types', 'id', 'formattedAddress']
            });

            onPlaceSelect({
                name: place.displayName,
                geometry: { location: place.location },
                types: place.types,
                place_id: place.id,
                formatted_address: place.formattedAddress,
                group: 'want to go'
            });
            onClose();
        } catch (error) {
            console.error('Failed to fetch place details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <div className="search-overlay">
            <div className="search-container">
                <div className="search-header">
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Search for places..."
                        className="search-input"
                    />
                    <button onClick={onClose} className="close-button">×</button>
                </div>

                {isLoading && <div className="loading">Searching...</div>}

                {suggestions.length > 0 && (
                    <div className="suggestions-list">
                        {suggestions.map((suggestion) => {
                            const prediction = suggestion.placePrediction;
                            return (
                                <div
                                    key={prediction.placeId}
                                    className="suggestion-item"
                                    onClick={() => handleSuggestionClick(suggestion)}
                                >
                                    <div className="suggestion-name">
                                        {prediction.mainText.text}
                                    </div>
                                    <div className="suggestion-address">
                                        {prediction.secondaryText?.text}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlaceSearch;
