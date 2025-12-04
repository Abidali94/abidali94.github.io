/* ===========================================================
   firebase.js — FINAL V14 (Ultra-Stable + No Conflicts)
   ✔ Login / Signup / Reset
   ✔ Auto Redirect Guards
   ✔ Cloud Sync (Load + Save + Debounced)
   ✔ Works on Mobile Paths & Desktop Paths
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
   INITIALIZE (Safe Init)
----------------------------------------------------------- */
let db = null;
let auth = null;

try {
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  db   = firebase.firestore();
  auth = firebase.auth();
  console.log("%c☁️ Firebase connected!", "color:#4caf50;font-weight:bold;");
} catch (e) {
  console.error("❌ Firebase init failed:", e);
}

/* -----------------------------------------------------------
   PATH HELPERS (Mobile + Desktop Safe)
----------------------------------------------------------- */
function currentPath() {
  return window.location.pathname.replace(/\\/g, "/");
}

function ends(path, name) {
  return path.toLowerCase().endsWith(name.toLowerCase());
}

/* All protected screens */
const PROTECTED = [
  "business-dashboard.html"
];

/* Public auth screens */
const AUTH_PAGES = [
  "login.html",
  "signup.html",
  "reset-password.html"
];

/* -----------------------------------------------------------
   LOCAL EMAIL HELPERS
----------------------------------------------------------- */
function setLocalEmail(email) {
  if (!email) return;
  try { localStorage.setItem("ks-user-email", email); } catch {}
}

function clearLocalEmail() {
  try { localStorage.removeItem("ks-user-email"); } catch {}
}

/* ===========================================================
   AUTH FUNCTIONS
=========================================================== */
window.fsLogin = async function (email, password) {
  const cred = await auth.signInWithEmailAndPassword(email, password);
  setLocalEmail(cred.user?.email);
  return cred;
};

window.fsSignUp = async function (email, password) {
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  try { await cred.user.sendEmailVerification(); } catch {}
  setLocalEmail(cred.user?.email);
  return cred;
};

/* LOGOUT (Always Safe) */
window.fsLogout = async function () {
  try { await auth.signOut(); } catch (e) {}
  clearLocalEmail();
  window.location.href = "/login.html";
};

/* Reset */
window.fsSendPasswordReset = email => auth.sendPasswordResetEmail(email);

/* Current Firebase User */
window.getFirebaseUser = () => auth?.currentUser || null;

/* ===========================================================
   AUTH STATE LISTENER — PROTECTOR
=========================================================== */
if (auth) {
  auth.onAuthStateChanged(async user => {
    const path = currentPath();

    if (user) {
      const email = user.email || "";
      setLocalEmail(email);

      console.log("%c🔐 Logged in:", "color:#03a9f4;font-weight:bold;", email);

      // Load cloud data
      if (typeof cloudPullAllIfAvailable === "function") {
        try { await cloudPullAllIfAvailable(); } catch {}
      }

      // If still on login/signup → send to dashboard
      if (AUTH_PAGES.some(p => ends(path, p))) {
        window.location.replace("/tools/business-dashboard.html");
      }

    } else {
      clearLocalEmail();
      console.log("%c🔓 Logged out", "color:#f44336;font-weight:bold;");

      // Protect private areas
      if (PROTECTED.some(p => ends(path, p))) {
        window.location.replace("/login.html");
      }
    }
  });
}

/* ===========================================================
   FIRESTORE HELPERS
=========================================================== */
function getCloudUser() {
  return (
    auth?.currentUser?.email ||
    localStorage.getItem("ks-user-email") ||
    null
  );
}

/* SAVE TO CLOUD */
window.cloudSave = async function (collection, data) {
  const user = getCloudUser();
  if (!user) return console.warn("cloudSave skipped (no user)");

  try {
    await db.collection(collection)
      .doc(user)
      .set({ items: data }, { merge: true });

    console.log(`☁️ Saved → ${collection}`);

  } catch (e) {
    console.error("❌ Cloud Save error:", e);
  }
};

/* LOAD FROM CLOUD */
window.cloudLoad = async function (collection) {
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
   DEBOUNCED SAVE (Prevents Infinite Loop)
=========================================================== */
let _csTimers = {};

window.cloudSaveDebounced = function (collection, data) {
  if (_csTimers[collection]) clearTimeout(_csTimers[collection]);

  _csTimers[collection] = setTimeout(() => {
    cloudSave(collection, data);
  }, 300);
};

/* ===========================================================
   READY
=========================================================== */
console.log("%c⚙️ firebase.js READY ✔", "color:#03a9f4;font-weight:bold;");
