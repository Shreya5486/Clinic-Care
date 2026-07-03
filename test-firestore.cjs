const { Firestore } = require('@google-cloud/firestore');
const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'firebase-applet-config.json'), 'utf8'));

const db = new Firestore({
  projectId: config.projectId,
  databaseId: '(default)',
});

async function test() {
  try {
    console.log(`Testing query on project: ${config.projectId}, db: (default)...`);
    const snap = await db.collection('doctors').limit(1).get();
    console.log('Read success! Number of documents:', snap.size);
  } catch (err) {
    console.error('Read failed with error:', err);
  }
}

test();
