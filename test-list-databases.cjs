const { FirestoreAdminClient } = require('@google-cloud/firestore').v1;
const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'firebase-applet-config.json'), 'utf8'));

const client = new FirestoreAdminClient({
  projectId: config.projectId,
});

async function listDatabases() {
  try {
    console.log(`Listing databases for project: ${config.projectId}...`);
    const parent = `projects/${config.projectId}`;
    const [databases] = await client.listDatabases({ parent });
    console.log('Databases found:');
    for (const db of databases) {
      console.log(`- ID: ${db.name.split('/').pop()}, Type: ${db.type}, Location: ${db.locationId}`);
    }
  } catch (err) {
    console.error('Failed to list databases:', err);
  }
}

listDatabases();
