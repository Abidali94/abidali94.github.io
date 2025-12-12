/* ===========================================================
   login-utils.js — SAFE COMPAT VERSION (no local `auth` variable)
   Always uses window.auth (set by firebase.js)
=========================================================== */

/* --------------- HELPERS ---------------- */
function _getAuth() {
  return window.auth || null;
}

/* --------------- CURRENT USER ---------------- */
function getFirebaseUser() {
  const a = _getAuth();
  return a?.currentUser || null;
}
window.getFirebaseUser = getFirebaseUser;

/* ---------------- LOGIN ---------------- */
async function loginUser(email, password) {
  try {
    if (!email || !password) throw new Error("Missing email or password");

    const a = _getAuth();
    if (!a) throw new Error("Auth not ready. Try reloading the page.");

    const r = await a.signInWithEmailAndPassword(email, password);
    localStorage.setItem("ks-user-email", r.user.email);
    return { success: true };
  } catch (err) {
    return { success: false, error: err?.message || String(err) };
  }
}
window.loginUser = loginUser;

/* ---------------- SIGNUP ---------------- */
async function signupUser(email, password) {
  try {
    if (!email || !password) throw new Error("Missing email or password");

    const a = _getAuth();
    if (!a) throw new Error("Auth not ready. Try reloading the page.");

    const r = await a.createUserWithEmailAndPassword(email, password);
    localStorage.setItem("ks-user-email", r.user.email);
    return { success: true };
  } catch (err) {
    return { success: false, error: err?.message || String(err) };
  }
}
window.signupUser = signupUser;

/* ---------------- RESET PASSWORD ---------------- */
async function resetPassword(email) {
  try {
    if (!email) throw new Error("Email required");

    const a = _getAuth();
    if (!a) throw new Error("Auth not ready. Try reloading the page.");

    await a.sendPasswordResetEmail(email);
    return { success: true };
  } catch (err) {
    return { success: false, error: err?.message || String(err) };
  }
}
window.resetPassword = resetPassword;

/* ---------------- LOGOUT ---------------- */
async function logoutUser() {
  try {
    const a = _getAuth();
    if (!a) throw new Error("Auth not ready. Try reloading the page.");

    await a.signOut();
    localStorage.removeItem("ks-user-email");
    return { success: true };
  } catch (err) {
    return { success: false, error: err?.message || String(err) };
  }
}
window.logoutUser = logoutUser;

/* --------------- AUTH STATE LISTENER ---------------- */
(function attachAuthListener() {
  const a = _getAuth();
  if (!a) {
    // If auth not ready now, wait briefly and retry attach once
    setTimeout(()=> {
      const a2 = _getAuth();
      if (a2 && typeof a2.onAuthStateChanged === "function") {
        a2.onAuthStateChanged(handleAuthState);
      }
    }, 500);
    return;
  }
  if (typeof a.onAuthStateChanged === "function") {
    a.onAuthStateChanged(handleAuthState);
  }

  function handleAuthState(user) {
    try {
      if (user) {
        localStorage.setItem("ks-user-email", user.email);
        if (typeof cloudPullAllIfAvailable === "function") {
          cloudPullAllIfAvailable();
        }
      } else {
        localStorage.removeItem("ks-user-email");
        if (typeof clearLocalUI === "function") {
          clearLocalUI();
        }
      }
      if (typeof updateEmailTag === "function") {
        updateEmailTag();
      }
    } catch (e) {
      console.warn("Auth listener error:", e);
    }
  }
})();
