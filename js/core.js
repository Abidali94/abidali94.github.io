/* ===========================================================
   core.js — PART A
   Utilities: safe JSON, UID, esc, date helpers
   (No DOM, no side-effects)
=========================================================== */

/* ---------- MASTER STORAGE KEYS ---------- */
const KEY_TYPES        = "item-types";
const KEY_STOCK        = "stock-data";
const KEY_SALES        = "sales-data";
const KEY_WANTING      = "wanting-data";
const KEY_EXPENSES     = "expenses-data";
const KEY_SERVICES     = "service-data";
const KEY_COLLECTIONS  = "ks-collections";
const KEY_LIMIT        = "default-limit";
const KEY_USER_EMAIL   = "ks-user-email";

/* ---------- CLOUD COLLECTION MAP (used by cloud sync) ---------- */
const CLOUD_COLLECTIONS = {
  [KEY_TYPES]:       "types",
  [KEY_STOCK]:       "stock",
  [KEY_SALES]:       "sales",
  [KEY_WANTING]:     "wanting",
  [KEY_EXPENSES]:    "expenses",
  [KEY_SERVICES]:    "services",
  [KEY_COLLECTIONS]: "collections"
};

/* ---------- SAFE PARSER / ARRAY GUARD ---------- */
function safeParse(raw) {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch (e) { return []; }
}
function toArray(v) { return Array.isArray(v) ? v : []; }

/* ---------- UID GENERATOR ---------- */
function uid(prefix = "id") {
  return `${String(prefix)}_${Math.random().toString(36).slice(2,10)}`;
}
window.uid = uid;

/* ---------- SAFE ESCAPE FOR HTML ---------- */
function esc(s) {
  return String(s || "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));
}
window.esc = esc;

/* ===========================================================
   DATE HELPERS (Internal: YYYY-MM-DD, Display: DD-MM-YYYY)
   Robust for timezones (uses local ISO date)
=========================================================== */
function todayDate() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().split("T")[0]; // YYYY-MM-DD
}
window.todayDate = todayDate;

function toDisplay(d) {
  if (!d || typeof d !== "string") return "";
  if (/^\d{2}-\d{2}-\d{4}$/.test(d)) return d;            // already DD-MM-YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y,m,dd] = d.split("-");
    return `${dd}-${m}-${y}`;
  }
  return d;
}
window.toDisplay = toDisplay;

function toInternal(d) {
  if (!d || typeof d !== "string") return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;            // already YYYY-MM-DD
  if (/^\d{2}-\d{2}-\d{4}$/.test(d)) {
    const [dd,m,y] = d.split("-");
    return `${y}-${m}-${dd}`;
  }
  return d;
}
window.toInternal = toInternal;

function toInternalIfNeeded(d) {
  if (!d) return "";
  if (typeof d !== "string") return d;
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  if (/^\d{2}-\d{2}-\d{4}$/.test(d)) return toInternal(d);
  return d;
}
window.toInternalIfNeeded = toInternalIfNeeded;

/* Part A complete — attach nothing else here to avoid conflicts */
/* ===========================================================
   core.js — PART B
   Load local cache, normalize dates, and provide save helpers
   (No business logic; idempotent)
=========================================================== */

/* ---------- LOAD FROM localStorage (safe) ---------- */
window.types       = toArray(safeParse(localStorage.getItem(KEY_TYPES)));
window.stock       = toArray(safeParse(localStorage.getItem(KEY_STOCK)));
window.sales       = toArray(safeParse(localStorage.getItem(KEY_SALES)));
window.wanting     = toArray(safeParse(localStorage.getItem(KEY_WANTING)));
window.expenses    = toArray(safeParse(localStorage.getItem(KEY_EXPENSES)));
window.services    = toArray(safeParse(localStorage.getItem(KEY_SERVICES)));
window.collections = toArray(safeParse(localStorage.getItem(KEY_COLLECTIONS)));

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

/* ---------- NORMALIZE DATES (convert fields to YYYY-MM-DD) ---------- */
function normalizeAllDates() {
  try {
    window.stock = (window.stock || []).map(p => {
      const copy = { ...p };
      copy.date = toInternalIfNeeded(copy.date);
      if (Array.isArray(copy.history)) {
        copy.history = copy.history.map(h => ({ ...h, date: toInternalIfNeeded(h.date) }));
      }
      return copy;
    });

    window.sales = (window.sales || []).map(s => ({ ...s, date: toInternalIfNeeded(s.date) }));
    window.wanting = (window.wanting || []).map(w => ({ ...w, date: toInternalIfNeeded(w.date) }));
    window.expenses = (window.expenses || []).map(e => ({ ...e, date: toInternalIfNeeded(e.date) }));
    window.services = (window.services || []).map(j => ({
      ...j,
      date_in: toInternalIfNeeded(j.date_in),
      date_out: toInternalIfNeeded(j.date_out)
    }));
    window.collections = (window.collections || []).map(c => ({ ...c, date: toInternalIfNeeded(c.date) }));
  } catch (e) {
    console.warn("normalizeAllDates error", e);
  }
}
normalizeAllDates();

