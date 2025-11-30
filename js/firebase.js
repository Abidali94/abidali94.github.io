/* ===========================================================
   firebase.js — FINAL V12 (ONLINE ONLY + LOGIN GUARD)
   ✔ Firebase Auth + Firestore
   ✔ Works with core.js cloudPullAllIfAvailable()
   ✔ Saves ks-user-email after login
   ✔ Protects Business pages (auto-redirect to login)
=========================================================== */

console.log("%c🔥 firebase.js loaded", "color:#ff9800;font-weight:bold;");

/* -----------------------------------------------------------
   FIREBASE CONFIG
----------------------------------------------------------- */
const firebaseConfig = {
  apiKey: "AIzaSyC1TSwODhcD88-IizbteOGF-bbebAP6Poc",
  authDomain: "kharchasaathi-main.firebaseapp.com",
  projectId: "kharchasaathi-main",
  storageBucket: "kharchasaathi-main.firebasestorage.app",
  messagingSenderId: "116390837159",
  appId: "1:116390837159:web:a9c45a99d933849f4c9482",
  measurementId: "G-7E1V1NLYTR"
};

/* -----------------------------------------------------------
   INITIALIZE
----------------------------------------------------------- */
let db = null;
let auth = null;

try {
  firebase.initializeApp(firebaseConfig);
  db   = firebase.firestore();
  auth = firebase.auth();
  console.log("%c☁️ Firebase connected!", "color:#4caf50;font-weight:bold;");
} catch (e) {
  console.error("❌ Firebase init failed:", e);
}

/* Helper: current path */
function currentPath() {
  try {
    return window.location.pathname || "";
  } catch {
    return "";
  }
}

/* Which pages must require login? */
const PROTECTED_PATHS = [
  "/tools/business-dashboard.html"      // main business app
  // అవసరమైతే ఇంకో tools కూడా ఇక్కడ add చేయొచ్చు
];

const AUTH_PAGES = [
  "/login.html",
  "/signup.html",
  "/reset.html"
];

/* ===========================================================
   AUTH FUNCTIONS (global helpers)
=========================================================== */

function setLocalEmail(email) {
  if (!email) return;
  try {
    localStorage.setItem("ks-user-email", email);
  } catch {}
}

function clearLocalEmail() {
  try {
    localStorage.removeItem("ks-user-email");
  } catch {}
}

/* --- Sign In (exposed as fsLogin & fsSignIn) --- */
async function _doSignIn(email, password) {
  if (!auth) throw new Error("Auth not ready");
  const cred = await auth.signInWithEmailAndPassword(email, password);
  if (cred.user?.email) setLocalEmail(cred.user.email);
  return cred;
}

window.fsLogin  = _doSignIn;
window.fsSignIn = _doSignIn;     // ఇద్దరూ ఒకటే, safety కోసం

/* --- Sign Up --- */
window.fsSignUp = async function (email, password) {
  if (!auth) throw new Error("Auth not ready");
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  try { await cred.user.sendEmailVerification(); } catch (_) {}
  if (cred.user?.email) setLocalEmail(cred.user.email);
  return cred;
};

/* --- Logout --- */
window.fsLogout = async function () {
  if (!auth) return;
  await auth.signOut();
  clearLocalEmail();
  window.dispatchEvent(new Event("storage"));
};

/* --- Password Reset --- */
window.fsSendPasswordReset = async function (email) {
  if (!auth) throw new Error("Auth not ready");
  return auth.sendPasswordResetEmail(email);
};

/* --- Check auth once --- */
window.fsCheckAuth = function () {
  return new Promise(resolve => {
    if (!auth) return resolve(null);
    const off = auth.onAuthStateChanged(u => {
      off();
      resolve(u);
    });
  });
};

/* --- Expose current user for core.js etc --- */
window.getFirebaseUser = function () {
  return auth?.currentUser || null;
};

/* ===========================================================
   AUTH STATE LISTENER — LOGIN GUARD
=========================================================== */
if (auth) {
  auth.onAuthStateChanged(async (user) => {
    const path = currentPath();

    if (user) {
      const email = user.email || "";
      setLocalEmail(email);

      console.log("%c🔐 Logged in:", "color:#03a9f4;font-weight:bold;", email);

      // After login → sync all cloud data
      if (typeof window.cloudPullAllIfAvailable === "function") {
        try { await window.cloudPullAllIfAvailable(); } catch (e) {
          console.warn("cloudPullAllIfAvailable failed:", e);
        }
      }

      window.dispatchEvent(new Event("storage"));

      // If user is on login / signup / reset page → send to dashboard
      if (AUTH_PAGES.some(p => path.endsWith(p))) {
        window.location.replace("/tools/business-dashboard.html");
      }

    } else {
      clearLocalEmail();
      console.log("%c🔓 Logged out", "color:#f44336;font-weight:bold;");
      window.dispatchEvent(new Event("storage"));

      // 🔒 If this is a PROTECTED page → force to login
      if (PROTECTED_PATHS.some(p => path.endsWith(p))) {
        window.location.replace("/login.html");
      }
    }
  });
}

/* ===========================================================
   FIRESTORE HELPERS — CLOUD ONLY WHEN LOGGED IN
=========================================================== */

function getCloudUser() {
  // Prefer live auth
  if (auth?.currentUser?.email) return auth.currentUser.email;

  // Fallback to stored email (if auth already resolved)
  try {
    const stored = localStorage.getItem("ks-user-email");
    return stored || null;
  } catch {
    return null;
  }
}

/* ----------- CLOUD SAVE ----------- */
window.cloudSave = async function (collection, data) {
  if (!db) return;
  const user = getCloudUser();
  if (!user) {
    console.warn("cloudSave skipped (no user)");
    return;
  }

  try {
    await db.collection(collection)
            .doc(user)
            .set({ items: data }, { merge: true });

    console.log(`☁️ Saved: ${collection} → ${user}`);

    // Very light “pull again” to sync all tabs
    setTimeout(() => {
      if (typeof window.cloudPullAllIfAvailable === "function") {
        try { window.cloudPullAllIfAvailable(); } catch {}
      }
    }, 300);

  } catch (e) {
    console.error("❌ Cloud Save error:", e);
  }
};

/* ----------- CLOUD LOAD ----------- */
window.cloudLoad = async function (collection) {
  if (!db) return [];
  const user = getCloudUser();
  if (!user) return [];

  try {
    const snap = await db.collection(collection).doc(user).get();
    if (!snap.exists) return [];

    const data = snap.data() || {};
    return Array.isArray(data.items) ? data.items : [];

  } catch (e) {
    console.error("❌ Cloud Load error:", e);
    return [];
  }
};

/* ===========================================================
   DEBOUNCED SAVE (to avoid spam writes)
=========================================================== */
let _debounceTimers = {};

window.cloudSaveDebounced = function (collection, data) {
  if (_debounceTimers[collection]) {
    clearTimeout(_debounceTimers[collection]);
  }

  _debounceTimers[collection] = setTimeout(() => {
    window.cloudSave(collection, data);
  }, 400);
};

/* -----------------------------------------------------------
   READY
----------------------------------------------------------- */
console.log("%c⚙️ firebase.js READY ✔ (ONLINE ONLY)", "color:#03a9f4;font-weight:bold;");
