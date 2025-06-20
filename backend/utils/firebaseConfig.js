const admin = require('firebase-admin');


admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CONFIG)),
  storageBucket: 'gs://nb02-seven-team2.firebasestorage.app'
});

const bucket = admin.storage().bucket();

module.exports = bucket;