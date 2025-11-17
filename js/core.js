/* ===========================================================
   📌 core.js — Master Storage + Utility Engine (v3.0 FIXED)
   =========================================================== */

/* ------------------------------------
   🔐 LOCAL STORAGE KEYS
------------------------------------ */
const KEY_TYPES      = "item-types";
const KEY_STOCK      = "stock-data";
const KEY_SALES      = "sales-data";
const KEY_WANTING    = "wanting-data";
const KEY_EXPENSES   = "expenses-data";
const KEY_LIMIT      = "default-limit";
const KEY_USER_EMAIL = "ks-user-email";

/* ------------------------------------
   🧠 SAFE PARSE (Avoid corrupt data)
------------------------------------ */
function safeParse(raw) {
  try {
    const v = JSON.parse(raw);
    return v;
  } catch {
    return null;
  }
}

function toArray(x) {
  if (Array.isArray(x)) return x;
  if (!x) return [];
  if (typeof x === "object") return Object.values(x);
  return [];
}

/* ------------------------------------
   🔧 GLOBAL DATA (Always arrays)
------------------------------------ */
window.types    = toArray(safeParse(localStorage.getItem(KEY_TYPES)));
window.stock    = toArray(safeParse(localStorage.getItem(KEY_STOCK)));
window.sales    = toArray(safeParse(localStorage.getItem(KEY_SALES)));
window.wanting  = toArray(safeParse(localStorage.getItem(KEY_WANTING)));
window.expenses = toArray(safeParse(localStorage.getItem(KEY_EXPENSES)));

/* ------------------------------------
   🔐 LOGIN 
------------------------------------ */
function loginUser(email) {
  if (!email || !email.includes("@")) return false;
  localStorage.setItem(KEY_USER_EMAIL, email.trim());
  return true;
}
function isLoggedIn() { return !!localStorage.getItem(KEY_USER_EMAIL); }
function getUserEmail() { return localStorage.getItem(KEY_USER_EMAIL) || ""; }
function logoutUser() { localStorage.removeItem(KEY_USER_EMAIL); }

window.loginUser = loginUser;
window.isLoggedIn = isLoggedIn;
window.getUserEmail = getUserEmail;
window.logoutUser = logoutUser;

/* ------------------------------------
   💾 SAVE HELPERS
------------------------------------ */
function saveTypes()    { localStorage.setItem(KEY_TYPES,    JSON.stringify(window.types)); }
function saveStock()    { localStorage.setItem(KEY_STOCK,    JSON.stringify(window.stock)); }
function saveSales()    { localStorage.setItem(KEY_SALES,    JSON.stringify(window.sales)); }
function saveWanting()  { localStorage.setItem(KEY_WANTING,  JSON.stringify(window.wanting)); }
function saveExpenses() { localStorage.setItem(KEY_EXPENSES, JSON.stringify(window.expenses)); }

window.saveTypes = saveTypes;
window.saveStock = saveStock;
window.saveSales = saveSales;
window.saveWanting = saveWanting;
window.saveExpenses = saveExpenses;

/* ------------------------------------
   📆 DATE HELPERS
------------------------------------ */
function todayDate() {
  return new Date().toISOString().split("T")[0];
}
function uid(prefix="id") {
  return prefix + "_" + Math.random().toString(36).slice(2, 9);
}
window.uid = uid;
window.todayDate = todayDate;

/* ------------------------------------
   🔠 Escape HTML
------------------------------------ */
function esc(text) {
  if (!text) return "";
  return String(text).replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}
window.esc = esc;

/* ------------------------------------
   📦 FIND PRODUCT
------------------------------------ */
function findProduct(type, name) {
  return window.stock.find(
    s => s.type === type && s.name.toLowerCase() === name.toLowerCase()
  );
}
window.findProduct = findProduct;

/* ------------------------------------
   🗂 TYPES (Add / Remove)
------------------------------------ */
function addType(name) {
  name = (name || "").trim();
  if (!name) return;

  if (window.types.find(t => t.name.toLowerCase() === name.toLowerCase())) {
    return;
  }

  window.types.push({ id: uid("type"), name });
  saveTypes();
}

window.addType = addType;

/* ------------------------------------
   📦 STOCK ENTRY
------------------------------------ */
function addStockEntry({ date, type, name, qty, cost, limit }) {
  date = date || todayDate();
  qty  = Number(qty || 0);
  cost = Number(cost || 0);
  limit = Number(limit || getGlobalLimit());

  if (!type || !name) return;

  let p = findProduct(type, name);

  if (!p) {
    p = { id: uid("stk"), date, type, name, qty, cost, sold: 0, history: [], limit };
    window.stock.push(p);
  } else {
    p.history.push({ date, qty, cost });
    p.qty += qty;
    p.cost = cost;
  }

  saveStock();
}

window.addStockEntry = addStockEntry;

/* ------------------------------------
   🔁 UPDATE QTY
------------------------------------ */
function updateStockQty(type, name, delta) {
  let p = findProduct(type, name);
  if (!p) return;

  p.qty = Number(p.qty) + Number(delta);
  if (p.qty < 0) p.qty = 0;

  saveStock();
}

window.updateStockQty = updateStockQty;

/* ------------------------------------
   🛒 WANTING
------------------------------------ */
function autoAddWanting(type, name, note="low stock") {
  if (!window.wanting.find(w => w.type === type && w.name === name)) {
    window.wanting.push({
      id: uid("want"),
      date: todayDate(),
      type,
      name,
      note
    });
    saveWanting();
  }
}
window.autoAddWanting = autoAddWanting;

/* ------------------------------------
   💰 EXPENSES
------------------------------------ */
function addExpense({ date, category, amount, note }) {
  window.expenses.push({
    id: uid("exp"),
    date: date || todayDate(),
    category,
    amount: Number(amount || 0),
    note: note || ""
  });
  saveExpenses();
}
window.addExpense = addExpense;

/* ------------------------------------
   🔥 STORAGE SYNC
------------------------------------ */
window.addEventListener("storage", () => {
  window.types    = toArray(safeParse(localStorage.getItem(KEY_TYPES)));
  window.stock    = toArray(safeParse(localStorage.getItem(KEY_STOCK)));
  window.sales    = toArray(safeParse(localStorage.getItem(KEY_SALES)));
  window.wanting  = toArray(safeParse(localStorage.getItem(KEY_WANTING)));
  window.expenses = toArray(safeParse(localStorage.getItem(KEY_EXPENSES)));

  if (typeof renderTypes === "function") renderTypes();
  if (typeof renderStock === "function") renderStock();
  if (typeof renderSales === "function") renderSales();
  if (typeof renderWanting === "function") renderWanting();
  if (typeof renderExpenses === "function") renderExpenses();
  if (typeof renderAnalytics === "function") renderAnalytics();
  if (typeof updateSummaryCards === "function") updateSummaryCards();
});

/* ------------------------------------
   🔧 LIMIT
------------------------------------ */
function setGlobalLimit(v) {
  localStorage.setItem(KEY_LIMIT, v);
}
function getGlobalLimit() {
  return Number(localStorage.getItem(KEY_LIMIT) || 0);
}
window.setGlobalLimit = setGlobalLimit;
window.getGlobalLimit = getGlobalLimit;

/* END OF core.js */
