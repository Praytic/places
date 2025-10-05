/**
 * Migration script to add accessList array to existing maps
 * Run once to migrate all existing maps to the new data structure
 *
 * Usage: node scripts/migrateMapAccessList.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { firebaseConfig } from '../src/config/firebase.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateMapAccessList() {
  try {
    console.log('Starting migration...');

    const mapsRef = collection(db, 'maps');
    const snapshot = await getDocs(mapsRef);

    if (snapshot.empty) {
      console.log('No maps found to migrate.');
      return;
    }

    console.log(`Found ${snapshot.size} maps to migrate.`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const mapDoc of snapshot.docs) {
      const mapData = mapDoc.data();

      // Skip if accessList already exists
      if (mapData.accessList && Array.isArray(mapData.accessList)) {
        console.log(`Skipping map ${mapDoc.id} - already has accessList`);
        skipped++;
        continue;
      }

      try {
        // Extract user IDs from access object
        const accessList = Object.keys(mapData.access || {});

        if (accessList.length === 0) {
          console.log(`Warning: Map ${mapDoc.id} has no access entries`);
        }

        // Update the document
        await updateDoc(doc(db, 'maps', mapDoc.id), {
          accessList: accessList
        });

        console.log(`✓ Migrated map ${mapDoc.id} with ${accessList.length} users`);
        migrated++;
      } catch (error) {
        console.error(`✗ Error migrating map ${mapDoc.id}:`, error.message);
        errors++;
      }
    }

    console.log('\nMigration complete!');
    console.log(`- Migrated: ${migrated}`);
    console.log(`- Skipped: ${skipped}`);
    console.log(`- Errors: ${errors}`);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateMapAccessList().then(() => {
  console.log('Done.');
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});