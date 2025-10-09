# Security Architecture Decision

## TL;DR - The Answer to Your Question

**Most Secure Structure**: Flat `mapViews` with composite IDs + Nested `places`

```
maps/{mapId}
  └── places/{placeId}  [NESTED]

mapViews/{mapId}_{collaborator}  [FLAT with composite ID]
```

## Why This is Most Secure

### ❌ Why NOT Nested Views
If views were nested under `maps/{mapId}/views/{userId}`, the owner would have implicit access through the parent path, violating your requirement that **"owners shouldn't be able to read views"**.

### ✅ Why Flat MapViews with Composite IDs

1. **Owner Cannot Read Views** - Enforced at rules level, no way to bypass
2. **No Queries Needed** - Existence checks use composite ID: `exists(/mapViews/$(mapId + '_' + userId))`
3. **Perfect Least Privilege** - Each user only has access to exactly what they need

## Complete Security Matrix

| Operation | Who Can Do It | How It's Enforced |
|-----------|--------------|-------------------|
| **Maps** |
| Create map | Owner only | `request.resource.data.owner == userEmail()` |
| Read map | Owner only | `resource.data.owner == userEmail()` |
| Update map | Owner only | `resource.data.owner == userEmail()` |
| Delete map | Owner only | `resource.data.owner == userEmail()` |
| **MapViews** |
| Create mapView | Owner only | Check map ownership via `get(maps/{mapId})` |
| Read mapView | Collaborator only | `resource.data.collaborator == userEmail()` |
| Update mapView | Collaborator only (displayName, updatedAt) | `isCollaborator() && isUpdatingOnlyAllowedFields()` |
| Delete mapView | Owner only | Check map ownership via `get(maps/{mapId})` |
| **Places** |
| Create place | Owner or Editor | Check ownership or `exists(mapViews/{mapId}_{userId})` with role='edit' |
| Read place | Owner or Viewer or Editor | Check ownership or `exists(mapViews/{mapId}_{userId})` |
| Update place | Owner or Editor | Check ownership or `exists(mapViews/{mapId}_{userId})` with role='edit' |
| Delete place | Owner or Editor | Check ownership or `exists(mapViews/{mapId}_{userId})` with role='edit' |

## Implementation Files

1. **Security Rules**: `firestore.rules.recommended`
2. **Migration Script**: `firebase-migrations/migrate-to-composite-ids.js`
3. **Architecture Docs**: `SECURITY_ARCHITECTURE.md`

## Migration Steps

### From Current Structure (Auto-generated IDs)

```bash
# 1. Backup your data
firebase firestore:export gs://your-bucket/backup

# 2. Run migration (dry run first)
cd ~/github.com/Praytic/firebase-migrations
DRY_RUN=true node migrate-to-composite-ids.js ./credentials.json

# 3. Run actual migration
node migrate-to-composite-ids.js ./credentials.json

# 4. Update MapViewService.ts (see SECURITY_ARCHITECTURE.md)

# 5. Deploy new rules
cd ~/github.com/Prayitc/places
cp firestore.rules.recommended firestore.rules
firebase deploy --only firestore:rules

# 6. Test thoroughly
```

## Key Code Changes in MapViewService.ts

### createMapView
```typescript
// OLD
const mapViewRef = doc(collection(db, 'mapViews'));

// NEW
const compositeId = `${mapId}_${collaborator}`;
const mapViewRef = doc(db, 'mapViews', compositeId);
```

### getMapView
```typescript
// OLD
const q = query(
  collection(db, 'mapViews'),
  where('mapId', '==', mapId),
  where('collaborator', '==', collaborator)
);

// NEW
const compositeId = `${mapId}_${collaborator}`;
const mapViewDoc = await getDoc(doc(db, 'mapViews', compositeId));
```

### deleteMapView
```typescript
// OLD - requires getting mapView first to find ID
const mapView = await getMapView(mapId, userId);
await deleteDoc(doc(db, 'mapViews', mapView.id));

// NEW - direct delete
const compositeId = `${mapId}_${userId}`;
await deleteDoc(doc(db, 'mapViews', compositeId));
```

## Verification Checklist

After migration, verify:

- [ ] Owner CANNOT read mapViews (should get permission denied)
- [ ] Owner CAN create mapViews for their maps
- [ ] Owner CAN delete mapViews for their maps
- [ ] Collaborator CAN read their own mapView
- [ ] Collaborator CAN update displayName in their mapView
- [ ] Collaborator CANNOT create or delete mapViews
- [ ] Collaborator CANNOT update role or other protected fields
- [ ] Editor CAN create/update/delete places in shared map
- [ ] Viewer CAN read places but NOT create/update/delete
- [ ] No user can query all maps in database
- [ ] No user can query all mapViews in database
- [ ] No user can query all places in database

## Performance Benefits

### Before (Auto IDs)
- Check mapView exists: `query + getDocs` = 1 read
- Get user's maps: `query mapViews + getDoc for each map` = N+1 reads

### After (Composite IDs)
- Check mapView exists: `exists()` = 0 reads (cached)
- Get user's maps: `query mapViews + getDoc for each map` = N+1 reads (same)

**Savings**: Every access check saves 1 read operation

## Security Benefits Summary

✅ **Complete isolation** - Owners have zero access to mapView data
✅ **No query vulnerabilities** - Existence checks don't count as reads
✅ **Principle of least privilege** - Each user has exactly the minimum necessary permissions
✅ **Defense in depth** - Multiple layers of security (rules + composite IDs + nested places)
✅ **Audit-friendly** - Clear separation of concerns, easy to verify permissions

## Conclusion

Use **flat mapViews with composite IDs ({mapId}_{collaborator})** + **nested places** for maximum security and perfect adherence to the principle of least privilege.
