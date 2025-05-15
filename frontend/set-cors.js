const admin = require('firebase-admin');
const serviceAccount = require('./linkedincopy-3423b-firebase-adminsdk-fbsvc-4124e55741.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'linkedincopy-3423b.firebasestorage.app'
});

const bucket = admin.storage().bucket();

async function setCors() {
  try {
    // Set CORS configuration - simple and permissive for development
    await bucket.setCorsConfiguration([
      {
        origin: ['*'],  // Allow all origins
        method: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        maxAgeSeconds: 3600,
        responseHeader: ['Content-Type', 'Content-Length', 'Content-Encoding']
      }
    ]);
    
    console.log('CORS configuration set successfully');
  } catch (error) {
    console.error('Error setting CORS configuration:', error);
  }
}

setCors(); 