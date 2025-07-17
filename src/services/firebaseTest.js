// Test Firebase configuration
console.log('=== Firebase Environment Variables ===');
console.log('API Key:', import.meta.env.VITE_FIREBASE_API_KEY);
console.log('Auth Domain:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
console.log('Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
console.log('Storage Bucket:', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET);
console.log('Sender ID:', import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID);
console.log('App ID:', import.meta.env.VITE_FIREBASE_APP_ID);

// Test Firebase initialization
import { auth, db, storage } from './firebase';

console.log('=== Firebase Services ===');
console.log('Auth:', auth);
console.log('Database:', db);
console.log('Storage:', storage);

export { auth, db, storage };
