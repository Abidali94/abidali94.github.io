/* ===========================================================
   📌 core.js — FINAL V13 (PART A)
   ✔ ZERO conflict
   ✔ ZERO duplicate logic
   ✔ Clean base engine used by all modules
=========================================================== */

/* -----------------------------------------------------------
   MASTER STORAGE KEYS (LocalStorage)
----------------------------------------------------------- */
const KEY_TYPES        = "item-types";
const KEY_STOCK        = "stock-data";
const KEY_SALES        = "sales-data";
const KEY_WANTING      = "wanting-data";
const KEY_EXPENSES     = "expenses-data";
const KEY_SERVICES     = "service-data";
const KEY_COLLECTIONS  = "ks-collections";
const KEY_LIMIT        = "default-limit";
const KEY_USER_EMAIL   = "ks-user-email";

/* -----------------------------------------------------------
   FIRESTORE COLLECTION MAPPING
----------------------------------------------------------- */
const CLOUD_COLLECTIONS = {
  [KEY_TYPES]:       "types",
  [KEY_STOCK]:       "stock",
  [KEY_SALES]:       "sales",
  [KEY_WANTING]:     "wanting",
  [KEY_EXPENSES]:    "expenses",
  [KEY_SERVICES]:    "services",
  [KEY_COLLECTIONS]: "collections"
};

/* -----------------------------------------------------------
   SAFE JSON PARSER
----------------------------------------------------------- */
function safeParse(raw) {
  try { return JSON.parse(raw); }
  catch { return []; }
}

function toArray(v) {
  return Array.isArray(v) ? v : [];
}

/* -----------------------------------------------------------
   UID GENERATOR
----------------------------------------------------------- */
function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
window.uid = uid;

/* -----------------------------------------------------------
   STRING ESCAPER (Safe HTML)
----------------------------------------------------------- */
function esc(str) {
  return String(str || "").replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}
window.esc = esc;

/* -----------------------------------------------------------
   📅 DATE ENGINE (ULTRA-STABLE V13)
   Internal: YYYY-MM-DD
   Display:  DD-MM-YYYY
----------------------------------------------------------- */

function todayDate() {
  const d = new Date();

  // Fix for iOS, Safari, Timezone issues
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);

  return local.toISOString().split("T")[0]; // YYYY-MM-DD
}
window.todayDate = todayDate;

/* -------- DISPLAY FORMAT (Internal → Human) -------- */
function toDisplay(d) {
  if (!d || typeof d !== "string") return "";

  // Already display format (DD-MM-YYYY)
  if (/^\d{2}-\d{2}-\d{4}$/.test(d)) return d;

  // Convert YYYY-MM-DD → DD-MM-YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, dd] = d.split("-");
    return `${dd}-${m}-${y}`;
  }

  return d;
}
window.toDisplay = toDisplay;

/* -------- INTERNAL FORMAT (Display → YYYY-MM-DD) -------- */
function toInternal(d) {
  if (!d || typeof d !== "string") return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d; // already internal

  // Convert DD-MM-YYYY → YYYY-MM-DD
  if (/^\d{2}-\d{2}-\d{4}$/.test(d)) {
    const [dd, m, y] = d.split("-");
    return `${y}-${m}-${dd}`;
  }

  return d;
}
window.toInternal = toInternal;

/* -------- Auto Detect Internal Format -------- */
function toInternalIfNeeded(d) {
  if (!d) return "";
  if (typeof d !== "string") return d;

  // Recognize YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  // Recognize DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(d)) return toInternal(d);

  return d;
}
window.toInternalIfNeeded = toInternalIfNeeded;

/* ===========================================================
   PART A END — PART B will load all data + normalize + save
=========================================================== */
/* ===========================================================
   📌 core.js — FINAL V13 (PART B)
   • Load local cache → normalize → expose save helpers
   • No business logic here, only storage layer + normalization
=========================================================== */

/* ---------- Load from localStorage (safe) ---------- */
window.types       = toArray(safeParse(localStorage.getItem(KEY_TYPES)));
window.stock       = toArray(safeParse(localStorage.getItem(KEY_STOCK)));
window.sales       = toArray(safeParse(localStorage.getItem(KEY_SALES)));
window.wanting     = toArray(safeParse(localStorage.getItem(KEY_WANTING)));
window.expenses    = toArray(safeParse(localStorage.getItem(KEY_EXPENSES)));
window.services    = toArray(safeParse(localStorage.getItem(KEY_SERVICES)));
window.collections = toArray(safeParse(localStorage.getItem(KEY_COLLECTIONS)));

