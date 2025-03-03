import admin from "firebase-admin";
import { config } from "dotenv";
import * as fs from "fs";

config(); // Load .env variables

const serviceAccount = JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS || "", "utf8"));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const db = admin.firestore();
export { db };
