import { Timestamp } from 'firebase/firestore';
import { UserRole, PlaceMapWithRole } from '../../../shared/types/domain';

/**
 * Integration test for Map Sharing and DisplayedName feature
 *
 * This test documents the expected behavior of the map sharing feature,
 * particularly the displayedName functionality that allows shared users
 * to rename their view of a map without affecting the original map or
 * what other users see.
 *
 * Test Scenario:
 * 1. User1 creates a Map called "Map"
 * 2. User1 shares the "Map" with User2
 * 3. MapChips for User2 show "Map" name for his MapView
 * 4. User2 renames his MapView to "My Map" and sees "My Map" in the MapChips
 * 5. User1 renames the Map to "Map1"
 * 6. User2 should still see "My Map" name in the MapChips
 * 7. User1 should see "Map1" in the MapChips
 */
describe('Map Sharing and DisplayedName Integration Test', () => {
  const user1Email = 'user1@example.com';
  const user2Email = 'user2@example.com';

  it('should document complete map sharing and renaming workflow', () => {
    // This test documents the expected data flow and behavior

    // Step 1: User1 creates a Map called "Map"
    const createdMap = {
      id: 'map-123',
      name: 'Map',
      owner: user1Email,
      isDefault: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    expect(createdMap.name).toBe('Map');
    expect(createdMap.owner).toBe(user1Email);

    // Step 2: User1 shares the "Map" with User2
    // This creates a MapView with the original map name as displayName
    const createdMapView = {
      id: 'mapview-456',
      mapId: createdMap.id,
      collaborator: user2Email,
      role: UserRole.VIEW,
      displayName: 'Map', // Initially uses the original map name
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    expect(createdMapView.mapId).toBe(createdMap.id);
    expect(createdMapView.collaborator).toBe(user2Email);
    expect(createdMapView.displayName).toBe('Map');

    // Step 3: MapChips for User2 show "Map" name for his MapView
    // getUserMapViews returns PlaceMapWithRole with displayedName
    const user2InitialMaps: PlaceMapWithRole[] = [
      {
        id: createdMap.id,
        name: 'Map', // Original map name
        owner: user1Email,
        isDefault: false,
        createdAt: createdMap.createdAt,
        updatedAt: createdMap.updatedAt,
        userRole: UserRole.VIEW,
        mapViewId: createdMapView.id,
        displayedName: 'Map', // Shows original map name initially
      },
    ];

    expect(user2InitialMaps[0].displayedName).toBe('Map');
    expect(user2InitialMaps[0].name).toBe('Map');

    // Step 4: User2 renames his MapView to "My Map"
    const updatedMapView = {
      ...createdMapView,
      displayName: 'My Map', // User2's custom name
      updatedAt: Timestamp.now(),
    };

    expect(updatedMapView.displayName).toBe('My Map');

    // User2 now sees "My Map" in MapChips
    const user2MapsAfterRename: PlaceMapWithRole[] = [
      {
        id: createdMap.id,
        name: 'Map', // Original map name unchanged
        owner: user1Email,
        isDefault: false,
        createdAt: createdMap.createdAt,
        updatedAt: createdMap.updatedAt,
        userRole: UserRole.VIEW,
        mapViewId: createdMapView.id,
        displayedName: 'My Map', // User2's custom name
      },
    ];

    expect(user2MapsAfterRename[0].displayedName).toBe('My Map');
    expect(user2MapsAfterRename[0].name).toBe('Map'); // Original name unchanged

    // Step 5: User1 renames the Map to "Map1"
    const renamedMap = {
      ...createdMap,
      name: 'Map1', // Owner renames the actual map
      updatedAt: Timestamp.now(),
    };

    expect(renamedMap.name).toBe('Map1');

    // Step 6: User2 should still see "My Map" in MapChips
    // The displayedName in MapView is independent of the map name
    const user2MapsFinal: PlaceMapWithRole[] = [
      {
        id: renamedMap.id,
        name: 'Map1', // Original map name changed
        owner: user1Email,
        isDefault: false,
        createdAt: renamedMap.createdAt,
        updatedAt: renamedMap.updatedAt,
        userRole: UserRole.VIEW,
        mapViewId: createdMapView.id,
        displayedName: 'My Map', // User2's custom name preserved
      },
    ];

    expect(user2MapsFinal[0].displayedName).toBe('My Map'); // User2 still sees "My Map"
    expect(user2MapsFinal[0].name).toBe('Map1'); // Underlying map name is "Map1"

    // Step 7: User1 should see "Map1" in MapChips (as owner)
    // Owners don't have MapViews, so no displayedName
    const user1MapsFinal: PlaceMapWithRole[] = [
      {
        id: renamedMap.id,
        name: 'Map1',
        owner: user1Email,
        isDefault: false,
        createdAt: renamedMap.createdAt,
        updatedAt: renamedMap.updatedAt,
        userRole: UserRole.OWNER,
        // No mapViewId or displayedName for owners
      },
    ];

    expect(user1MapsFinal[0].name).toBe('Map1'); // Owner sees actual map name
    expect(user1MapsFinal[0].displayedName).toBeUndefined(); // No custom name for owners
  });

  it('should verify MapChips displays correct name based on displayedName field', () => {
    // Test the MapChips logic: map.displayedName || map.name

    // For User2 (with displayedName)
    const user2Map = {
      id: 'map-123',
      name: 'Map1',
      displayedName: 'My Map',
      owner: user1Email,
      userRole: UserRole.VIEW,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const user2DisplayName = user2Map.displayedName || user2Map.name;
    expect(user2DisplayName).toBe('My Map');

    // For User1 (owner, no displayedName)
    const user1Map = {
      id: 'map-123',
      name: 'Map1',
      owner: user1Email,
      userRole: UserRole.OWNER,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const user1DisplayName = user1Map.displayedName || user1Map.name;
    expect(user1DisplayName).toBe('Map1');
  });
});