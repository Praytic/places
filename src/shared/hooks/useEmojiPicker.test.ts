import { renderHook, act } from '@testing-library/react';
import { useEmojiPicker } from './useEmojiPicker';
import { Place } from '../types';

describe('useEmojiPicker', () => {
  const mockPlace: Place = {
    id: '1',
    mapId: 'map1',
    name: 'Test Place',
    emoji: '📍',
    group: 'favorite',
    geometry: {
      location: { lat: 0, lng: 0 },
    },
    createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
    updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
  };

  it('should initialize with emoji picker closed', () => {
    const { result } = renderHook(() => useEmojiPicker());

    expect(result.current.showEmojiPicker).toBe(false);
    expect(result.current.emojiPickerPlace).toBeNull();
  });

  it('should open emoji picker with a place', () => {
    const { result } = renderHook(() => useEmojiPicker());

    act(() => {
      result.current.openEmojiPicker(mockPlace);
    });

    expect(result.current.showEmojiPicker).toBe(true);
    expect(result.current.emojiPickerPlace).toEqual(mockPlace);
  });

  it('should close emoji picker and clear place', () => {
    const { result } = renderHook(() => useEmojiPicker());

    // First open the picker
    act(() => {
      result.current.openEmojiPicker(mockPlace);
    });

    expect(result.current.showEmojiPicker).toBe(true);
    expect(result.current.emojiPickerPlace).toEqual(mockPlace);

    // Then close it
    act(() => {
      result.current.closeEmojiPicker();
    });

    expect(result.current.showEmojiPicker).toBe(false);
    expect(result.current.emojiPickerPlace).toBeNull();
  });

  it('should allow opening emoji picker with different places', () => {
    const { result } = renderHook(() => useEmojiPicker());

    const place1 = { ...mockPlace, id: '1', name: 'Place 1' };
    const place2 = { ...mockPlace, id: '2', name: 'Place 2' };

    act(() => {
      result.current.openEmojiPicker(place1);
    });

    expect(result.current.emojiPickerPlace).toEqual(place1);

    act(() => {
      result.current.openEmojiPicker(place2);
    });

    expect(result.current.emojiPickerPlace).toEqual(place2);
  });
});