import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8'));
console.log('Using config:', JSON.stringify(config, null, 2));

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function test() {
  try {
    console.log('Testing client SDK collection read on "doctors"...');
    const q = query(collection(db, 'doctors'), limit(1));
    const snap = await getDocs(q);
    console.log('Client SDK Read success! Number of documents:', snap.size);
  } catch (err) {
    console.error('Client SDK Read failed with error:', err);
  }
}

test();
