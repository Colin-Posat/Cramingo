import { Request, Response } from "express";
import admin from "firebase-admin";

const db = admin.firestore(); // Firestore instance
const auth = admin.auth(); // Firebase Authentication instance

export const signupInit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, username } = req.body;
    
    if (!email || !password || !username) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }
    
    // Check if email already exists in Firebase Auth.
    try {
      const existingUser = await auth.getUserByEmail(email);
      if (existingUser) {
        res.status(400).json({ message: "Email is already in use" });
        return;
      }
    } catch (error) {
      // If error.code === 'auth/user-not-found', the email is not in use
      // This is the expected path for new users
      if ((error as any).code !== 'auth/user-not-found') {
        throw error;
      }
    }
    
    // Also check pending users collection
    const pendingUserRef = db.collection("pendingUsers").doc(email);
    const pendingUserDoc = await pendingUserRef.get();
    
    if (pendingUserDoc.exists) {
      res.status(400).json({ message: "Email is already in use" });
      return;
    }
    
    // Store user credentials in Firestore temporarily
    await pendingUserRef.set({ email, password, username });
    
    res.status(200).json({ message: "User data stored, complete signup on details page" });
  } catch (error) {
    console.error("Signup initialization error:", error);
    res.status(500).json({ message: "Signup failed", error: (error as Error).message });
  }
};

export const completeSignup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, university, fieldOfStudy } = req.body;

    if (!email || !university) {
      res.status(400).json({ message: "University is required" });
      return;
    }

    // Fetch stored credentials
    const userRef = db.collection("pendingUsers").doc(email);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    if (!userData) {
      res.status(400).json({ message: "Signup session expired. Please try again." });
      return;
    }

    // Create user in Firebase Authentication
    const userRecord = await auth.createUser({
      email: userData.email,
      password: userData.password,
    });

    // Store full user details in Firestore
    await db.collection("users").doc(userRecord.uid).set({
      username: userData.username,
      email: userData.email,
      university,
      fieldOfStudy,
      likes: 0, // Initialize likes to 0
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Cleanup pending user data
    await userRef.delete();

    res.status(201).json({
      message: "User successfully created",
      user: { uid: userRecord.uid, email: userRecord.email, university, fieldOfStudy },
    });
  } catch (error) {
    console.error("Signup completion error:", error);
    res.status(500).json({ message: "Signup completion failed", error: (error as Error).message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }
    
    // Get user by email
    const userRecord = await auth.getUserByEmail(email)
      .catch(() => {
        throw new Error("Invalid email or password");
      });
    
    // Since Firebase Admin SDK can't verify passwords directly,
    // client should use Firebase Auth SDK for actual authentication
    // Here we're just returning user info assuming client has properly authenticated
    
    // Get user details from Firestore
    const userDoc = await db.collection("users").doc(userRecord.uid).get();
    
    if (!userDoc.exists) {
      res.status(404).json({ message: "User profile not found" });
      return;
    }
    
    const userData = userDoc.data();

    // Generate a custom token for the client
    const customToken = await auth.createCustomToken(userRecord.uid);

    res.status(200).json({
      message: "Login successful",
      token: customToken,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        username: userData?.username ?? "Unknown",
        university: userData?.university ?? "Unknown",
        fieldOfStudy: userData?.fieldOfStudy ?? "Unknown",
        likes: userData?.likes ?? 0
      }
    });

  } catch (error) {
    res.status(401).json({ 
      message: error instanceof Error ? error.message : "Authentication failed" 
    });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    
    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }
    
    // Import email service
    const { emailService } = await import('../services/emailService');
    
    // Check if user exists
    try {
      await auth.getUserByEmail(email);
      
      // If we get here, the user exists, so generate and send the reset link
      const resetLink = await auth.generatePasswordResetLink(email);
      
      // Send the password reset email
      await emailService.sendPasswordResetEmail(email, resetLink);
      console.log(`Password reset email sent to ${email}`);
      
    } catch (error: any) {
      // User doesn't exist, but we don't reveal this fact
      if (error.code === 'auth/user-not-found') {
        console.log(`Password reset attempted for non-existent email: ${email}`);
      } else {
        // For other errors, log but don't expose to client
        console.error(`Error in password reset for ${email}:`, error);
      }
    }
    
    // Always return the same message, regardless of whether email exists or not
    res.status(200).json({ 
      message: "If your email is registered, you will receive reset instructions" 
    });
    
  } catch (error) {
    console.error("Forgot password error:", error);
    // Still return 200 to not reveal if there was an actual error
    res.status(200).json({ 
      message: "If your email is registered, you will receive reset instructions" 
    });
  }
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get the token from the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify the ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Get user data from Firestore
    const userDoc = await db.collection("users").doc(uid).get();
    
    if (!userDoc.exists) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    
    const userData = userDoc.data();
    
    res.status(200).json({
      uid,
      email: userData?.email,
      username: userData?.username,
      university: userData?.university,
      fieldOfStudy: userData?.fieldOfStudy,
      likes: userData?.likes ?? 0
    });
    
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
};


export const checkUsernameAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.body;
    if (!username || username.trim().length < 3) {
      res
        .status(400)
        .json({ available: false, message: "Username must be at least 3 characters" });
      return;
    }

    const candidate = username.trim().toLowerCase();

    // 1) Check in 'users' collection
    const usersSnap = await db.collection("users").get();
    const clashInUsers = usersSnap.docs.some(doc => {
      const u = doc.data().username as string | undefined;
      return u?.toLowerCase() === candidate;
    });
    if (clashInUsers) {
      res.status(200).json({ available: false });
      return;
    }

    // 2) Check in 'pendingUsers' collection
    const pendingSnap = await db.collection("pendingUsers").get();
    const clashInPending = pendingSnap.docs.some(doc => {
      const u = doc.data().username as string | undefined;
      return u?.toLowerCase() === candidate;
    });
    if (clashInPending) {
      res.status(200).json({ available: false });
      return
    }

    // no clash → available
    res.status(200).json({ available: true });
  } catch (err) {
    console.error("Error checking username:", err);
    res.status(500).json({ available: false, message: "Internal error" });
  }
};