/* ==========================================================
   login-utils.js — ONLINE MODE (Firebase v9 Modular API)
   FINAL VERSION v6
   ----------------------------------------------------------
   ✔ Email Login / Signup / Logout
   ✔ Password Reset
   ✔ Current User Helper
   ✔ Auth State Listener (updates UI + clears local data safely)
   ----------------------------------------------------------
   Requires: firebase.js (exports: auth)
========================================================== */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

import { auth } from "./firebase.js";   // <-- YOUR firebase.js must export { auth }

/* ----------------------------------------------------------
   CURRENT USER
---------------------------------------------------------- */
export function getFirebaseUser() {
  return auth.currentUser || null;
}
window.getFirebaseUser = getFirebaseUser;

/* ----------------------------------------------------------
   LOGIN (Email + Password)
---------------------------------------------------------- */
export async function loginUser(email, password) {
  try {
    if (!email || !password) throw new Error("Missing email or password.");

    await signInWithEmailAndPassword(auth, email, password);

    localStorage.setItem("ks-user-email", email);

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
window.loginUser = loginUser;

/* ----------------------------------------------------------
   SIGNUP (Create Account)
---------------------------------------------------------- */
export async function signupUser(email, password) {
  try {
    if (!email || !password) throw new Error("Missing email or password.");

    await createUserWithEmailAndPassword(auth, email, password);

    localStorage.setItem("ks-user-email", email);

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
window.signupUser = signupUser;

/* ----------------------------------------------------------
   PASSWORD RESET
---------------------------------------------------------- */
export async function resetPassword(email) {
  try {
    if (!email) throw new Error("Email required.");

    await sendPasswordResetEmail(auth, email);

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
window.resetPassword = resetPassword;

/* ----------------------------------------------------------
   LOGOUT (Also clear local caches)
---------------------------------------------------------- */
export async function logoutUser() {
  try {
    await signOut(auth);

    // remove local caches (this prevents old data flashing)
    localStorage.removeItem("ks-user-email");

    // optional: clear local data copies too
    localStorage.removeItem("stock-data");
    localStorage.removeItem("sales-data");
    localStorage.removeItem("expenses-data");
    localStorage.removeItem("service-data");
    localStorage.removeItem("ks-collections");
    localStorage.removeItem("item-types");

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
window.logoutUser = logoutUser;

/* ----------------------------------------------------------
   IS LOGGED IN?
---------------------------------------------------------- */
export function isLoggedIn() {
  return !!auth.currentUser;
}
window.isLoggedIn = isLoggedIn;

/* ----------------------------------------------------------
   AUTH STATE LISTENER
   - Saves logged-in email
   - Clears UI on logout
   - Optional: triggers cloudPull() to load online data
---------------------------------------------------------- */
onAuthStateChanged(auth, user => {
  try {
    if (user) {
      localStorage.setItem("ks-user-email", user.email || "");

      // ⭐ USER LOGGED IN → LOAD DATA FROM CLOUD
      if (typeof window.cloudPull === "function") {
        window.cloudPull();
      }

    } else {
      localStorage.removeItem("ks-user-email");

      // ⭐ USER LOGGED OUT → CLEAR UI to avoid stale data
      if (typeof window.clearLocalUI === "function") {
        window.clearLocalUI();
      }
    }

    if (typeof updateEmailTag === "function") {
      updateEmailTag();
    }
  } catch (e) {
    console.warn("Auth state listener error:", e);
  }
});
