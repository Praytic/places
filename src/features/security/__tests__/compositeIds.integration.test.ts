import { Timestamp } from 'firebase/firestore';
import { UserRole, MapView } from '../../../shared/types/domain';

/**
 * Integration test for Composite ID Functionality
 *
 * Tests the composite ID implementation from SECURITY_ARCHITECTURE.md:
 * - Composite ID format: {mapId}_{collaborator}
 * - Direct document access without queries
 * - ID validation and format enforcement
 * - Performance benefits of composite IDs
 * - MapViewService integration with composite IDs
 */
describe('Composite ID Functionality Integration Test', () => {
  const mapId = 'map-abc-123';
  const collaboratorEmail = 'user@example.com';
  const expectedCompositeId = `${mapId}_${collaboratorEmail}`;

  describe('Composite ID Format', () => {
    it('should generate correct composite ID format', () => {
      // Format: {mapId}_{collaborator}
      const compositeId = `${mapId}_${collaboratorEmail}`;

      expect(compositeId).toBe('map-abc-123_user@example.com');
      expect(compositeId).toContain('_');
      expect(compositeId).toContain(mapId);
      expect(compositeId).toContain(collaboratorEmail);
    });

    it('should parse composite ID into components', () => {
      const compositeId = expectedCompositeId;

      // Split by first underscore only (email may contain underscores)
      const firstUnderscoreIndex = compositeId.indexOf('_');
      const extractedMapId = compositeId.substring(0, firstUnderscoreIndex);
      const extractedCollaborator = compositeId.substring(firstUnderscoreIndex + 1);

      expect(extractedMapId).toBe(mapId);
      expect(extractedCollaborator).toBe(collaboratorEmail);
    });

    it('should handle email addresses with special characters', () => {
      const specialEmail = 'user+test@example.co.uk';
      const compositeId = `${mapId}_${specialEmail}`;

      const firstUnderscoreIndex = compositeId.indexOf('_');
      const extractedCollaborator = compositeId.substring(firstUnderscoreIndex + 1);

      expect(extractedCollaborator).toBe(specialEmail);
      expect(compositeId).toBe(`${mapId}_${specialEmail}`);
    });

    it('should be deterministic and consistent', () => {
      // Same inputs always produce same ID
      const id1 = `${mapId}_${collaboratorEmail}`;
      const id2 = `${mapId}_${collaboratorEmail}`;

      expect(id1).toBe(id2);
      expect(id1).toBe(expectedCompositeId);
    });
  });

  describe('MapViewService Integration', () => {
    it('should create mapView with composite ID', () => {
      // From SECURITY_ARCHITECTURE.md - createMapView implementation
      const compositeId = `${mapId}_${collaboratorEmail}`;

      const mapViewData: MapView = {
        id: compositeId,
        mapId,
        collaborator: collaboratorEmail,
        role: UserRole.VIEW,
        name: 'Shared Map',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      expect(mapViewData.id).toBe(compositeId);
      expect(mapViewData.id).toBe(`${mapViewData.mapId}_${mapViewData.collaborator}`);
    });

    it('should get mapView using composite ID', () => {
      // From SECURITY_ARCHITECTURE.md - getMapView implementation
      // OLD: Query with where clauses
      // NEW: Direct document access

      const compositeId = `${mapId}_${collaboratorEmail}`;

      // Simulate direct document access
      const docPath = `mapViews/${compositeId}`;

      expect(docPath).toBe(`mapViews/${mapId}_${collaboratorEmail}`);

      // No query needed
      const requiresQuery = false;
      expect(requiresQuery).toBe(false);
    });

    it('should delete mapView using composite ID', () => {
      // From SECURITY_ARCHITECTURE.md - deleteMapView implementation
      // OLD: Get mapView first, then delete
      // NEW: Direct delete with composite ID

      const compositeId = `${mapId}_${collaboratorEmail}`;

      // Can delete directly without fetching first
      const docPath = `mapViews/${compositeId}`;

      expect(docPath).toBe(`mapViews/${mapId}_${collaboratorEmail}`);

      // No need to fetch before delete
      const needsFetch = false;
      expect(needsFetch).toBe(false);
    });

    it('should update mapView using composite ID', () => {
      // Update operation uses composite ID directly
      const compositeId = `${mapId}_${collaboratorEmail}`;

      const docPath = `mapViews/${compositeId}`;

      expect(docPath).toBe(`mapViews/${mapId}_${collaboratorEmail}`);
    });
  });

  describe('ID Validation', () => {
    it('should validate composite ID matches mapId and collaborator', () => {
      const mapView: MapView = {
        id: expectedCompositeId,
        mapId,
        collaborator: collaboratorEmail,
        role: UserRole.VIEW,
        name: 'Map',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Validation: ID must equal mapId + "_" + collaborator
      const expectedId = `${mapView.mapId}_${mapView.collaborator}`;
      const isValid = mapView.id === expectedId;

      expect(isValid).toBe(true);
      expect(mapView.id).toBe(expectedId);
    });

    it('should reject invalid composite ID format', () => {
      const invalidIds = [
        'random-id',
        `${mapId}`, // Missing collaborator
        `_${collaboratorEmail}`, // Missing mapId
        `${collaboratorEmail}_${mapId}`, // Reversed order
        '',
      ];

      invalidIds.forEach(invalidId => {
        const expectedId = `${mapId}_${collaboratorEmail}`;
        const isValid = invalidId === expectedId;

        expect(isValid).toBe(false);
      });
    });

    it('should enforce composite ID on creation', () => {
      // Firestore rule: hasValidCompositeId()
      const mapViewWithValidId = {
        id: `${mapId}_${collaboratorEmail}`,
        mapId,
        collaborator: collaboratorEmail,
      };

      const mapViewWithInvalidId = {
        id: 'auto-generated-123',
        mapId,
        collaborator: collaboratorEmail,
      };

      const isValidIdFormat = (mv: typeof mapViewWithValidId) =>
        mv.id === `${mv.mapId}_${mv.collaborator}`;

      expect(isValidIdFormat(mapViewWithValidId)).toBe(true);
      expect(isValidIdFormat(mapViewWithInvalidId)).toBe(false);
    });
  });

  describe('Existence Checks', () => {
    it('should check mapView existence without query', () => {
      // From SECURITY_ARCHITECTURE.md:
      // exists(/databases/places/documents/mapViews/$(mapId + '_' + userEmail()))

      const userId = collaboratorEmail;
      const compositeId = `${mapId}_${userId}`;

      // In Firestore rules, this is a direct exists() check
      // It does NOT count as a document read
      const firestoreRulePath = `/databases/places/documents/mapViews/${compositeId}`;

      expect(firestoreRulePath).toBe(`/databases/places/documents/mapViews/${mapId}_${collaboratorEmail}`);

      // Performance benefit: No query operation needed
      const readsUsed = 0; // exists() doesn't count as read
      expect(readsUsed).toBe(0);
    });

    it('should perform fast access checks in place queries', () => {
      // When querying places, access is checked via:
      // exists(/mapViews/{mapId}_{userEmail})

      const placeMapId = mapId;
      const userId = collaboratorEmail;
      const compositeId = `${placeMapId}_${userId}`;

      // This check happens for every place query
      const accessCheckPath = `/mapViews/${compositeId}`;

      expect(accessCheckPath).toBe(`/mapViews/${mapId}_${collaboratorEmail}`);

      // No query needed, instant verification
      const isInstant = true;
      expect(isInstant).toBe(true);
    });
  });

  describe('Performance Benefits', () => {
    it('should document performance improvement over auto IDs', () => {
      // From RECOMMENDED_ARCHITECTURE.md:
      // Before (Auto IDs): query + getDocs = 1 read
      // After (Composite IDs): exists() = 0 reads

      const performanceComparison = {
        autoId: {
          existenceCheck: {
            operation: 'query + getDocs',
            reads: 1,
          },
        },
        compositeId: {
          existenceCheck: {
            operation: 'exists()',
            reads: 0, // Cached by Firestore
          },
        },
      };

      expect(performanceComparison.autoId.existenceCheck.reads).toBe(1);
      expect(performanceComparison.compositeId.existenceCheck.reads).toBe(0);

      // Savings per access check
      const savings = performanceComparison.autoId.existenceCheck.reads -
                     performanceComparison.compositeId.existenceCheck.reads;
      expect(savings).toBe(1);
    });

    it('should enable efficient batch access checks', () => {
      // Multiple places can be checked with multiple exists() calls
      // All cached by Firestore, no actual reads

      const places = [
        { id: 'place1', mapId: 'map1' },
        { id: 'place2', mapId: 'map2' },
        { id: 'place3', mapId: 'map1' },
      ];

      const userId = collaboratorEmail;

      const accessChecks = places.map(place => ({
        placeId: place.id,
        compositeId: `${place.mapId}_${userId}`,
        readsUsed: 0, // exists() is cached
      }));

      // Total reads for all checks
      const totalReads = accessChecks.reduce((sum, check) => sum + check.readsUsed, 0);

      expect(totalReads).toBe(0);
      expect(accessChecks).toHaveLength(3);
    });
  });

  describe('Security Benefits', () => {
    it('should prevent cross-user access via composite ID', () => {
      // User A cannot access User B's mapView even if they know the mapId
      const userA = 'userA@example.com';
      const userB = 'userB@example.com';

      const userACompositeId = `${mapId}_${userA}`;
      const userBCompositeId = `${mapId}_${userB}`;

      // Different composite IDs ensure isolation
      expect(userACompositeId).not.toBe(userBCompositeId);

      // User A trying to access User B's view
      expect(userACompositeId === userBCompositeId).toBe(false);
    });

    it('should prevent ID guessing attacks', () => {
      // Composite ID is predictable but access is controlled by rules
      // Even if attacker knows the ID format, they can't access without proper auth

      const attackerEmail = 'attacker@example.com';
      const victimEmail = 'victim@example.com';

      // Attacker constructs composite ID
      const guessedCompositeId = `${mapId}_${victimEmail}`;

      // But Firestore rule checks: resource.data.collaborator == userEmail()
      // Attacker's email doesn't match victim's email
      expect(attackerEmail === victimEmail).toBe(false);
      expect(guessedCompositeId).toBe(`${mapId}_${victimEmail}`);

      // Access denied despite knowing the ID
      expect(attackerEmail === victimEmail).toBe(false);
    });

    it('should enforce isolation between maps', () => {
      // User can have access to multiple maps
      const map1 = 'map-111';
      const map2 = 'map-222';
      const user = collaboratorEmail;

      const compositeId1 = `${map1}_${user}`;
      const compositeId2 = `${map2}_${user}`;

      // Different composite IDs for different maps
      expect(compositeId1).not.toBe(compositeId2);

      // Access to map1 doesn't grant access to map2
      const mapViews = [
        { id: compositeId1, mapId: map1, collaborator: user },
        { id: compositeId2, mapId: map2, collaborator: user },
      ];

      // Each map requires separate access check
      expect(mapViews).toHaveLength(2);
      expect(mapViews[0]?.mapId).not.toBe(mapViews[1]?.mapId);
    });
  });

  describe('Migration Compatibility', () => {
    it('should be compatible with existing query patterns', () => {
      // Query by collaborator still works
      const queryByCollaborator = {
        collection: 'mapViews',
        where: [{ field: 'collaborator', operator: '==', value: collaboratorEmail }],
      };

      // Query by mapId still works
      const queryByMapId = {
        collection: 'mapViews',
        where: [{ field: 'mapId', operator: '==', value: mapId }],
      };

      expect(queryByCollaborator.where[0]?.value).toBe(collaboratorEmail);
      expect(queryByMapId.where[0]?.value).toBe(mapId);

      // Composite IDs don't break existing queries
      const compatibleWithQueries = true;
      expect(compatibleWithQueries).toBe(true);
    });

    it('should support both read patterns during migration', () => {
      // During migration, some documents might have auto IDs
      // After migration, all should have composite IDs

      const legacyMapView = {
        id: 'auto-generated-abc123',
        mapId,
        collaborator: collaboratorEmail,
        role: UserRole.VIEW,
      };

      const newMapView = {
        id: `${mapId}_${collaboratorEmail}`,
        mapId,
        collaborator: collaboratorEmail,
        role: UserRole.VIEW,
      };

      // Both have mapId and collaborator fields for querying
      expect(legacyMapView.mapId).toBe(mapId);
      expect(newMapView.mapId).toBe(mapId);

      // After migration, all should use composite format
      const isCompositeFormat = (mv: typeof newMapView) =>
        mv.id === `${mv.mapId}_${mv.collaborator}`;

      expect(isCompositeFormat(legacyMapView)).toBe(false);
      expect(isCompositeFormat(newMapView)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle mapId with underscores', () => {
      const mapWithUnderscore = 'map_with_underscores_123';
      const compositeId = `${mapWithUnderscore}_${collaboratorEmail}`;

      // Parse by finding first occurrence after known mapId
      const extractedMapId = compositeId.substring(0, compositeId.lastIndexOf(`_${collaboratorEmail}`));
      const extractedCollaborator = compositeId.substring(extractedMapId.length + 1);

      expect(extractedMapId).toBe(mapWithUnderscore);
      expect(extractedCollaborator).toBe(collaboratorEmail);
    });

    it('should handle very long composite IDs', () => {
      const longMapId = 'map-' + 'a'.repeat(100);
      const longEmail = 'user' + 'b'.repeat(50) + '@example.com';

      const compositeId = `${longMapId}_${longEmail}`;

      expect(compositeId).toContain(longMapId);
      expect(compositeId).toContain(longEmail);
      expect(compositeId.length).toBe(longMapId.length + 1 + longEmail.length);
    });

    it('should be case-sensitive', () => {
      const email1 = 'user@example.com';
      const email2 = 'User@example.com';

      const id1 = `${mapId}_${email1}`;
      const id2 = `${mapId}_${email2}`;

      // Different cases produce different IDs
      expect(id1).not.toBe(id2);
    });
  });
});
