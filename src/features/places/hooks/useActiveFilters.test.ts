import { renderHook, act, waitFor } from '@testing-library/react';
import { useActiveFilters } from './useActiveFilters';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useActiveFilters', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should initialize with default filters', () => {
    const { result } = renderHook(() => useActiveFilters());

    expect(result.current.activeFilters).toBeInstanceOf(Set);
    expect(result.current.activeFilters.has('favorite')).toBe(true);
    expect(result.current.activeFilters.has('want to go')).toBe(true);
  });

  it('should toggle filter on and off', async () => {
    const { result } = renderHook(() => useActiveFilters());

    // Toggle off 'favorite'
    act(() => {
      result.current.toggleFilter('favorite');
    });

    expect(result.current.activeFilters.has('favorite')).toBe(false);
    expect(result.current.activeFilters.has('want to go')).toBe(true);

    // Toggle 'favorite' back on
    act(() => {
      result.current.toggleFilter('favorite');
    });

    expect(result.current.activeFilters.has('favorite')).toBe(true);
  });

  it('should persist filters to localStorage', async () => {
    const { result } = renderHook(() => useActiveFilters());

    act(() => {
      result.current.toggleFilter('favorite');
    });

    // Wait for useEffect to run
    await waitFor(() => {
      const storedFilters = localStorageMock.getItem('activeFilters');
      expect(storedFilters).toBeDefined();
    });

    const storedFilters = localStorageMock.getItem('activeFilters');
    const parsedFilters = JSON.parse(storedFilters!);
    expect(Array.isArray(parsedFilters)).toBe(true);
    expect(parsedFilters.includes('want to go')).toBe(true);
    expect(parsedFilters.includes('favorite')).toBe(false);
  });

  it('should load filters from localStorage on mount', () => {
    // Set up localStorage with custom filters
    const customFilters = ['favorite'];
    localStorageMock.setItem('activeFilters', JSON.stringify(customFilters));

    const { result } = renderHook(() => useActiveFilters());

    expect(result.current.activeFilters.has('favorite')).toBe(true);
    expect(result.current.activeFilters.has('want to go')).toBe(false);
    expect(result.current.activeFilters.size).toBe(1);
  });
});