/* ---------- LOCAL SAVE helper (quiet) ---------- */
function _localSave(key, arr) {
  try { localStorage.setItem(key, JSON.stringify(arr || [])); } catch (e) { console.warn("local save failed", key, e); }
}

/* ---------- PUBLIC save functions ---------- */
function saveTypes()       { _localSave(KEY_TYPES,       window.types); }
function saveStock()       { _localSave(KEY_STOCK,       window.stock); }
function saveSales()       { _localSave(KEY_SALES,       window.sales); }
function saveWanting()     { _localSave(KEY_WANTING,     window.wanting); }
function saveExpenses()    { _localSave(KEY_EXPENSES,    window.expenses); }
function saveServices()    { _localSave(KEY_SERVICES,    window.services); }
function saveCollections() { _localSave(KEY_COLLECTIONS, window.collections); }

window.saveTypes       = saveTypes;
window.saveStock       = saveStock;
window.saveSales       = saveSales;
window.saveWanting     = saveWanting;
window.saveExpenses    = saveExpenses;
window.saveServices    = saveServices;
window.saveCollections = saveCollections;

/* ---------- UTILITY helpers for modules (safe notify) ---------- */
function addAndSaveItem(arrayRef, item, saveFnName, renderFnName) {
  if (!Array.isArray(arrayRef) || !item) return;
  arrayRef.unshift(item);
  try { if (typeof window[saveFnName] === "function") window[saveFnName](); } catch {}
  try { if (typeof window[renderFnName] === "function") window[renderFnName](); } catch {}
}
function replaceAndSave(arrayRef, item, saveFnName, renderFnName) {
  if (!Array.isArray(arrayRef) || !item || !item.id) return;
  const idx = arrayRef.findIndex(x => x && x.id === item.id);
  if (idx === -1) arrayRef.unshift(item);
  else arrayRef[idx] = item;
  try { if (typeof window[saveFnName] === "function") window[saveFnName](); } catch {}
  try { if (typeof window[renderFnName] === "function") window[renderFnName](); } catch {}
}
function removeById(arrayRef, id, saveFnName, renderFnName) {
  if (!Array.isArray(arrayRef)) return;
  const idx = arrayRef.findIndex(x => x && x.id === id);
  if (idx === -1) return;
  arrayRef.splice(idx,1);
  try { if (typeof window[saveFnName] === "function") window[saveFnName](); } catch {}
  try { if (typeof window[renderFnName] === "function") window[renderFnName](); } catch {}
}
window.addAndSaveItem = addAndSaveItem;
window.replaceAndSave = replaceAndSave;
window.removeById = removeById;

/* ---------- STORAGE EVENT (multi-tab) ---------- */
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

    // Safe render hooks (modules may define these)
    try { renderTypes?.(); }          catch(err){console.warn(err);}
    try { renderStock?.(); }          catch(err){console.warn(err);}
    try { renderSales?.(); }          catch(err){console.warn(err);}
    try { renderWanting?.(); }        catch(err){console.warn(err);}
    try { renderExpenses?.(); }       catch(err){console.warn(err);}
    try { renderServiceTables?.(); }  catch(err){console.warn(err);}
    try { renderAnalytics?.(); }      catch(err){console.warn(err);}
    try { renderCollection?.(); }     catch(err){console.warn(err);}
    try { updateSummaryCards?.(); }   catch(err){console.warn(err);}
    try { updateTabSummaryBar?.(); }  catch(err){console.warn(err);}
    try { updateUniversalBar?.(); }   catch(err){console.warn(err);}
    try { updateEmailTag?.(); }       catch(err){console.warn(err);}

  } catch (e) {
    console.warn("storage event failed", e);
  }
});

/* Part B complete */
/* ===========================================================
   core.js — PART C
   Business Logic: types, stock, wanting, expenses, profit calc
   (Exposes functions on window but no DOM manipulation)
=========================================================== */

/* ---------- TYPE MANAGEMENT ---------- */
window.addType = function(name) {
  name = (name || "").trim();
  if (!name) return false;
  if ((window.types || []).some(t => t.name.toLowerCase() === name.toLowerCase())) return false;
  const item = { id: uid("type"), name };
  window.types.push(item);
  saveTypes();
  cloudSync(KEY_TYPES, window.types);
  try { renderTypes?.(); } catch {}
  return true;
};

