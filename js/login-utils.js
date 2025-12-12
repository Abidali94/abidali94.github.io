/* ==========================================================
   login-utils.js — ONLINE MODE (Firebase v9 COMPAT API)
   FINAL FIXED VERSION v10 — NO DUPLICATE AUTH, NO ERRORS
========================================================== */

/* Get global auth from firebase.js (DO NOT REDECLARE!) */
const auth = window.auth;

/* ----------------------------------------------------------
   CURRENT USER
---------------------------------------------------------- */
function getFirebaseUser() {
  return auth?.currentUser || null;
}
window.getFirebaseUser = getFirebaseUser;

/* ----------------------------------------------------------
   LOGIN (Email + Password)
---------------------------------------------------------- */
async function loginUser(email, password) {
  try {
    if (!email || !password) throw new Error("Missing email or password.");

    const res = await auth.signInWithEmailAndPassword(email, password);

    localStorage.setItem("ks-user-email", email);

    return { success: true, user: res.user };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
window.loginUser = loginUser;

/* ----------------------------------------------------------
   SIGNUP (Create Account)
---------------------------------------------------------- */
async function signupUser(email, password) {
  try {
    if (!email || !password) throw new Error("Missing email or password.");

    const res = await auth.createUserWithEmailAndPassword(email, password);

    localStorage.setItem("ks-user-email", email);

    return { success: true, user: res.user };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
window.signupUser = signupUser;

/* ----------------------------------------------------------
   PASSWORD RESET
---------------------------------------------------------- */
async function resetPassword(email) {
  try {
    if (!email) throw new Error("Email required");

    await auth.sendPasswordResetEmail(email);

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
window.resetPassword = resetPassword;

/* ----------------------------------------------------------
   LOGOUT
---------------------------------------------------------- */
async function logoutUser() {
  try {
    await auth.signOut();

    localStorage.removeItem("ks-user-email");

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
window.logoutUser = logoutUser;

/* ----------------------------------------------------------
   IS LOGGED IN?
---------------------------------------------------------- */
function isLoggedIn() {
  return !!auth?.currentUser;
}
window.isLoggedIn = isLoggedIn;

/* ----------------------------------------------------------
   AUTH STATE LISTENER
---------------------------------------------------------- */
auth.onAuthStateChanged(user => {
  try {
    if (user) {
      localStorage.setItem("ks-user-email", user.email);

      if (typeof window.cloudPullAllIfAvailable === "function") {
        window.cloudPullAllIfAvailable();
      }

    } else {
      localStorage.removeItem("ks-user-email");

      if (typeof window.clearLocalUI === "function") {
        window.clearLocalUI();
      }
    }

    if (typeof updateEmailTag === "function") {
      updateEmailTag();
    }

  } catch (e) {
    console.warn("Auth listener error:", e);
  }
});
