import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker, {EmojiStyle} from 'emoji-picker-react';

const PlaceSearch = ({ onPlaceSelect, onClose }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedPlaceData, setSelectedPlaceData] = useState(null);
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

            const placeData = {
                name: place.displayName,
                geometry: { location: place.location },
                types: place.types,
                place_id: place.id,
                formatted_address: place.formattedAddress,
                group: 'want to go'
            };

            setSelectedPlaceData(placeData);
            setShowEmojiPicker(true);
        } catch (error) {
            console.error('Failed to fetch place details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmojiSelect = (emojiObject) => {
        if (selectedPlaceData) {
            const placeWithEmoji = {
                ...selectedPlaceData,
                emoji: emojiObject.emoji
            };
            onPlaceSelect(placeWithEmoji);
            onClose();
        }
    };

    const handleEmojiCancel = () => {
        setShowEmojiPicker(false);
        setSelectedPlaceData(null);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <>
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

            {showEmojiPicker && selectedPlaceData && (
                <div className="emoji-picker-overlay">
                    <div className="emoji-picker-container">
                        <div className="emoji-picker-header">
                            <h3>Choose an emoji for {selectedPlaceData.name}</h3>
                            <button onClick={handleEmojiCancel} className="close-button">×</button>
                        </div>
                        <div className="emoji-picker-content">
                            <EmojiPicker
                                onEmojiClick={handleEmojiSelect}
                                width="100%"
                                height={400}
                                previewConfig={{showPreview: false}}
                                emojiStyle={EmojiStyle.APPLE}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PlaceSearch;