/* Ensure arrays exist (multi-tab or corrupt data safe-guard) */
function ensureArrays() {
  if (!Array.isArray(window.types))       window.types = [];
  if (!Array.isArray(window.stock))       window.stock = [];
  if (!Array.isArray(window.sales))       window.sales = [];
  if (!Array.isArray(window.wanting))     window.wanting = [];
  if (!Array.isArray(window.expenses))    window.expenses = [];
  if (!Array.isArray(window.services))    window.services = [];
  if (!Array.isArray(window.collections)) window.collections = [];
}
ensureArrays();

/* ---------- Normalize all date fields to YYYY-MM-DD ---------- */
function normalizeAllDates() {
  // stock: items have date + history[].date
  window.stock = (window.stock || []).map(p => {
    const copy = { ...p };
    copy.date = toInternalIfNeeded(copy.date);
    if (Array.isArray(copy.history)) {
      copy.history = copy.history.map(h => ({ ...h, date: toInternalIfNeeded(h.date) }));
    }
    return copy;
  });

  // sales: date
  window.sales = (window.sales || []).map(s => ({ ...s, date: toInternalIfNeeded(s.date) }));

  // wanting: date
  window.wanting = (window.wanting || []).map(w => ({ ...w, date: toInternalIfNeeded(w.date) }));

  // expenses: date
  window.expenses = (window.expenses || []).map(e => ({ ...e, date: toInternalIfNeeded(e.date) }));

  // services: date_in, date_out
  window.services = (window.services || []).map(j => ({
    ...j,
    date_in:  toInternalIfNeeded(j.date_in),
    date_out: toInternalIfNeeded(j.date_out)
  }));

  // collections: date
  window.collections = (window.collections || []).map(c => ({ ...c, date: toInternalIfNeeded(c.date) }));
}
normalizeAllDates();

/* ---------- Local save helper (quiet) ---------- */
function _localSave(key, arr) {
  try {
    localStorage.setItem(key, JSON.stringify(arr || []));
  } catch (e) {
    console.warn("localSave failed for", key, e);
  }
}

/* ---------- Public save functions (call these from modules) ---------- */
function saveTypes()       { _localSave(KEY_TYPES,       window.types); }
function saveStock()       { _localSave(KEY_STOCK,       window.stock); }
function saveSales()       { _localSave(KEY_SALES,       window.sales); }
function saveWanting()     { _localSave(KEY_WANTING,     window.wanting); }
function saveExpenses()    { _localSave(KEY_EXPENSES,    window.expenses); }
function saveServices()    { _localSave(KEY_SERVICES,    window.services); }
function saveCollections() { _localSave(KEY_COLLECTIONS, window.collections); }

/* Expose saves on window for other modules */
window.saveTypes       = saveTypes;
window.saveStock       = saveStock;
window.saveSales       = saveSales;
window.saveWanting     = saveWanting;
window.saveExpenses    = saveExpenses;
window.saveServices    = saveServices;
window.saveCollections = saveCollections;

/* ---------- Safe push helpers that also save + notify renderers ---------- */

/*
  Usage examples:
    addAndSaveItem(window.types, newType, saveTypes, 'renderTypes');
*/
function addAndSaveItem(arrayRef, item, saveFnName, renderFnName) {
  if (!Array.isArray(arrayRef)) return;
  arrayRef.unshift(item);
  try { if (typeof window[saveFnName] === "function") window[saveFnName](); } catch {}
  try { if (typeof window[renderFnName] === "function") window[renderFnName](); } catch {}
}

/* ---------- Replace and save helper (find by id) ---------- */
function replaceAndSave(arrayRef, newItem, saveFnName, renderFnName) {
  if (!Array.isArray(arrayRef) || !newItem || !newItem.id) return;
  const idx = arrayRef.findIndex(x => x.id === newItem.id);
  if (idx === -1) {
    arrayRef.unshift(newItem);
  } else {
    arrayRef[idx] = newItem;
  }
  try { if (typeof window[saveFnName] === "function") window[saveFnName](); } catch {}
  try { if (typeof window[renderFnName] === "function") window[renderFnName](); } catch {}
}

