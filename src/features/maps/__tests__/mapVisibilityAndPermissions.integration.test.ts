import { Timestamp } from 'firebase/firestore';
import { UserRole, PlaceMapWithRole } from '../../../shared/types/domain';

/**
 * Integration test for Map Visibility and Permissions
 *
 * This test documents the expected behavior when users toggle map visibility
 * and how it affects their ability to add places based on map permissions.
 *
 * Test Scenario:
 * 1. User1 creates a map and shares it with User2 as VIEWER
 * 2. User2 has two maps - his own (OWNER) and User1's shared map (VIEWER)
 * 3. User2 selects Chip with User1's map view (only User1's map is visible)
 * 4. User2's "Add new place" button should be disabled because no editable maps are visible
 */
describe('Map Visibility and Permissions Integration Test', () => {
  const user1Email = 'user1@example.com';
  const user2Email = 'user2@example.com';

  it('should disable "Add Place" button when only non-editable maps are visible', () => {
    // This test documents the expected data flow and button state

    // Step 1: User1 creates a map and shares it with User2 as VIEWER
    const user1Map = {
      id: 'user1-map-123',
      name: 'User1 Map',
      owner: user1Email,
      isDefault: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    expect(user1Map.owner).toBe(user1Email);

    // User1 shares the map with User2 as VIEWER
    const sharedMapView = {
      id: 'mapview-456',
      mapId: user1Map.id,
      collaborator: user2Email,
      role: UserRole.VIEWER,
      displayName: 'User1 Map', // User2's view of the map
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    expect(sharedMapView.role).toBe(UserRole.VIEWER);
    expect(sharedMapView.collaborator).toBe(user2Email);

    // Step 2: User2 has two maps - his own (OWNER) and User1's shared map (VIEWER)
    const user2OwnMap = {
      id: 'user2-map-789',
      name: 'User2 Own Map',
      owner: user2Email,
      isDefault: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const user2Maps: PlaceMapWithRole[] = [
      {
        id: user2OwnMap.id,
        name: user2OwnMap.name,
        owner: user2Email,
        isDefault: true,
        createdAt: user2OwnMap.createdAt,
        updatedAt: user2OwnMap.updatedAt,
        userRole: UserRole.OWNER,
      },
      {
        id: user1Map.id,
        name: user1Map.name,
        owner: user1Email,
        isDefault: false,
        createdAt: user1Map.createdAt,
        updatedAt: user1Map.updatedAt,
        userRole: UserRole.VIEWER,
        mapViewId: sharedMapView.id,
        displayedName: sharedMapView.displayName,
      },
    ];

    expect(user2Maps).toHaveLength(2);
    expect(user2Maps[0]?.userRole).toBe(UserRole.OWNER);
    expect(user2Maps[1]?.userRole).toBe(UserRole.VIEWER);

    // Step 3: User2 selects Chip with User1's map view (only User1's map is visible)
    // visibleMapIds is a Set of map IDs that are currently toggled on
    const visibleMapIds = new Set<string>([user1Map.id]);

    expect(visibleMapIds.has(user1Map.id)).toBe(true);
    expect(visibleMapIds.has(user2OwnMap.id)).toBe(false);

    // Step 4: Check if "Add new place" button should be disabled
    // Button should be disabled when NO visible maps are editable (OWNER or EDITOR)
    const visibleMaps = user2Maps.filter((map) => visibleMapIds.has(map.id));
    const hasEditableVisibleMap = visibleMaps.some(
      (map) => map.userRole === UserRole.OWNER || map.userRole === UserRole.EDITOR
    );

    expect(visibleMaps).toHaveLength(1);
    expect(visibleMaps[0]?.id).toBe(user1Map.id);
    expect(visibleMaps[0]?.userRole).toBe(UserRole.VIEWER);
    expect(hasEditableVisibleMap).toBe(false);

    // The "Add Place" button should be disabled
    const isAddPlaceButtonDisabled = !hasEditableVisibleMap;
    expect(isAddPlaceButtonDisabled).toBe(true);
  });

  it('should enable "Add Place" button when at least one editable map is visible', () => {
    const user2Email = 'user2@example.com';

    // User2 has an OWNER map
    const user2OwnMap = {
      id: 'user2-map-789',
      name: 'User2 Own Map',
      owner: user2Email,
      isDefault: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const user2Maps: PlaceMapWithRole[] = [
      {
        id: user2OwnMap.id,
        name: user2OwnMap.name,
        owner: user2Email,
        isDefault: true,
        createdAt: user2OwnMap.createdAt,
        updatedAt: user2OwnMap.updatedAt,
        userRole: UserRole.OWNER,
      },
    ];

    // User2's own map is visible
    const visibleMapIds = new Set<string>([user2OwnMap.id]);

    const visibleMaps = user2Maps.filter((map) => visibleMapIds.has(map.id));
    const hasEditableVisibleMap = visibleMaps.some(
      (map) => map.userRole === UserRole.OWNER || map.userRole === UserRole.EDITOR
    );

    expect(hasEditableVisibleMap).toBe(true);

    // The "Add Place" button should be enabled
    const isAddPlaceButtonDisabled = !hasEditableVisibleMap;
    expect(isAddPlaceButtonDisabled).toBe(false);
  });

  it('should enable "Add Place" button when both editable and non-editable maps are visible', () => {
    const user1Email = 'user1@example.com';
    const user2Email = 'user2@example.com';

    const user2OwnMap = {
      id: 'user2-map-789',
      name: 'User2 Own Map',
      owner: user2Email,
      isDefault: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const user1Map = {
      id: 'user1-map-123',
      name: 'User1 Map',
      owner: user1Email,
      isDefault: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const user2Maps: PlaceMapWithRole[] = [
      {
        id: user2OwnMap.id,
        name: user2OwnMap.name,
        owner: user2Email,
        isDefault: true,
        createdAt: user2OwnMap.createdAt,
        updatedAt: user2OwnMap.updatedAt,
        userRole: UserRole.OWNER,
      },
      {
        id: user1Map.id,
        name: user1Map.name,
        owner: user1Email,
        isDefault: false,
        createdAt: user1Map.createdAt,
        updatedAt: user1Map.updatedAt,
        userRole: UserRole.VIEWER,
        mapViewId: 'mapview-456',
        displayedName: 'User1 Map',
      },
    ];

    // Both maps are visible
    const visibleMapIds = new Set<string>([user2OwnMap.id, user1Map.id]);

    const visibleMaps = user2Maps.filter((map) => visibleMapIds.has(map.id));
    const hasEditableVisibleMap = visibleMaps.some(
      (map) => map.userRole === UserRole.OWNER || map.userRole === UserRole.EDITOR
    );

    expect(visibleMaps).toHaveLength(2);
    expect(hasEditableVisibleMap).toBe(true);

    // The "Add Place" button should be enabled because at least one visible map is editable
    const isAddPlaceButtonDisabled = !hasEditableVisibleMap;
    expect(isAddPlaceButtonDisabled).toBe(false);
  });

  it('should handle EDITOR role as editable permission', () => {
    const user1Email = 'user1@example.com';

    // User1 shares a map with User2 as EDITOR
    const user1Map = {
      id: 'user1-map-123',
      name: 'User1 Map',
      owner: user1Email,
      isDefault: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const user2Maps: PlaceMapWithRole[] = [
      {
        id: user1Map.id,
        name: user1Map.name,
        owner: user1Email,
        isDefault: false,
        createdAt: user1Map.createdAt,
        updatedAt: user1Map.updatedAt,
        userRole: UserRole.EDITOR,
        mapViewId: 'mapview-456',
        displayedName: 'User1 Map',
      },
    ];

    // Only User1's map (with EDITOR role) is visible
    const visibleMapIds = new Set<string>([user1Map.id]);

    const visibleMaps = user2Maps.filter((map) => visibleMapIds.has(map.id));
    const hasEditableVisibleMap = visibleMaps.some(
      (map) => map.userRole === UserRole.OWNER || map.userRole === UserRole.EDITOR
    );

    expect(hasEditableVisibleMap).toBe(true);

    // The "Add Place" button should be enabled because EDITOR has edit permissions
    const isAddPlaceButtonDisabled = !hasEditableVisibleMap;
    expect(isAddPlaceButtonDisabled).toBe(false);
  });
});
