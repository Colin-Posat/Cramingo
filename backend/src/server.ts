import { db } from "./config/firebase"; // Import Firestore instance
import app from "./app";
import { emailService } from './services/emailService';

const PORT = process.env.PORT || 6000;

app.listen(PORT, async () => {
  console.log(`🔥 Server is running on port ${PORT}`);

  try {
    // Firebase Test: Add a test document to Firestore
    const testDoc = db.collection("test").doc("server-check");
    await testDoc.set({ message: "Server is connected to Firestore!" });
    console.log("✅ Successfully connected to Firestore!");
  } catch (error) {
    console.error("❌ Firestore connection failed:", error);
  }
});
