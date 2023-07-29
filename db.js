var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = app.firestore();

module.exports = db;
