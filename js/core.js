/* ===========================================================
   📌 core.js — Master Engine (ONLINE ONLY — FINAL V13)
   ⭐ Modified for NET OFFSET System
=========================================================== */

/* ---------- STORAGE KEYS ---------- */
const KEY_TYPES        = "item-types";
const KEY_STOCK        = "stock-data";
const KEY_SALES        = "sales-data";
const KEY_WANTING      = "wanting-data";
const KEY_EXPENSES     = "expenses-data";
const KEY_SERVICES     = "service-data";
const KEY_COLLECTIONS  = "ks-collections";
const KEY_LIMIT        = "default-limit";
const KEY_USER_EMAIL   = "ks-user-email";

/* ⭐ NEW — Net Profit Collected Offset Key */
const KEY_NET_COLLECTED = "ks-net-collected";

/* ---------- CLOUD COLLECTION NAMES ---------- */
const CLOUD_COLLECTIONS = {
  [KEY_TYPES]:       "types",
  [KEY_STOCK]:       "stock",
  [KEY_SALES]:       "sales",
  [KEY_WANTING]:     "wanting",
  [KEY_EXPENSES]:    "expenses",
  [KEY_SERVICES]:    "services",
  [KEY_COLLECTIONS]: "collections"
};

/* ===========================================================
   SAFE HELPERS
=========================================================== */
function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function toArray(v) {
  return Array.isArray(v) ? v : [];
}

/* ===========================================================
   DATE HELPERS
=========================================================== */
function toDisplay(d) {
  if (!d) return "";
  if (typeof d !== "string") return d;

  if (d.includes("-")) {
    const p = d.split("-");
    if (p.length === 3) {
      const [a, b, c] = p;
      if (a.length === 4) {
        return `${c}-${b}-${a}`;
      }
    }
  }
  return d;
}

function toInternal(d) {
  if (!d) return "";
  if (typeof d !== "string") return d;
  if (!d.includes("-")) return d;

  const p = d.split("-");
  if (p.length !== 3) return d;

  if (p[0].length === 2 && p[2].length === 4) {
    const [dd, m, y] = p;
    return `${y}-${m}-${dd}`;
  }

  return d;
}

function toInternalIfNeeded(d) {
  if (!d) return "";
  if (typeof d !== "string") return d;

  const p = d.split("-");
  if (p.length !== 3) return d;

  if (p[0].length === 4) return d;
  if (p[0].length === 2 && p[2].length === 4) return toInternal(d);

  return d;
}

window.toDisplay = toDisplay;
window.toInternal = toInternal;
window.toInternalIfNeeded = toInternalIfNeeded;

function todayDate() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
}
window.todayDate = todayDate;

function uid(p = "id") {
  return p + "_" + Math.random().toString(36).slice(2, 10);
}
window.uid = uid;

function esc(t) {
  return String(t || "").replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}
window.esc = esc;

/* ===========================================================
   LOAD LOCAL DATA
=========================================================== */
window.types       = toArray(safeParse(localStorage.getItem(KEY_TYPES)));
window.stock       = toArray(safeParse(localStorage.getItem(KEY_STOCK)));
window.sales       = toArray(safeParse(localStorage.getItem(KEY_SALES)));
window.wanting     = toArray(safeParse(localStorage.getItem(KEY_WANTING)));
window.expenses    = toArray(safeParse(localStorage.getItem(KEY_EXPENSES)));
window.services    = toArray(safeParse(localStorage.getItem(KEY_SERVICES)));
window.collections = toArray(safeParse(localStorage.getItem(KEY_COLLECTIONS)));

/* ⭐ NEW — Load collected net offset */
window.collectedNetTotal = Number(localStorage.getItem(KEY_NET_COLLECTED) || 0);

/* Ensure always arrays */
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

/* ===========================================================
   NORMALIZE DATES
=========================================================== */
function normalizeAllDates() {

  if (window.stock)
    window.stock = window.stock.map(s => ({
      ...s,
      date: toInternalIfNeeded(s.date)
    }));

  if (window.sales)
    window.sales = window.sales.map(s => ({
      ...s,
      date: toInternalIfNeeded(s.date)
    }));

  if (window.expenses)
    window.expenses = window.expenses.map(e => ({
      ...e,
      date: toInternalIfNeeded(e.date)
    }));

  if (window.wanting)
    window.wanting = window.wanting.map(w => ({
      ...w,
      date: toInternalIfNeeded(w.date)
    }));

  if (window.services)
    window.services = window.services.map(j => ({
      ...j,
      date_in:  toInternalIfNeeded(j.date_in),
      date_out: toInternalIfNeeded(j.date_out)
    }));

  if (window.collections)
    window.collections = window.collections.map(c => ({
      ...c,
      date: toInternalIfNeeded(c.date)
    }));
}

normalizeAllDates();
/* ===========================================================
   SAVE HELPERS (LOCAL + CLOUD)
=========================================================== */

function _localSave(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
}

/* ⭐ NEW — SAVE NET COLLECTED OFFSET */
function saveCollectedNetTotal() {
  try {
    localStorage.setItem(
      KEY_NET_COLLECTED,
      String(window.collectedNetTotal || 0)
    );
  } catch {}
}
window.saveCollectedNetTotal = saveCollectedNetTotal;

/* ---------- STANDARD SAVE WRAPPERS ---------- */
function saveTypes() {
  _localSave(KEY_TYPES, types);
  cloudSync(KEY_TYPES, types);
}

function saveStock() {
  _localSave(KEY_STOCK, stock);
  cloudSync(KEY_STOCK, stock);
}

