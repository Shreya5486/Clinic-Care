const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'firebase-applet-config.json'), 'utf8'));
console.log('Using config:', JSON.stringify(config, null, 2));

const app = initializeApp({
  projectId: config.projectId
});

const db = getFirestore(app, config.firestoreDatabaseId);

async function test() {
  try {
    console.log('Testing collection read...');
    const snap = await db.collection('doctors').limit(1).get();
    console.log('Read success! Number of documents:', snap.size);
  } catch (err) {
    console.error('Read failed with error:', err);
  }
}

test();
