/* ==========================================================
   login-utils.js — FINAL v10 (Ultra-Stable)
   ----------------------------------------------------------
   ✔ Uses firebase.js wrappers (fsLogin, fsSignUp, fsLogout)
   ✔ No conflicts with firebase.js auth listener
   ✔ No duplicate redirects
   ✔ No double email writes
   ✔ Only provides clean helper functions for UI
========================================================== */

/* ----------------------------------------------------------
   CURRENT USER (safe)
---------------------------------------------------------- */
window.getFirebaseUser = function () {
  try {
    return firebase.auth().currentUser || null;
  } catch {
    return null;
  }
};

/* ----------------------------------------------------------
   LOGIN (Uses firebase.js → fsLogin)
---------------------------------------------------------- */
window.loginUser = async function (email, password) {
  try {
    if (!email || !password)
      throw new Error("Enter email & password");

    const res = await window.fsLogin(email, password);

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/* ----------------------------------------------------------
   SIGNUP (Uses firebase.js → fsSignUp)
---------------------------------------------------------- */
window.signupUser = async function (email, password) {
  try {
    if (!email || !password)
      throw new Error("Enter email & password");

    const res = await window.fsSignUp(email, password);

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/* ----------------------------------------------------------
   PASSWORD RESET (Uses firebase.js → fsSendPasswordReset)
---------------------------------------------------------- */
window.resetPassword = async function (email) {
  try {
    if (!email) throw new Error("Email required");

    await window.fsSendPasswordReset(email);

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/* ----------------------------------------------------------
   LOGOUT (Uses firebase.js → fsLogout with redirect)
---------------------------------------------------------- */
window.logoutUser = async function () {
  try {
    await window.fsLogout();   // firebase.js handles redirect → login.html
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/* ----------------------------------------------------------
   IS LOGGED IN? (Realtime-safe)
---------------------------------------------------------- */
window.isLoggedIn = function () {
  try {
    return !!firebase.auth().currentUser;
  } catch {
    return false;
  }
};

/* ----------------------------------------------------------
   LIGHT AUTH LISTENER (No redirects — firebase.js handles that)
---------------------------------------------------------- */
firebase.auth().onAuthStateChanged(user => {
  try {
    if (typeof updateEmailTag === "function") updateEmailTag();
  } catch {}
});
