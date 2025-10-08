import { useState, useCallback } from 'react';
import { Place } from '../types';

/**
 * Custom hook for managing emoji picker dialog state
 *
 * Controls the visibility of the emoji picker modal and tracks
 * which place is currently being edited. Provides stable callback
 * functions for opening and closing the picker.
 *
 * @returns {Object} Emoji picker state and controls
 * @returns {boolean} showEmojiPicker - Whether the picker dialog is visible
 * @returns {Place | null} emojiPickerPlace - The place being edited
 * @returns {Function} openEmojiPicker - Open picker for a specific place
 * @returns {Function} closeEmojiPicker - Close picker and clear selection
 *
 * @example
 * ```tsx
 * const { showEmojiPicker, emojiPickerPlace, openEmojiPicker, closeEmojiPicker } = useEmojiPicker();
 *
 * return (
 *   <>
 *     <button onClick={() => openEmojiPicker(place)}>Change Emoji</button>
 *     <EmojiDialog open={showEmojiPicker} place={emojiPickerPlace} onClose={closeEmojiPicker} />
 *   </>
 * );
 * ```
 */
export const useEmojiPicker = (): {
  showEmojiPicker: boolean;
  emojiPickerPlace: Place | null;
  openEmojiPicker: (place: Place) => void;
  closeEmojiPicker: () => void;
} => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerPlace, setEmojiPickerPlace] = useState<Place | null>(null);

  const openEmojiPicker = useCallback((place: Place) => {
    setEmojiPickerPlace(place);
    setShowEmojiPicker(true);
  }, []);

  const closeEmojiPicker = useCallback(() => {
    setShowEmojiPicker(false);
    setEmojiPickerPlace(null);
  }, []);

  return {
    showEmojiPicker,
    emojiPickerPlace,
    openEmojiPicker,
    closeEmojiPicker,
  };
};