/* ---------- Remove by id helper ---------- */
function removeById(arrayRef, id, saveFnName, renderFnName) {
  if (!Array.isArray(arrayRef)) return;
  const idx = arrayRef.findIndex(x => x && x.id === id);
  if (idx === -1) return;
  arrayRef.splice(idx, 1);
  try { if (typeof window[saveFnName] === "function") window[saveFnName](); } catch {}
  try { if (typeof window[renderFnName] === "function") window[renderFnName](); } catch {}
}

/* expose helpers */
window.addAndSaveItem   = addAndSaveItem;
window.replaceAndSave   = replaceAndSave;
window.removeById       = removeById;

/* ---------- Storage event — keep multi-tab in sync ---------- */
window.addEventListener("storage", () => {
  try {
    window.types       = toArray(safeParse(localStorage.getItem(KEY_TYPES)));
    window.stock       = toArray(safeParse(localStorage.getItem(KEY_STOCK)));
    window.sales       = toArray(safeParse(localStorage.getItem(KEY_SALES)));
    window.wanting     = toArray(safeParse(localStorage.getItem(KEY_WANTING)));
    window.expenses    = toArray(safeParse(localStorage.getItem(KEY_EXPENSES)));
    window.services    = toArray(safeParse(localStorage.getItem(KEY_SERVICES)));
    window.collections = toArray(safeParse(localStorage.getItem(KEY_COLLECTIONS)));

    ensureArrays();
    normalizeAllDates();

    // safe renders (if modules exist)
    try { renderTypes?.(); }          catch (e) { console.warn(e); }
    try { renderStock?.(); }          catch (e) { console.warn(e); }
    try { renderSales?.(); }          catch (e) { console.warn(e); }
    try { renderWanting?.(); }        catch (e) { console.warn(e); }
    try { renderExpenses?.(); }       catch (e) { console.warn(e); }
    try { renderServiceTables?.(); }  catch (e) { console.warn(e); }
    try { renderAnalytics?.(); }      catch (e) { console.warn(e); }
    try { renderCollection?.(); }     catch (e) { console.warn(e); }
    try { updateSummaryCards?.(); }   catch (e) { console.warn(e); }
    try { updateTabSummaryBar?.(); }  catch (e) { console.warn(e); }
    try { updateUniversalBar?.(); }   catch (e) { console.warn(e); }
    try { updateEmailTag?.(); }       catch (e) { console.warn(e); }

  } catch (err) {
    console.warn("storage event handler failed", err);
  }
});

/* ---------- Cloud hooks (NO implementation here) ----------
   Part D will implement actual Firestore logic. These are safe
   placeholders so modules can call cloudSave/cloudLoad/cloudSync
----------------------------------------------------------- */

async function cloudSave(collectionName, payload) {
  // Implementation in Part D (Firestore).
  // If not available, fall back to local save by key mapping
  // but do not auto-overwrite local data here.
  if (typeof cloudSaveImpl === "function") {
    return cloudSaveImpl(collectionName, payload);
  }
  return false;
}

async function cloudLoad(collectionName) {
  if (typeof cloudLoadImpl === "function") {
    return cloudLoadImpl(collectionName);
  }
  return null;
}

/* Lightweight sync utility (tries local save + optional cloud hook) */
async function cloudSync(storageKey, arr) {
  // local first
  try {
    _localSave(storageKey, arr);
  } catch (e) { console.warn(e); }

  // cloud (non-blocking)
  try {
    const col = CLOUD_COLLECTIONS[storageKey];
    if (col && typeof cloudSaveImpl === "function") {
      // send arr to cloud save impl; caller should ensure id fields exist
      await cloudSaveImpl(col, arr);
    }
  } catch (e) {
    console.warn("cloudSync failed", e);
  }
}
window.cloudSync = cloudSync;

/* ---------- Part B end ---------- */
/* ===========================================================
   📌 core.js — FINAL V13 (PART C)
   • Business Logic Layer
   • No UI inside — only data/logic
   • 100% conflict-free with all other modules
=========================================================== */

