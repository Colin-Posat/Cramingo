// src/config/firebase.ts
import admin from "firebase-admin";
import { config } from "dotenv";

config(); // load .env

const sa = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!sa) {
  throw new Error("Missing GOOGLE_APPLICATION_CREDENTIALS env var");
}

// Parse the raw JSON keys (snake_case):
const raw = JSON.parse(sa) as {
  project_id:      string;
  private_key:     string;
  client_email:    string;
  [key: string]: any;
};

// Map into the camelCase shape that admin.credential.cert() expects
const serviceAccount: admin.ServiceAccount = {
  projectId:   raw.project_id,
  privateKey:  raw.private_key.replace(/\\n/g, "\n"),
  clientEmail: raw.client_email,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket:
      process.env.FIREBASE_STORAGE_BUCKET ??
      `${serviceAccount.projectId}.appspot.com`,
  });
}

export const db      = admin.firestore();
export const storage = admin.storage();
export const bucket  = storage.bucket();
export const auth = admin.auth();
