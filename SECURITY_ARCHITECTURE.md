# Most Secure Firebase Structure

## Why This Structure is Most Secure

### Problem with Nested Views
If `views` are nested under `maps/{mapId}/views/{userId}`, the map owner would have access to read them through the parent path, violating the principle of least privilege.

### Solution: Flat MapViews with Composite IDs

```
maps/{mapId}
  - owner: string
  - name: string
  └── places/{placeId}  [NESTED]
      - name, emoji, group, geometry...

mapViews/{mapId}_{collaborator}  [FLAT with composite ID]
  - id: string ("{mapId}_{collaborator}")
  - mapId: string
  - collaborator: string (email)
  - role: 'viewer' | 'edit'
  - displayName: string
```

## Security Benefits

### 1. **MapViews are completely isolated from owners**
- ✅ Owners can create/delete views (by checking mapId)
- ✅ Owners CANNOT read or update views (no access rule)
- ✅ Collaborators can ONLY read/update their own view
- ✅ Collaborators CANNOT create/delete views

### 2. **Composite IDs enable existence checks without queries**
```javascript
// Check if user has access to a map (no query needed!)
exists(/databases/places/documents/mapViews/$(mapId + '_' + userEmail()))
```

### 3. **Places remain queryable by authorized users only**
- ✅ Nested under maps for clean organization
- ✅ Owner can query all places in their map
- ✅ Collaborators can query places IF they have a mapView
- ✅ No one can query all places in the database

### 4. **Enforces all your requirements**
- ✅ Owners can't read views
- ✅ Owners can create/delete views
- ✅ Collaborators can read/update (limited fields) their views
- ✅ Collaborators can't create/delete views
- ✅ Map access is user-specific
- ✅ Place queries are map-specific with access control

## Firestore Rules

See `firestore.rules.recommended` for the complete secure rules.

## Key Rules Highlights

### MapViews Rules
```javascript
// Owner can ONLY create and delete - CANNOT read or update
allow create: if isMapOwnerForCreate() && hasValidCompositeId();
allow delete: if isMapOwner();

// Collaborator can ONLY read and update - CANNOT create or delete
allow read: if isCollaborator();
allow update: if isCollaborator() && isUpdatingOnlyAllowedFields();
```

### Places Rules
```javascript
// Uses composite ID to check mapView existence without queries
function hasViewAccess() {
  return exists(/databases/places/documents/mapViews/$(mapId + '_' + userEmail()));
}

// Owner and editors can modify
allow create, update, delete: if isMapOwner() || canEdit();

// Owner and all collaborators can read
allow read: if isMapOwner() || canView();
```

## Client-Side Changes Required

### MapViewService Changes

**Current**: Uses auto-generated IDs
```typescript
const mapViewRef = doc(collection(db, 'mapViews'));
const mapViewData = {
  id: mapViewRef.id,
  mapId,
  collaborator,
  role,
  displayName
};
```

**Required**: Use composite IDs
```typescript
const compositeId = `${mapId}_${collaborator}`;
const mapViewRef = doc(db, 'mapViews', compositeId);
const mapViewData = {
  id: compositeId,
  mapId,
  collaborator,
  role,
  displayName
};
```

### Query Changes

**Get user's mapViews** (no change needed):
```typescript
query(collection(db, 'mapViews'), where('collaborator', '==', userId))
```

**Get mapViews for a map** (owner use case):
```typescript
query(collection(db, 'mapViews'), where('mapId', '==', mapId))
```

**Check if mapView exists**:
```typescript
const compositeId = `${mapId}_${userId}`;
const mapViewDoc = await getDoc(doc(db, 'mapViews', compositeId));
```

## Migration Path

1. Run migration script to convert to composite IDs
2. Update client code (MapViewService)
3. Deploy new Firestore rules
4. Test thoroughly
5. Clean up old mapViews if needed

See `migrate-to-composite-ids.js` for the migration script.

## Comparison with Current Structure

| Aspect | Current (Auto IDs) | Recommended (Composite IDs) |
|--------|-------------------|----------------------------|
| Owner can read views | ❌ Yes (via queries) | ✅ No (enforced by rules) |
| Existence check | ❌ Requires query | ✅ Direct exists() check |
| Places access control | ⚠️ Simplified | ✅ Full role-based control |
| Principle of least privilege | ⚠️ Partial | ✅ Complete |
| Query performance | ⚠️ Standard | ✅ Faster (no query for exists) |

## Conclusion

The **flat mapViews collection with composite IDs** + **nested places** structure is the most secure because:

1. ✅ Owners physically cannot access mapView data (no rule allows it)
2. ✅ Collaborators have isolated access to only their mapView
3. ✅ Places have proper role-based access control without queries
4. ✅ All database queries are user-specific and scoped
5. ✅ Perfect adherence to principle of least privilege