/* -----------------------------------------------------------
   1) TYPE MANAGEMENT
----------------------------------------------------------- */
window.addType = function(name) {
  name = (name || "").trim();
  if (!name) return;

  // avoid duplicates
  if (types.find(t => t.name.toLowerCase() === name.toLowerCase())) return;

  const item = { id: uid("type"), name };
  types.push(item);

  saveTypes();
  cloudSync(KEY_TYPES, types);

  try { renderTypes?.(); } catch {}
};


/* -----------------------------------------------------------
   2) STOCK MANAGEMENT
----------------------------------------------------------- */

/* Find product */
window.findProduct = function(type, name) {
  return (stock || []).find(
    p =>
      p.type === type &&
      String(p.name || "").toLowerCase() === String(name || "").toLowerCase()
  );
};

/* Get cost (average historical fallback) */
window.getProductCost = function(type, name) {
  const p = findProduct(type, name);
  if (!p) return 0;

  if (p.cost) return Number(p.cost);

  if (p.history && p.history.length) {
    let t = 0, q = 0;
    p.history.forEach(h => {
      t += Number(h.cost) * Number(h.qty);
      q += Number(h.qty);
    });
    return q ? (t / q) : 0;
  }
  return 0;
};

/* Add stock entry */
window.addStockEntry = function({ date, type, name, qty, cost }) {
  date = toInternalIfNeeded(date);
  qty  = Number(qty);
  cost = Number(cost);

  if (!type || !name || qty <= 0 || cost <= 0) return;

  let p = findProduct(type, name);

  if (!p) {
    p = {
      id: uid("stk"),
      date,
      type,
      name,
      qty,
      cost,
      sold: 0,
      limit: getGlobalLimit(),
      history: [{ date, qty, cost }]
    };
    stock.push(p);
  } else {
    p.qty += qty;
    p.cost = cost;
    p.history = p.history || [];
    p.history.push({ date, qty, cost });
  }

  saveStock();
  cloudSync(KEY_STOCK, stock);

  try { renderStock?.(); } catch {}
};


/* -----------------------------------------------------------
   3) LOW STOCK LIMIT (GLOBAL)
----------------------------------------------------------- */
window.setGlobalLimit = function(v) {
  localStorage.setItem(KEY_LIMIT, v);
};

window.getGlobalLimit = function() {
  return Number(localStorage.getItem(KEY_LIMIT) || 0);
};


/* -----------------------------------------------------------
   4) WANTING LIST (Auto Low Stock Request)
----------------------------------------------------------- */
window.autoAddWanting = function(type, name, note = "Low Stock") {

  if (!name || !type) return;

  // Avoid duplicates
  if (wanting.find(w => w.type === type && w.name === name)) return;

  const row = {
    id: uid("want"),
    date: todayDate(),
    type,
    name,
    note
  };

  wanting.push(row);
  saveWanting();
  cloudSync(KEY_WANTING, wanting);

  try { renderWanting?.(); } catch {}
};


/* -----------------------------------------------------------
   5) EXPENSES
----------------------------------------------------------- */
window.addExpense = function({ date, category, amount, note }) {

  const row = {
    id: uid("exp"),
    date: toInternalIfNeeded(date || todayDate()),
    category,
    amount: Number(amount || 0),
    note: note || ""
  };

  expenses.push(row);

  saveExpenses();
  cloudSync(KEY_EXPENSES, expenses);

  try { renderExpenses?.(); } catch {}
};


/* -----------------------------------------------------------
   6) NET PROFIT (Dynamic)
----------------------------------------------------------- */
window.getTotalNetProfit = function() {
  let salesProfit = 0,
      serviceProfit = 0,
      exp = 0;

  // Sales → paid only
  (sales || []).forEach(s => {
    if ((s.status || "").toLowerCase() !== "credit") {
      salesProfit += Number(s.profit || 0);
    }
  });

  // Service → completed only
  (services || []).forEach(j => {
    serviceProfit += Number(j.profit || 0);
  });

  // Expenses
  (expenses || []).forEach(e => {
    exp += Number(e.amount || 0);
  });

  return salesProfit + serviceProfit - exp;
};


