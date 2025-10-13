import { renderHook, act } from '@testing-library/react';
import { Timestamp } from 'firebase/firestore';
import { useEmojiPicker } from './useEmojiPicker';
import { Place } from '../types';

describe('useEmojiPicker', () => {
  const mockPlace: Place = new Place(
    'map-1',
    'Test Place',
    '📍',
    'favorite',
    {
      location: { lat: 0, lng: 0 },
    },
    '123 Main St, City, Country',
    'ChIJplace123',
    ['restaurant', 'food'],
    'place-1',
    Timestamp.now(),
    Timestamp.now()
  );

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

    const place1 = new Place(
      'map-1',
      'Place 1',
      '📍',
      'favorite',
      { location: { lat: 0, lng: 0 } },
      '123 Main St',
      'ChIJplace1',
      ['point_of_interest'],
      'place-1',
      Timestamp.now(),
      Timestamp.now()
    );
    const place2 = new Place(
      'map-2',
      'Place 2',
      '📍',
      'favorite',
      { location: { lat: 0, lng: 0 } },
      '456 Oak Ave',
      'ChIJplace2',
      ['point_of_interest'],
      'place-2',
      Timestamp.now(),
      Timestamp.now()
    );

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
