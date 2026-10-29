const { initializeApp, getApps, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8")
);

const app = getApps()[0] || initializeApp({ credential: cert(serviceAccount) });

const firebaseAuth = getAuth(app);

module.exports = firebaseAuth;