/* ---------- STOCK HELPERS ---------- */
window.findProduct = function(type, name) {
  return (window.stock || []).find(p =>
    p.type === type && String(p.name || "").toLowerCase() === String(name || "").toLowerCase()
  );
};

window.getProductCost = function(type, name) {
  const p = window.findProduct(type, name);
  if (!p) return 0;
  if (p.cost) return Number(p.cost);
  if (Array.isArray(p.history) && p.history.length) {
    let t = 0, q = 0;
    p.history.forEach(h => { t += Number(h.cost || 0) * Number(h.qty || 0); q += Number(h.qty || 0); });
    return q ? t/q : 0;
  }
  return 0;
};

window.addStockEntry = function({ date, type, name, qty, cost }) {
  date = toInternalIfNeeded(date);
  qty = Number(qty);
  cost = Number(cost);
  if (!type || !name || qty <= 0 || cost <= 0) return false;

  let p = window.findProduct(type, name);
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
    window.stock.push(p);
  } else {
    p.qty = Number(p.qty || 0) + qty;
    p.cost = cost;
    p.history = p.history || [];
    p.history.push({ date, qty, cost });
  }

  saveStock();
  cloudSync(KEY_STOCK, window.stock);
  try { renderStock?.(); } catch {}
  return true;
};

/* ---------- GLOBAL LOW STOCK LIMIT ---------- */
window.setGlobalLimit = function(v) { localStorage.setItem(KEY_LIMIT, v); };
window.getGlobalLimit = function() { return Number(localStorage.getItem(KEY_LIMIT) || 0); };

/* ---------- WANTING LIST ---------- */
window.autoAddWanting = function(type, name, note = "Low Stock") {
  if (!type || !name) return false;
  if ((window.wanting || []).some(w => w.type === type && w.name === name)) return false;
  const row = { id: uid("want"), date: todayDate(), type, name, note };
  window.wanting.push(row);
  saveWanting();
  cloudSync(KEY_WANTING, window.wanting);
  try { renderWanting?.(); } catch {}
  return true;
};

/* ---------- EXPENSES ---------- */
window.addExpense = function({ date, category, amount, note }) {
  const row = {
    id: uid("exp"),
    date: toInternalIfNeeded(date || todayDate()),
    category,
    amount: Number(amount || 0),
    note: note || ""
  };
  window.expenses.push(row);
  saveExpenses();
  cloudSync(KEY_EXPENSES, window.expenses);
  try { renderExpenses?.(); } catch {}
  return true;
};

/* ---------- NET PROFIT (dynamic) ---------- */
window.getTotalNetProfit = function() {
  let salesProfit = 0, serviceProfit = 0, exp = 0;
  (window.sales || []).forEach(s => {
    if ((s.status || "").toLowerCase() !== "credit") salesProfit += Number(s.profit || 0);
  });
  (window.services || []).forEach(j => { serviceProfit += Number(j.profit || 0); });
  (window.expenses || []).forEach(e => { exp += Number(e.amount || 0); });
  return salesProfit + serviceProfit - exp;
};

/* ---------- TAB SUMMARY BAR ---------- */
window.updateTabSummaryBar = function() {
  try {
    const el = document.getElementById && document.getElementById("tabSummaryBar");
    if (!el) return;
    const net = window.getTotalNetProfit();
    if (net >= 0) {
      el.style.background = "#004d00"; el.style.color = "#fff"; el.textContent = `Profit: +₹${net}`;
    } else {
      el.style.background = "#4d0000"; el.style.color = "#fff"; el.textContent = `Loss: -₹${Math.abs(net)}`;
    }
  } catch (e) { /* no-op if DOM not present */ }
};

/* Part C complete */
/* ===========================================================
   core.js — PART D
   Cloud abstraction + collection engine + mark-collected helpers
   (Cloud implementation must be provided by firebase.js or similar)
=========================================================== */