function saveSales() {
  _localSave(KEY_SALES, sales);
  cloudSync(KEY_SALES, sales);
}

function saveWanting() {
  _localSave(KEY_WANTING, wanting);
  cloudSync(KEY_WANTING, wanting);
}

function saveExpenses() {
  _localSave(KEY_EXPENSES, expenses);
  cloudSync(KEY_EXPENSES, expenses);
}

function saveServices() {
  _localSave(KEY_SERVICES, services);
  cloudSync(KEY_SERVICES, services);
}

function saveCollections() {
  _localSave(KEY_COLLECTIONS, collections);
  cloudSync(KEY_COLLECTIONS, collections);
}

window.saveTypes       = saveTypes;
window.saveStock       = saveStock;
window.saveSales       = saveSales;
window.saveWanting     = saveWanting;
window.saveExpenses    = saveExpenses;
window.saveServices    = saveServices;
window.saveCollections = saveCollections;

/* ===========================================================
   TYPE MANAGEMENT
=========================================================== */
function addType(name) {
  name = (name || "").trim();
  if (!name) return;

  if (types.find(t => t.name.toLowerCase() === name.toLowerCase())) return;

  types.push({
    id: uid("type"),
    name
  });

  saveTypes();
  cloudSync(KEY_TYPES, types);
}
window.addType = addType;

/* ===========================================================
   STOCK MANAGEMENT
=========================================================== */
function findProduct(type, name) {
  return (stock || []).find(
    p =>
      p.type === type &&
      String(p.name || "").toLowerCase() === String(name || "").toLowerCase()
  );
}
window.findProduct = findProduct;

function getProductCost(type, name) {
  const p = findProduct(type, name);
  if (!p) return 0;

  if (p.cost) return Number(p.cost);

  if (p.history && p.history.length) {
    let t = 0,
      q = 0;
    p.history.forEach(h => {
      t += Number(h.cost) * Number(h.qty);
      q += Number(h.qty);
    });
    return q ? t / q : 0;
  }
  return 0;
}
window.getProductCost = getProductCost;

function addStockEntry({ date, type, name, qty, cost }) {
  date = toInternalIfNeeded(date);
  qty = Number(qty);
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
}
window.addStockEntry = addStockEntry;

/* ===========================================================
   LOW STOCK LIMIT
=========================================================== */
function setGlobalLimit(v) {
  localStorage.setItem(KEY_LIMIT, v);
}
function getGlobalLimit() {
  return Number(localStorage.getItem(KEY_LIMIT) || 0);
}
window.setGlobalLimit = setGlobalLimit;
window.getGlobalLimit = getGlobalLimit;

/* ===========================================================
   WANTING LIST
=========================================================== */
function autoAddWanting(type, name, note = "Low Stock") {
  if (!wanting.find(w => w.type === type && w.name === name)) {
    wanting.push({
      id: uid("want"),
      date: todayDate(),
      type,
      name,
      note
    });

    saveWanting();
    cloudSync(KEY_WANTING, wanting);
  }
}
window.autoAddWanting = autoAddWanting;

/* ===========================================================
   EXPENSES
=========================================================== */
function addExpense({ date, category, amount, note }) {
  expenses.push({
    id: uid("exp"),
    date: toInternalIfNeeded(date || todayDate()),
    category,
    amount: Number(amount || 0),
    note: note || ""
  });

  saveExpenses();
  cloudSync(KEY_EXPENSES, expenses);
}
window.addExpense = addExpense;
/* ===========================================================
   NET PROFIT (Dynamic Calculator with Net Offset)
=========================================================== */
window.getTotalNetProfit = function () {
  let salesProfit = 0,
    serviceProfit = 0,
    exp = 0;

  // Sales profits (only non-credit)
  sales.forEach(s => {
    if ((s.status || "").toLowerCase() !== "credit") {
      salesProfit += Number(s.profit || 0);
    }
  });

  // Service profit (completed)
  services.forEach(j => {
    if ((j.status || "").toLowerCase() === "completed") {
      serviceProfit += Number(j.profit || 0);
    }
  });

  // Expenses
  expenses.forEach(e => (exp += Number(e.amount || 0)));

  // ⭐ IMPORTANT — minus already collected NET offset
  const collectedOffset = Number(window.collectedNetTotal || 0);

  return (salesProfit + serviceProfit - exp) - collectedOffset;
};
/* ===========================================================
   ⭐ FIXED NET COLLECTION
=========================================================== */
if (kind === "net") {
  updateUniversalBar();                              // always fresh
  const m = window.__unMetrics || {};

  if (m.netProfit <= 0) {
    alert("No profit to collect.");
    return;
  }

  const approx = Math.round(m.netProfit);

  const val = prompt(
    `Net Profit (Sale + Service − Expenses)\nApprox: ₹${approx}\n\nEnter amount:`
  );
  if (!val) return;

  const amt = Number(val);
  if (isNaN(amt) || amt <= 0) {
    alert("Invalid amount.");
    return;
  }

  const note = prompt("Optional note:", "") || "";

  /** ⭐ Add entry to collection history */
  window.addCollectionEntry("Net Profit", note, amt);

  /** ⭐ Add to offset (VERY IMPORTANT) */
  window.collectedNetTotal = Number(window.collectedNetTotal || 0) + amt;

  /** ⭐ Save offset permanently */
  window.saveCollectedNetTotal?.();

  /** ⭐ Refresh UI everywhere */
  updateUniversalBar();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
  window.renderCollection?.();
  window.updateTabSummaryBar?.();

  alert("Net collected successfully.");
  return;
}
