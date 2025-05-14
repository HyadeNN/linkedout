const admin = require('firebase-admin');
const serviceAccount = require('./linkedincopy-3423b-firebase-adminsdk-fbsvc-ea8bfdf46a.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'linkedincopy-3423b.appspot.com'
});

const bucket = admin.storage().bucket();

async function setCors() {
  try {
    // Set CORS configuration
    await bucket.setCorsConfiguration([
      {
        origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://linkedincopy-3423b.web.app', 'https://linkedincopy-3423b.firebaseapp.com'],
        method: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        maxAgeSeconds: 3600,
        responseHeader: ['Content-Type', 'Authorization', 'Content-Length', 'User-Agent', 'x-firebase-storage-version']
      }
    ]);
    
    console.log('CORS configuration set successfully');
  } catch (error) {
    console.error('Error setting CORS configuration:', error);
  }
}

setCors(); 