# Verification Guide - Composite ID Migration

## Quick Verification Steps

### 1. Check Database Structure
Open Firebase Console and verify:

**mapViews collection**:
```
Document ID format: {mapId}_{collaborator@email.com}

Example:
abc123_user@example.com
  ├─ id: "abc123_user@example.com"
  ├─ mapId: "abc123"
  ├─ collaborator: "user@example.com"
  ├─ role: "editor" or "viewer"
  ├─ displayName: "My Map"
  ├─ createdAt: Timestamp
  └─ updatedAt: Timestamp
```

### 2. Security Testing

#### Test 1: Owner CANNOT Read MapViews ✅
```typescript
// As owner of map "abc123"
const mapViewRef = doc(db, 'mapViews', 'abc123_collaborator@example.com');
const mapViewDoc = await getDoc(mapViewRef);

// Expected: Permission denied error
// This proves owner cannot read collaborator's mapView
```

#### Test 2: Owner CAN Create MapViews ✅
```typescript
// As owner of map "abc123"
await shareMapWithUser('abc123', 'newuser@example.com', 'viewer');

// Expected: Success
// MapView created with ID: abc123_newuser@example.com
```

#### Test 3: Owner CAN Delete MapViews ✅
```typescript
// As owner of map "abc123"
await unshareMapWithUser('abc123', 'olduser@example.com');

// Expected: Success
// MapView with ID abc123_olduser@example.com deleted
```

#### Test 4: Collaborator CAN Read Their MapView ✅
```typescript
// As user@example.com who has access to map "abc123"
const mapViewRef = doc(db, 'mapViews', 'abc123_user@example.com');
const mapViewDoc = await getDoc(mapViewRef);

// Expected: Success with mapView data
```

#### Test 5: Collaborator CAN Update displayName ✅
```typescript
// As user@example.com
await updateMapViewDisplayedName('abc123_user@example.com', 'New Name');

// Expected: Success
```

#### Test 6: Collaborator CANNOT Update role ❌
```typescript
// As user@example.com trying to update their own role
const mapViewRef = doc(db, 'mapViews', 'abc123_user@example.com');
await updateDoc(mapViewRef, { role: 'editor' });

// Expected: Permission denied
// Only displayName and updatedAt can be updated by collaborator
```

#### Test 7: Editor CAN Create Places ✅
```typescript
// As user@example.com with role "editor" on map "abc123"
await addPlace({
  name: 'Test Place',
  emoji: '📍',
  group: 'favorite',
  geometry: { location: { lat: 0, lng: 0 } }
}, 'abc123');

// Expected: Success
```

#### Test 8: Viewer CANNOT Create Places ❌
```typescript
// As user@example.com with role "viewer" on map "abc123"
await addPlace({
  name: 'Test Place',
  emoji: '📍',
  group: 'favorite',
  geometry: { location: { lat: 0, lng: 0 } }
}, 'abc123');

// Expected: Permission denied
```

### 3. Application Testing

#### Test Map Sharing Flow
1. Log in as owner (owner@example.com)
2. Create a new map
3. Share map with collaborator (collab@example.com) as "viewer"
4. Log out

5. Log in as collaborator (collab@example.com)
6. Verify map appears in "Shared with me" section
7. Try to add a place → Should fail (viewer role)
8. Log out

9. Log in as owner
10. Update collaborator role to "editor"
11. Log out

12. Log in as collaborator
13. Try to add a place → Should succeed (editor role)
14. Try to rename the map view for yourself → Should succeed

#### Test Map View Management
1. As collaborator, long-press or right-click on a shared map chip
2. Edit dialog should open
3. Change the display name
4. Save → Should succeed
5. Verify the map chip now shows the custom name

### 4. Console Testing Commands

Open browser console on your app:

```javascript
// Check current user
firebase.auth().currentUser.email

// Try to read someone else's mapView (should fail if you're the owner)
firebase.firestore().doc('mapViews/SOME_MAP_ID_otheruser@example.com').get()
  .then(() => console.log('❌ SECURITY ISSUE: Should have been denied'))
  .catch(err => console.log('✅ Correctly denied:', err.code))

// Read your own mapView (should succeed if you're a collaborator)
firebase.firestore().doc('mapViews/SOME_MAP_ID_youruser@example.com').get()
  .then(doc => console.log('✅ Success:', doc.data()))
  .catch(err => console.log('❌ Error:', err))
```

### 5. Performance Verification

Check Firebase Console > Usage tab:

**Before composite IDs:**
- Every mapView access: 1-2 reads (query + result)
- Existence checks: 1 read

**After composite IDs:**
- Every mapView access: 1 read (direct get)
- Existence checks: 0 reads (uses exists() in rules)

**Expected savings**: ~30-50% reduction in read operations for apps with many shared maps

### 6. Error Scenarios

#### Missing MapView
```typescript
await getMapView('nonexistent_map', 'user@example.com');
// Expected: Returns null (not an error)
```

#### Invalid Composite ID Format
The migration script ensures all IDs follow the correct format.
If you find any that don't, they should be reported as migration bugs.

#### Collaborator Deleted
When a map owner deletes a collaborator's access:
- The mapView document is deleted
- Collaborator can no longer access places
- Collaborator's map list updates in real-time

## Automated Test Script

If you have Firebase Admin access, run:

```javascript
// test-composite-ids.js
const admin = require('firebase-admin');

async function verifyCompositeIds(db) {
  const snapshot = await db.collection('mapViews').get();

  let allValid = true;
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const expectedId = `${data.mapId}_${data.collaborator}`;

    if (doc.id !== expectedId) {
      console.error(`❌ Invalid ID: ${doc.id}, expected: ${expectedId}`);
      allValid = false;
    }
  });

  if (allValid) {
    console.log(`✅ All ${snapshot.size} mapViews have valid composite IDs`);
  }

  return allValid;
}

// Run verification
verifyCompositeIds(admin.firestore());
```

## Sign-off Checklist

- [ ] All mapView document IDs follow `{mapId}_{email}` format
- [ ] Owner cannot read mapViews (permission denied)
- [ ] Collaborators can read their own mapViews
- [ ] Role-based access control works for places
- [ ] Map sharing UI works correctly
- [ ] MapView rename functionality works
- [ ] No console errors in browser
- [ ] Firebase rules deployed successfully
- [ ] Read operation count has decreased

## Rollback Procedure

If critical issues are found:

```bash
# 1. Revert code changes
git checkout HEAD~1 src/services/MapViewService.ts
git checkout HEAD~1 src/services/MapsService.ts

# 2. Revert firestore rules
git checkout HEAD~1 firestore.rules
firebase deploy --only firestore:rules

# 3. Redeploy application
npm run build
# Deploy to your hosting
```

## Success Criteria

✅ **Security**: Owner cannot access mapView documents
✅ **Functionality**: All sharing features work correctly
✅ **Performance**: Reduced read operations
✅ **Compatibility**: No breaking changes for users
