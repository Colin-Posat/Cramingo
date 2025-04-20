import admin from "firebase-admin";
import { config } from "dotenv";
import * as fs from "fs";

config(); // Load .env variables

const serviceAccount = JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS || "", "utf8"));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`
    });
}

const db = admin.firestore();
const storage = admin.storage();
const bucket = storage.bucket();

export { db, admin, storage, bucket };