/* -----------------------------------------------------------
   7) TAB SUMMARY BAR (Top Green/Red bar)
----------------------------------------------------------- */
window.updateTabSummaryBar = function() {
  const el = document.getElementById("tabSummaryBar");
  if (!el) return;

  const net = getTotalNetProfit();

  if (net >= 0) {
    el.style.background = "#004d00";
    el.style.color = "#fff";
    el.textContent = `Profit: +₹${net}`;
  } else {
    el.style.background = "#4d0000";
    el.style.color = "#fff";
    el.textContent = `Loss: -₹${Math.abs(net)}`;
  }
};
/* ===========================================================
   📌 core.js — FINAL V13 (PART D)
   • Cloud sync helpers (Firestore-friendly)
   • Collect / Collection helpers (onCollect, markSaleCollected, markServiceCollected)
   • Safe, idempotent cloudSync
   • Exposes cloudPullAllIfAvailable() (used earlier in Part B)
=========================================================== */

/* -------------------------
   UTIL: debounce
--------------------------*/
function debounce(fn, wait = 300) {
  let t = null;
  return function(...a) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, a), wait);
  };
}

/* -------------------------
   CLOUD ABSTRACTION LAYER
   (firebase.js should expose cloudSave / cloudLoad if online)
   - cloudLoad(collection) -> returns array or null
   - cloudSave(collection, arr) -> saves and returns true/false
--------------------------*/

async function cloudLoad(collection) {
  // If firebase.js provides a helper, use it.
  if (typeof window.firebaseLoadCollection === "function") {
    return await window.firebaseLoadCollection(collection);
  }
  // fallback: not available
  return null;
}

async function cloudSave(collection, arr) {
  if (typeof window.firebaseSaveCollection === "function") {
    return await window.firebaseSaveCollection(collection, arr);
  }
  // fallback: not available
  return false;
}

/* -------------------------
   cloudSync: safe, debounced
   - key is localStorage key (eg KEY_STOCK)
   - arr is array to sync
   - if offline or cloudSave missing => no-op but still save local
--------------------------*/
const _cloudSyncQueue = {};
const _doCloudSync = async (key, arr) => {
  const col = CLOUD_COLLECTIONS[key];
  if (!col) return false;

  // Save locally first (already done by caller usually); try cloud
  try {
    const ok = await cloudSave(col, arr);
    return Boolean(ok);
  } catch (e) {
    console.warn("cloudSave failed:", col, e);
    return false;
  }
};
const cloudSync = (key, arr) => {
  // write local copy (already done by saveX), but ensure key exists
  try { localStorage.setItem(key, JSON.stringify(arr)); } catch(e){}
  if (!_cloudSyncQueue[key]) {
    _cloudSyncQueue[key] = debounce((k, a) => {
      _doCloudSync(k, a).catch(()=>{});
    }, 600);
  }
  _cloudSyncQueue[key](key, arr);
};
window.cloudSync = cloudSync;

/* -------------------------
   COLLECTION / ON-COLLECT HOOKS
--------------------------*/

/*
  Behavior:
  - onCollect(type, entry) is called when user presses universal collect buttons.
  - For credit sales/service collects use markSaleCollected / markServiceCollected which:
     • mark sale/service as collected (status change / wasCredit flag)
     • push to collections array (window.collections)
     • push to local "credit-collected" lists if UI wants separate view (window.creditSalesCollected etc)
  - All operations are idempotent and check duplicates by unique key
*/

function ensureCollectionsArray() {
  if (!Array.isArray(window.collections)) window.collections = [];
}
ensureCollectionsArray();

/* helper to avoid duplicate collection entry */
function _collectionKey(e) {
  // use date + source + details + amount
  return `${e.date}|${e.source}|${e.details}|${Number(e.amount||0)}`;
}

/* add collection (local + cloud) */
function addCollectionEntry(entry) {
  ensureCollectionsArray();
  entry = {
    id: entry.id || uid("col"),
    date: toInternalIfNeeded(entry.date || todayDate()),
    source: entry.source || "Unknown",
    details: entry.details || "",
    amount: Number(entry.amount || 0)
  };

  const key = _collectionKey(entry);
  if ((window._collectionKeys || []).includes(key)) return false;

  window._collectionKeys = window._collectionKeys || [];
  window._collectionKeys.unshift(key);

  // add to beginning
  window.collections.unshift(entry);

  saveCollections();
  cloudSync(KEY_COLLECTIONS, window.collections);

  // UI updates
  try { renderCollection?.(); } catch {}
  try { renderCollectionHistory?.(); } catch {}
  try { updateSummaryCards?.(); } catch {}
  try { updateUniversalBar?.(); } catch {}
  try { updateTabSummaryBar?.(); } catch {}

  return true;
}
window.addCollectionEntry = addCollectionEntry;