/* ---------- debounce helper ---------- */
function debounce(fn, wait = 300) {
  let t = null;
  return function(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

/* ---------- CLOUD ADAPTER HOOKS (placeholder) ----------
   If firebase.js defines `firebaseSaveCollection` / `firebaseLoadCollection`,
   core will use them. This file DOES NOT initialize firebase.
----------------------------------------------------------- */
async function _cloudSaveImpl(collection, arr) {
  if (typeof window.firebaseSaveCollection === "function") {
    return await window.firebaseSaveCollection(collection, arr);
  }
  return false;
}
async function _cloudLoadImpl(collection) {
  if (typeof window.firebaseLoadCollection === "function") {
    return await window.firebaseLoadCollection(collection);
  }
  return null;
}

/* ---------- debounced cloudSync (key = localStorage key) ---------- */
const _cloudQueue = {};
async function _doCloudSync(key, arr) {
  const col = CLOUD_COLLECTIONS[key];
  if (!col) return false;
  try {
    const ok = await _cloudSaveImpl(col, arr);
    return Boolean(ok);
  } catch (e) {
    console.warn("cloud save failed", col, e);
    return false;
  }
}
window.cloudSync = function(key, arr) {
  // local save first (caller usually did this)
  try { localStorage.setItem(key, JSON.stringify(arr || [])); } catch(e){}
  if (!_cloudQueue[key]) {
    _cloudQueue[key] = debounce((k,a) => { _doCloudSync(k,a).catch(()=>{}); }, 600);
  }
  _cloudQueue[key](key, arr);
};

/* ---------- cloudLoad wrapper (used by UI to pull remote data) ---------- */
window.cloudLoad = async function(collection) {
  return await _cloudLoadImpl(collection);
};

/* ---------- Collections (on-collect) ---------- */
function ensureCollectionsArray() { if (!Array.isArray(window.collections)) window.collections = []; }
ensureCollectionsArray();

function _collectionKey(e) {
  return `${e.date}|${e.source}|${e.details}|${Number(e.amount||0)}`;
}

/* add collection entry (local + cloud), deduped */
function addCollectionEntry(entry) {
  try {
    ensureCollectionsArray();
    const normalized = {
      id: entry.id || uid("col"),
      date: toInternalIfNeeded(entry.date || todayDate()),
      source: entry.source || "Unknown",
      details: entry.details || "",
      amount: Number(entry.amount || 0)
    };
    const key = _collectionKey(normalized);
    window._collectionKeys = window._collectionKeys || [];
    if (window._collectionKeys.includes(key)) return false;
    window._collectionKeys.unshift(key);
    window.collections.unshift(normalized);
    saveCollections();
    cloudSync(KEY_COLLECTIONS, window.collections);

    // UI updates (if available)
    try { renderCollection?.(); } catch {}
    try { renderCollectionHistory?.(); } catch {}
    try { updateSummaryCards?.(); } catch {}
    try { updateUniversalBar?.(); } catch {}
    try { updateTabSummaryBar?.(); } catch {}

    return true;
  } catch (e) {
    console.error("addCollectionEntry failed", e);
    return false;
  }
}
window.addCollectionEntry = addCollectionEntry;

/* ---------- Default onCollect (used by UI fallback) ---------- */
window.onCollect = function(type, entry) {
  try {
    const now = todayDate();
    const src = (type === "net") ? "Net Profit" : (type === "stock") ? "Stock Investment" : "Service Investment";
    const e = {
      date: now,
      source: src,
      details: entry?.details || `Collected ${String(type||"")}`,
      amount: Number(entry?.amount || 0)
    };
    return addCollectionEntry(e);
  } catch (err) {
    console.error("onCollect failed", err);
    return false;
  }
};

/* ---------- MARK SALE COLLECTED (idempotent) ---------- */
window.markSaleCollected = function(saleOrId, opts = {}) {
  try {
    if (!saleOrId) return false;
    let sale = null;
    if (typeof saleOrId === "string") sale = (window.sales || []).find(s => s.id === saleOrId);
    else sale = saleOrId;
    if (!sale) return false;

    // ensure in sales array reference
    const idx = (window.sales || []).findIndex(s => s && (s === sale || s.id === sale.id));
    if (idx === -1) {
      sale.id = sale.id || uid("sale"); window.sales.unshift(sale);
    } else {
      sale = window.sales[idx];
    }

    if ((sale.creditStatus || "").toLowerCase() === "collected" || sale._collectedMarked) return false;

    const collectedAmount = Number(opts.collectedAmount || sale.collectedAmount || sale.collected || sale.total || (Number(sale.qty||0)*Number(sale.price||0)) || 0);
    const collectedOn = opts.collectedOn || todayDate();

    sale.creditStatus = "collected";
    sale.wasCredit = true;
    sale.collectedAmount = collectedAmount;
    sale.creditCollectedOn = collectedOn;
    sale._collectedMarked = true;

    saveSales();
    cloudSync(KEY_SALES, window.sales);

    addCollectionEntry({
      date: collectedOn,
      source: "Sales (Credit Collected)",
      details: `${sale.customer || "-"} / ${sale.product || "-"}`,
      amount: collectedAmount
    });

    // maintain creditSalesCollected UI array
    window.creditSalesCollected = window.creditSalesCollected || [];
    const key = `${collectedOn}|${sale.customer}|${sale.product}|${Number(collectedAmount)}`;
    window._creditSalesKeys = window._creditSalesKeys || [];
    if (!window._creditSalesKeys.includes(key)) {
      window._creditSalesKeys.unshift(key);
      window.creditSalesCollected.unshift({
        date: collectedOn,
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
  } catch (e) {
    console.error("markSaleCollected error", e);
    return false;
  }
};

/* ---------- MARK SERVICE COLLECTED (idempotent) ---------- */
window.markServiceCollected = function(jobOrId, opts = {}) {
  try {
    if (!jobOrId) return false;
    let job = null;
    if (typeof jobOrId === "string") job = (window.services || []).find(s => s.id === jobOrId);
    else job = jobOrId;
    if (!job) return false;

    const idx = (window.services || []).findIndex(s => s && (s === job || s.id === job.id));
    if (idx === -1) { job.id = job.id || uid("svc"); window.services.unshift(job); }
    else job = window.services[idx];

    if ((job.creditStatus || "").toLowerCase() === "collected" || job._collectedMarked) return false;

    const collectedAmount = Number(opts.collectedAmount || job.creditCollectedAmount || job.collected || 0);
    const collectedOn = opts.collectedOn || todayDate();

    job.creditStatus = "collected";
    job.creditCollectedAmount = collectedAmount;
    job.creditCollectedOn = collectedOn;
    job._collectedMarked = true;

    saveServices();
    cloudSync(KEY_SERVICES, window.services);

    addCollectionEntry({
      date: collectedOn,
      source: "Service (Credit Collected)",
      details: `${job.customer || "-"} / ${job.item || "-"}`,
      amount: collectedAmount
    });

    window.creditServiceCollected = window.creditServiceCollected || [];
    const key = `${collectedOn}|${job.customer}|${job.item}|${Number(collectedAmount)}`;
    window._creditServiceKeys = window._creditServiceKeys || [];
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
  } catch (e) {
    console.error("markServiceCollected error", e);
    return false;
  }
};

/* ---------- DELETE credit-collected UI item (sale/service) ---------- */
window.deleteCreditCollected = function(type, idx) {
  try {
    if (!type || typeof idx === "undefined") return false;
    if (type === "sale") {
      if (Array.isArray(window.creditSalesCollected) && window.creditSalesCollected[idx]) {
        const r = window.creditSalesCollected.splice(idx,1)[0];
        const matchIdx = (window.collections||[]).findIndex(c =>
          Number(c.amount) === Number(r.collected) &&
          c.source && c.source.toLowerCase().includes("sales") &&
          c.date === r.date
        );
        if (matchIdx !== -1) { window.collections.splice(matchIdx,1); saveCollections(); cloudSync(KEY_COLLECTIONS, window.collections); }
        try { renderCreditCollectedTables?.(); } catch {}
        try { renderCollection?.(); } catch {}
        return true;
      }
    } else if (type === "service") {
      if (Array.isArray(window.creditServiceCollected) && window.creditServiceCollected[idx]) {
        const r = window.creditServiceCollected.splice(idx,1)[0];
        const matchIdx = (window.collections||[]).findIndex(c =>
          Number(c.amount) === Number(r.collected) &&
          c.source && c.source.toLowerCase().includes("service") &&
          c.date === r.date
        );
        if (matchIdx !== -1) { window.collections.splice(matchIdx,1); saveCollections(); cloudSync(KEY_COLLECTIONS, window.collections); }
        try { renderCreditCollectedTables?.(); } catch {}
        try { renderCollection?.(); } catch {}
        return true;
      }
    }
    return false;
  } catch (e) {
    console.error("deleteCreditCollected error", e);
    return false;
  }
};

/* ---------- INIT: preload dedupe keys arrays ---------- */
(function initCollectionKeys(){
  window._collectionKeys = [];
  try { (window.collections || []).slice(0,200).forEach(c => window._collectionKeys.push(_collectionKey(c))); } catch(e){}
  window._creditSalesKeys = [];
  try { (window.creditSalesCollected || []).forEach(r => window._creditSalesKeys.push(`${r.date}|${r.customer}|${r.product}|${Number(r.collected)}`)); } catch(e){}
  window._creditServiceKeys = [];
  try { (window.creditServiceCollected || []).forEach(r => window._creditServiceKeys.push(`${r.date}|${r.customer}|${r.item}|${Number(r.collected)}`)); } catch(e){}
})();

/* Part D complete — core.js fully modular (A+B+C+D) */
