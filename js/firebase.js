/* ===========================================================
   firebase.js — Firebase Auth + Firestore + Debounced Cloud Save
   - Email/Password sign-up, sign-in
   - Email verification required (optional-check)
   - Password reset
   - onAuthStateChanged -> sets localStorage ks-user-email
   - cloudSave / cloudLoad helpers (Firestore)
   =========================================================== */

console.log("%c🔥 firebase.js loaded", "color:#ff9800;font-weight:bold;");

// --------------------------------------------------
// Firebase Config (keep your keys here)
const firebaseConfig = {
  apiKey: "AIzaSyC1TSwODhcD88-IizbtZkh3DLWMWR4CV9o",
  authDomain: "kharchasaathi-main.firebaseapp.com",
  projectId: "kharchasaathi-main",
  storageBucket: "kharchasaathi-main.appspot.com",
  messagingSenderId: "116390837159",
  appId: "1:116390837159:web:a9c45a7b097ec9c273c432",
  measurementId: "G-7F1V1N1YTR"
};

// --------------------------------------------------
// Initialize Firebase (Compat Mode)
let db = null;
let auth = null;

try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  auth = firebase.auth();
  console.log("%c☁️ Firebase connected successfully!", "color:#4caf50;font-weight:bold;");
} catch (e) {
  console.error("❌ Firebase initialization failed:", e);
}

// --------------------------------------------------
// AUTH HELPERS
// --------------------------------------------------

/**
 * Sign up with email & password.
 * - sends verification email automatically.
 * - returns a Promise that resolves with the userCredential.
 */
window.fsSignUp = async function (email, password) {
  if (!auth) throw new Error("Auth not available");
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  // send verification
  try { await cred.user.sendEmailVerification(); }
  catch (e) { console.warn("Verification send failed", e); }
  return cred;
};

/**
 * Sign in with email & password.
 * - If email not verified, you can optionally block sign-in (we allow sign-in but check).
 */
window.fsSignIn = async function (email, password) {
  if (!auth) throw new Error("Auth not available");
  const cred = await auth.signInWithEmailAndPassword(email, password);
  return cred;
};

/**
 * Sign out current user
 */
window.fsSignOut = async function () {
  if (!auth) throw new Error("Auth not available");
  await auth.signOut();
  // remove local email
  localStorage.removeItem("ks-user-email");
  // optional: notify app
  window.dispatchEvent(new Event("storage"));
};

/**
 * Send password reset email
 */
window.fsSendPasswordReset = async function (email) {
  if (!auth) throw new Error("Auth not available");
  return auth.sendPasswordResetEmail(email);
};

/**
 * Get current Firebase user (or null)
 */
window.getFirebaseUser = function () {
  return auth ? auth.currentUser : null;
};

// --------------------------------------------------
// onAuthStateChanged -> keep localStorage key set and run cloud pull
// --------------------------------------------------
if (auth) {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      // If email is verified OR you want to force verification:
      // if (!user.emailVerified) { console.warn("Email not verified"); }
      localStorage.setItem("ks-user-email", user.email || "");
      console.log("%c🔐 Signed in as:", "color:#03a9f4;font-weight:bold;", user.email);
      // After user signs-in, pull cloud data and merge
      if (typeof window.cloudPullAllIfAvailable === "function") {
        try { await window.cloudPullAllIfAvailable(); } catch (e) { console.warn("cloudPull failed", e); }
      }
      // notify other modules
      window.dispatchEvent(new Event("storage"));
    } else {
      // signed out
      localStorage.removeItem("ks-user-email");
      console.log("%c🔓 Signed out", "color:#999");
      window.dispatchEvent(new Event("storage"));
    }
  });
}

// --------------------------------------------------
// Helper: Cloud User Email (Used as Document ID)
// --------------------------------------------------
function getCloudUser() {
  // Prefer firebase auth currentUser.email if available
  try {
    const fu = (auth && auth.currentUser && auth.currentUser.email) ? auth.currentUser.email : null;
    if (fu) return fu;
  } catch (e) { /* ignore */ }

  const email = localStorage.getItem("ks-user-email");
  return email ? email : "guest-user";
}

// --------------------------------------------------
// CLOUD SAVE & LOAD (Firestore)
// --------------------------------------------------
window.cloudSave = async function (collectionName, data) {
  if (!db) return console.error("❌ Firestore unavailable");
  try {
    const userId = getCloudUser();
    await db.collection(collectionName)
            .doc(userId)
            .set({ items: data }, { merge: true });
    console.log(`☁️ Cloud Save OK → [${collectionName}] for ${userId}`);
  } catch (e) {
    console.error("❌ Cloud Save Error:", e);
  }
};

window.cloudLoad = async function (collectionName) {
  if (!db) return console.error("❌ Firestore unavailable");
  try {
    const userId = getCloudUser();
    const snap = await db.collection(collectionName).doc(userId).get();
    if (!snap.exists) {
      console.warn(`⚠️ No cloud data found for "${collectionName}"`);
      return null;
    }
    const data = snap.data();
    // If we stored { items: [...] } use that
    if (data && Array.isArray(data.items)) return data.items;
    // fallback: return data as-is (if old format)
    return data;
  } catch (e) {
    console.error("❌ Cloud Load Error:", e);
    return null;
  }
};

// --------------------------------------------------
// DEBOUNCED CLOUD SAVE (prevents rapid writes)
// --------------------------------------------------
let _cloudSaveTimer = null;
window.cloudSaveDebounced = function (collection, data) {
  clearTimeout(_cloudSaveTimer);
  _cloudSaveTimer = setTimeout(() => {
    if (typeof window.cloudSave === "function") {
      window.cloudSave(collection, data);
    }
  }, 500);
};

// --------------------------------------------------
// READY LOG
// --------------------------------------------------
console.log("%c⚙️ firebase.js ready (Auth + Firestore + Cloud Sync enabled)", "color:#03a9f4;font-weight:bold;");