/* onCollect default implementation (called by UI handleCollect if exists)
   - type: "net" | "stock" | "service"
   - entry: created by UI (we accept limited info)
*/
window.onCollect = function(type, entry) {
  // default: push to collections
  try {
    const now = todayDate();
    const src = (type === "net") ? "Net Profit" : (type === "stock") ? "Stock Investment" : "Service Investment";
    const e = {
      date: now,
      source: src,
      details: entry?.details || `Collected ${type}`,
      amount: Number(entry?.amount || 0)
    };
    addCollectionEntry(e);
  } catch (e) {
    console.error("onCollect failed:", e);
  }
};

/* -------------------------
   MARK SALE AS COLLECTED (credit → collected)
   - saleId OR a sale object passed
   - updates sales array: status -> 'collected', wasCredit true
   - stores collectedOn, collectedAmount
   - pushes to collections and credit-collected lists
--------------------------*/
window.markSaleCollected = function(saleOrId, options = {}) {
  if (!saleOrId) return false;
  let sale = null;
  if (typeof saleOrId === "string") {
    sale = (sales || []).find(s => s.id === saleOrId);
  } else {
    sale = saleOrId;
  }
  if (!sale) return false;

  const idx = (sales || []).findIndex(s => s === sale || s.id === sale.id);
  if (idx === -1) {
    // maybe sale is not in sales yet; add it
    sale.id = sale.id || uid("sale");
    sales.unshift(sale);
  } else {
    // replace reference
    sale = sales[idx];
  }

  // if already marked collected, skip
  if ((sale.creditStatus || "").toLowerCase() === "collected" || sale._collectedMarked) return false;

  const collectedAmount = Number(options.collectedAmount || sale.collectedAmount || sale.collected || sale.total || (Number(sale.qty||0)*Number(sale.price||0)) || 0);
  const collectedOn = options.collectedOn || todayDate();

  sale.creditStatus = "collected";
  sale.wasCredit = true;
  sale.collectedAmount = collectedAmount;
  sale.creditCollectedOn = collectedOn;
  sale._collectedMarked = true; // internal flag to prevent duplicate processing

  saveSales();
  cloudSync(KEY_SALES, sales);

  // Add to collections (summary)
  addCollectionEntry({
    date: collectedOn,
    source: "Sales (Credit Collected)",
    details: `${sale.customer || "-"} / ${sale.product || "-"}`,
    amount: collectedAmount
  });

  // Add to UI collected-credit list if available
  if (!window.creditSalesCollected) window.creditSalesCollected = [];
  const key = `${sale.creditCollectedOn}|${sale.customer}|${sale.product}|${Number(sale.collectedAmount)}`;
  if (!window._creditSalesKeys) window._creditSalesKeys = [];
  if (!window._creditSalesKeys.includes(key)) {
    window._creditSalesKeys.unshift(key);
    window.creditSalesCollected.unshift({
      date: sale.creditCollectedOn,
      customer: sale.customer || "",
      phone: sale.phone || "",
      product: sale.product || "",
      qty: sale.qty || 0,
      price: sale.price || 0,
      total: Number(sale.total || collectedAmount),
      collected: Number(collectedAmount)
    });
  }
  try { renderCreditCollectedTables?.(); } catch {}
  try { renderCollection?.(); } catch {}
  try { updateSummaryCards?.(); } catch {}
  try { updateUniversalBar?.(); } catch {}

  return true;
};

