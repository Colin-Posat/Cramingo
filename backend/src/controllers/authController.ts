import { Request, Response } from "express";
import admin from "firebase-admin";
import jwt from "jsonwebtoken";
import * as bcrypt from 'bcrypt';

const db = admin.firestore(); // Firestore instance
const auth = admin.auth(); // Firebase Authentication instance
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"; // Use environment variable in production
const TOKEN_EXPIRY = "7d"; // Token valid for 7 days

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

    // Generate JWT token for immediate login after signup
    const token = jwt.sign(
      { uid: userRecord.uid, email: userRecord.email },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    res.status(201).json({
      message: "User successfully created",
      token, // Send token for localStorage
      user: { 
        uid: userRecord.uid, 
        email: userRecord.email, 
        username: userData.username,
        university, 
        fieldOfStudy,
        likes: 0
      },
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

    // Generate Firebase custom token
    const customToken = await auth.createCustomToken(userRecord.uid);

    // Generate JWT for persistent login via localStorage
    const persistentToken = jwt.sign(
      { 
        uid: userRecord.uid, 
        email: userRecord.email,
        username: userData?.username
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    res.status(200).json({
      message: "Login successful",
      firebaseToken: customToken, // For Firebase Auth
      token: persistentToken, // For localStorage persistent login
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

export const verifyToken = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get the token from the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    // Verify the JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as { uid: string, email: string };
    
    // Get user data from Firestore
    const userDoc = await db.collection("users").doc(decoded.uid).get();
    
    if (!userDoc.exists) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    
    const userData = userDoc.data();
    
    res.status(200).json({
      success: true,
      user: {
        uid: decoded.uid,
        email: userData?.email,
        username: userData?.username,
        university: userData?.university,
        fieldOfStudy: userData?.fieldOfStudy,
        likes: userData?.likes ?? 0
      }
    });
    
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ message: "Invalid token" });
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
    
    // Try to verify as JWT first (for our localStorage authentication)
    try {
      const token = authHeader.split('Bearer ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { uid: string };
      
      // Get user data from Firestore
      const userDoc = await db.collection("users").doc(decoded.uid).get();
      
      if (!userDoc.exists) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      
      const userData = userDoc.data();
      
      res.status(200).json({
        uid: decoded.uid,
        email: userData?.email,
        username: userData?.username,
        university: userData?.university,
        fieldOfStudy: userData?.fieldOfStudy,
        likes: userData?.likes ?? 0
      });
      return;
    } catch (jwtError) {
      // If JWT verification fails, try Firebase token verification
      try {
        const idToken = authHeader.split('Bearer ')[1];
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
        return;
      } catch (firebaseError) {
        // Both verification methods failed
        throw new Error("Authentication failed");
      }
    }
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  // No server-side action needed for localStorage-based authentication
  // The client will clear the token from localStorage
  res.status(200).json({ message: "Logout successful" });
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

// TypeScript-compatible googleSignup function
export const googleSignup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid, email, displayName, photoURL, university, token, isNewSignup } = req.body;
    
    if (!uid || !email) {
      res.status(400).json({ message: "User ID and email are required" });
      return;
    }
    
    // Check if user exists by EMAIL
    const userByEmailQuery = await db.collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();
    
    if (!userByEmailQuery.empty) {
      // User already exists with this email
      const existingUserDoc = userByEmailQuery.docs[0];
      const existingUserData = existingUserDoc.data();
      const existingUserId = existingUserDoc.id;
      
      // IMPORTANT CHANGE: Don't update existing user's details
      // Just update the last login time
      await db.collection("users").doc(existingUserId).update({
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Generate JWT for the EXISTING user
      const persistentToken = jwt.sign(
        { 
          uid: existingUserId,
          email,
          username: existingUserData.username
        },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );
      
      res.status(200).json({
        message: "Google login successful with existing account",
        token: persistentToken,
        user: {
          uid: existingUserId,
          email,
          username: existingUserData.username,
          university: existingUserData.university, // Keep existing university
          fieldOfStudy: existingUserData.fieldOfStudy || null,
          photoURL: existingUserData.photoURL || null,
          likes: existingUserData.likes || 0
        }
      });
      return;
    }
    
    // If we get here, it's truly a new user - check if UID already exists
    const userDoc = await db.collection("users").doc(uid).get();
    
    if (userDoc.exists) {
      // User already exists by UID, DON'T update their information
      // Just update the last login time
      await db.collection("users").doc(uid).update({
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      const userData = userDoc.data();
      
      // Generate JWT for the EXISTING user
      const persistentToken = jwt.sign(
        { 
          uid,
          email,
          username: userData?.username
        },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );
      
      res.status(200).json({
        message: "Google login successful with existing account by UID",
        token: persistentToken,
        user: {
          uid,
          email,
          username: userData?.username,
          university: userData?.university, // Keep existing university
          fieldOfStudy: userData?.fieldOfStudy || null,
          photoURL: userData?.photoURL || photoURL || null,
          likes: userData?.likes || 0
        }
      });
      return;
    }
    
    // If we reach here, this is a completely new user
    // Only for new users, require university
    if (!university && isNewSignup) {
      res.status(400).json({ message: "University is required for new users" });
      return;
    }
    
    // CRITICAL FIX: For brand new users, create the user in Firebase Auth first
    // This is the fix for the "User not found" error
    try {
      // This step might be redundant in some cases, but let's ensure the user exists in Firebase Auth
      try {
        await auth.getUser(uid);
      } catch (userNotFoundError) {
        // If user doesn't exist in Firebase Auth, create it
        await auth.createUser({
          uid: uid,
          email: email,
          displayName: displayName || email.split('@')[0]
        });
      }
    } catch (authError) {
      console.error("Error ensuring user exists in Firebase Auth:", authError);
      // Continue with Firestore creation even if this fails
    }
    
    // Create new user document in Firestore
    await db.collection("users").doc(uid).set({
      email,
      username: displayName || email.split('@')[0], // Use display name or create username from email
      university, // Set university for new users
      photoURL: photoURL || null,
      likes: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      authProvider: 'google'
    });
    
    // Generate JWT for persistent login
    const persistentToken = jwt.sign(
      { 
        uid,
        email,
        username: displayName || email.split('@')[0]
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );
    
    res.status(201).json({
      message: "Google signup successful",
      token: persistentToken,
      user: {
        uid,
        email,
        username: displayName || email.split('@')[0],
        university,
        photoURL: photoURL || null,
        likes: 0
      }
    });
    
  } catch (error) {
    console.error("Google signup error:", error);
    res.status(500).json({ 
      message: "Google signup failed", 
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

/**
 * Handle exchanging Google auth token after redirect
 */
export const exchangeGoogleToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    
    if (!token) {
      res.status(400).json({ message: "Token is required" });
      return;
    }
    
    // Verify the Google ID token
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;
    
    // Get user details from Firestore
    const userDoc = await db.collection("users").doc(uid).get();
    
    if (!userDoc.exists) {
      res.status(404).json({ message: "User not found. Complete signup first." });
      return;
    }
    
    const userData = userDoc.data();
    
    // Generate JWT for persistent login
    const persistentToken = jwt.sign(
      { 
        uid,
        email: userData?.email,
        username: userData?.username
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );
    
    res.status(200).json({
      message: "Token exchange successful",
      token: persistentToken,
      user: {
        uid,
        email: userData?.email,
        username: userData?.username,
        university: userData?.university,
        photoURL: userData?.photoURL || null,
        likes: userData?.likes || 0
      }
    });
    
  } catch (error) {
    console.error("Token exchange error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, token } = req.body;
    
    if (!email || !token) {
      res.status(400).json({ message: "Email and token are required" });
      return;
    }
    
    let uid: string;
    let isGoogleAuthenticated = false;
    
    // Try to verify the token in different ways
    try {
      // First try as an ID token
      const decodedToken = await auth.verifyIdToken(token);
      uid = decodedToken.uid;
      isGoogleAuthenticated = true;
    } catch (idTokenError) {
      console.log("ID token verification failed, trying as custom token:", idTokenError);
      
      try {
        // Try to find user by email to check if they exist
        const userRecord = await auth.getUserByEmail(email);
        uid = userRecord.uid;
        
        // Check if this account was created with Google provider
        isGoogleAuthenticated = userRecord.providerData.some(
          provider => provider.providerId === 'google.com'
        );
        
        // If the account exists but was NOT created with Google
        if (!isGoogleAuthenticated) {
          // Return a special response indicating account exists but needs linking
          res.status(200).json({ 
            accountExists: true,
            message: "An account with this email already exists but wasn't created with Google.",
            email: email,
            needsLinking: true
          });
          return;
        }
      } catch (userError) {
        console.error("Failed to fetch user by email:", userError);
        res.status(401).json({ message: "Invalid authentication credentials" });
        return;
      }
    }
    
    // Get user details from Firestore
    const userDoc = await db.collection("users").doc(uid).get();
    
    if (!userDoc.exists) {
      res.status(404).json({
        message: "User not found. Please complete the signup process first."
      });
      return;
    }
    
    const userData = userDoc.data();
    
    // Generate JWT for persistent login
    const persistentToken = jwt.sign(
      {
        uid,
        email: userData?.email,
        username: userData?.username
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );
    
    // Update last login timestamp
    await db.collection("users").doc(uid).update({
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(200).json({
      message: "Google login successful",
      token: persistentToken,
      user: {
        uid,
        email: userData?.email,
        username: userData?.username,
        university: userData?.university || "Unknown",
        fieldOfStudy: userData?.fieldOfStudy || null,
        likes: userData?.likes || 0,
        photoURL: userData?.photoURL || null
      }
    });
    
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({
      message: "Google login failed",
      error: (error as Error).message
    });
  }
};

export const checkExistingAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    
    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }
    
    try {
      // First, check Firestore for users with this email
      const userByEmailQuery = await db.collection("users")
        .where("email", "==", email)
        .limit(1)
        .get();
      
      if (!userByEmailQuery.empty) {
        // User found in Firestore
        const userDoc = userByEmailQuery.docs[0];
        const userData = userDoc.data();
        
        // Check if this was created with Google auth
        const isGoogleAuth = userData.authProvider === 'google';
        
        res.status(200).json({
          accountExists: true,
          hasGoogleProvider: isGoogleAuth,
          uid: userDoc.id,
          hasFirestoreData: true,
          userData: {
            username: userData.username,
            university: userData.university,
            // Don't include sensitive data
          }
        });
        return;
      }
      
      // If not found in Firestore, try Firebase Auth
      try {
        const userRecord = await auth.getUserByEmail(email);
        
        // Check if this account was created with Google provider
        const hasGoogleProvider = userRecord.providerData.some(
          provider => provider.providerId === 'google.com'
        );
        
        res.status(200).json({
          accountExists: true,
          hasGoogleProvider,
          uid: userRecord.uid,
          hasFirestoreData: false
        });
      } catch (authError) {
        // If not found in Firebase Auth either, account doesn't exist
        res.status(200).json({
          accountExists: false,
          hasGoogleProvider: false
        });
      }
    } catch (firestoreError) {
      console.error("Firestore query error:", firestoreError);
      
      // Fall back to Firebase Auth check
      try {
        const userRecord = await auth.getUserByEmail(email);
        
        // Check if this account was created with Google provider
        const hasGoogleProvider = userRecord.providerData.some(
          provider => provider.providerId === 'google.com'
        );
        
        res.status(200).json({
          accountExists: true,
          hasGoogleProvider,
          uid: userRecord.uid,
          hasFirestoreData: false
        });
      } catch (authError) {
        // If not found in Firebase Auth either, account doesn't exist
        res.status(200).json({
          accountExists: false,
          hasGoogleProvider: false
        });
      }
    }
  } catch (error) {
    console.error("Check existing account error:", error);
    res.status(500).json({
      message: "Server error checking existing account",
      error: (error as Error).message
    });
  }
};