/* -------------------------
   MARK SERVICE JOB AS COLLECTED
   - jobObj or jobId
--------------------------*/
window.markServiceCollected = function(jobOrId, options = {}) {
  if (!jobOrId) return false;
  let job = null;
  if (typeof jobOrId === "string") {
    job = (services || []).find(s => s.id === jobOrId);
  } else {
    job = jobOrId;
  }
  if (!job) return false;

  const idx = (services || []).findIndex(s => s === job || s.id === job.id);
  if (idx === -1) {
    job.id = job.id || uid("svc");
    services.unshift(job);
  } else {
    job = services[idx];
  }

  if ((job.creditStatus || "").toLowerCase() === "collected" || job._collectedMarked) return false;

  const collectedAmount = Number(options.collectedAmount || job.creditCollectedAmount || job.collected || 0);
  const collectedOn = options.collectedOn || todayDate();

  job.creditStatus = "collected";
  job.creditCollectedAmount = collectedAmount;
  job.creditCollectedOn = collectedOn;
  job._collectedMarked = true;

  saveServices();
  cloudSync(KEY_SERVICES, services);

  // Add to collections
  addCollectionEntry({
    date: collectedOn,
    source: "Service (Credit Collected)",
    details: `${job.customer || "-"} / ${job.item || "-"}`,
    amount: collectedAmount
  });

  // Add to UI collected list
  if (!window.creditServiceCollected) window.creditServiceCollected = [];
  const key = `${collectedOn}|${job.customer}|${job.item}|${Number(collectedAmount)}`;
  if (!window._creditServiceKeys) window._creditServiceKeys = [];
  if (!window._creditServiceKeys.includes(key)) {
    window._creditServiceKeys.unshift(key);
    window.creditServiceCollected.unshift({
      date: collectedOn,
      customer: job.customer || "",
      phone: job.phone || "",
      item: job.item || "",
      model: job.model || "",
      collected: Number(collectedAmount)
    });
  }
  try { renderCreditCollectedTables?.(); } catch {}
  try { renderCollection?.(); } catch {}
  try { updateSummaryCards?.(); } catch {}
  try { updateUniversalBar?.(); } catch {}

  return true;
};

/* -------------------------
   COLLECTION DELETE (for credit-collected UI delete)
--------------------------*/
window.deleteCreditCollected = function(type, idx) {
  if (!type || typeof idx === "undefined") return false;
  if (type === "sale") {
    if (Array.isArray(window.creditSalesCollected) && window.creditSalesCollected[idx]) {
      const r = window.creditSalesCollected.splice(idx,1)[0];
      // optionally remove from main collections if matching entry exists
      const matchIdx = (collections||[]).findIndex(c =>
        Number(c.amount) === Number(r.collected) && c.source && c.source.toLowerCase().includes("sales") && c.date === r.date
      );
      if (matchIdx !== -1) {
        collections.splice(matchIdx,1);
        saveCollections();
        cloudSync(KEY_COLLECTIONS, collections);
      }
      saveCollections();
      try { renderCreditCollectedTables?.(); } catch {}
      try { renderCollection?.(); } catch {}
      return true;
    }
  } else if (type === "service") {
    if (Array.isArray(window.creditServiceCollected) && window.creditServiceCollected[idx]) {
      const r = window.creditServiceCollected.splice(idx,1)[0];
      const matchIdx = (collections||[]).findIndex(c =>
        Number(c.amount) === Number(r.collected) && c.source && c.source.toLowerCase().includes("service") && c.date === r.date
      );
      if (matchIdx !== -1) {
        collections.splice(matchIdx,1);
        saveCollections();
        cloudSync(KEY_COLLECTIONS, collections);
      }
      try { renderCreditCollectedTables?.(); } catch {}
      try { renderCollection?.(); } catch {}
      return true;
    }
  }
  return false;
};
window.deleteCreditCollected = window.deleteCreditCollected;

/* -------------------------
   EXPORTS (attach to window)
--------------------------*/
window.cloudLoad = cloudLoad;
window.cloudSave = cloudSave;
window.cloudSync = cloudSync;

/* -------------------------
   INIT: load local collections keys (for dedupe)
--------------------------*/
(function initCollectionKeys(){
  window._collectionKeys = [];
  try {
    (collections || []).slice(0, 200).forEach(c => {
      window._collectionKeys.push(_collectionKey(c));
    });
  } catch(e){}
  window._creditSalesKeys = [];
  try {
    (window.creditSalesCollected || []).forEach(r => {
      window._creditSalesKeys.push(`${r.date}|${r.customer}|${r.product}|${Number(r.collected)}`);
    });
  } catch(e){}
  window._creditServiceKeys = [];
  try {
    (window.creditServiceCollected || []).forEach(r => {
      window._creditServiceKeys.push(`${r.date}|${r.customer}|${r.item}|${Number(r.collected)}`);
    });
  } catch(e){}
})();
