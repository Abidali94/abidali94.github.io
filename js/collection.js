/* ===========================================================
   collection.js — FINAL v5 (Cloud-Safe, Core-Compatible)
   - Uses window.collections as single source-of-truth
   - Credit collected entries also stored in window.collections
   - UI views (history / credit tables) derived from collections
   - Saves via saveCollections() + window.cloudSync if available
   - Safe duplicate protection
=========================================================== */

(function () {
  const qs = s => document.querySelector(s);
  const esc = x => (x === undefined || x === null) ? "" : String(x);
  const todayISO = () => (new Date()).toISOString().split('T')[0];
  const num = v => Number(v || 0);

  // Ensure main collections array exists (core.js exposes window.collections normally)
  window.collections = Array.isArray(window.collections) ? window.collections : [];

  // Derived UI arrays (kept in-memory for faster rendering). They are rebuilt from window.collections.
  window.creditSalesCollected = Array.isArray(window.creditSalesCollected) ? window.creditSalesCollected : [];
  window.creditServiceCollected = Array.isArray(window.creditServiceCollected) ? window.creditServiceCollected : [];

  // Dedup keys loaded from collections on init
  window._collectionKeys = Array.isArray(window._collectionKeys) ? window._collectionKeys : [];

  function _makeEntryKey(e) {
    return `${e.date}|${e.source}|${e.details}|${Number(e.amount||0)}`;
  }

  function _rebuildKeys() {
    window._collectionKeys = [];
    try {
      (window.collections || []).forEach(c => {
        window._collectionKeys.push(_makeEntryKey(c));
      });
    } catch (e) { /* ignore */ }
  }

  function _persistCollections() {
    try {
      if (typeof window.saveCollections === "function") {
        window.saveCollections();
      } else {
        // fallback local save (shouldn't be needed if core.js present)
        localStorage.setItem("ks-collections", JSON.stringify(window.collections || []));
      }
    } catch (e) {
      console.warn("persistCollections save failed", e);
    }

    try {
      if (typeof window.cloudSync === "function") {
        // cloud key string used by core.js is "ks-collections"
        window.cloudSync("ks-collections", window.collections || []);
      }
    } catch (e) {
      console.warn("persistCollections cloudSync failed", e);
    }
  }

  /* -------------------------
     RENDER: Collection History
     (reads from window.collections)
  --------------------------*/
  function renderCollectionHistory() {
    const tbody = qs("#collectionHistory tbody");
    if (!tbody) return;

    const list = Array.isArray(window.collections) ? window.collections : [];

    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;opacity:.6;">No collections yet</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(row => `
      <tr>
        <td data-label="Date">${esc(row.date)}</td>
        <td data-label="Source">${esc(row.source)}</td>
        <td data-label="Details">${esc(row.details)}</td>
        <td data-label="Amount">₹${Number(row.amount).toLocaleString()}</td>
      </tr>
    `).join("");
  }

  /* -------------------------
     RENDER: Credit Collected Tables
     (derived from window.collections)
  --------------------------*/
  function _rebuildCreditListsFromCollections() {
    window.creditSalesCollected = [];
    window.creditServiceCollected = [];

    (window.collections || []).forEach(c => {
      const src = String(c.source || "").toLowerCase();
      // detect sales credit entries
      if (src.includes("sales") || src.includes("sale")) {
        // treat as credit sale if source mentions collected / credit / sales
        if (String(c.source || "").toLowerCase().includes("collec")) {
          window.creditSalesCollected.push({
            __colId: c.id,
            date: c.date,
            customer: c.customer || c.details?.split("/")[0] || "",
            product: c.details || "",
            qty: c.qty || 0,
            price: c.price || 0,
            collected: Number(c.amount || 0)
          });
        }
      }
      // detect service credit entries
      if (src.includes("service")) {
        if (String(c.source || "").toLowerCase().includes("collec")) {
          window.creditServiceCollected.push({
            __colId: c.id,
            date: c.date,
            customer: c.customer || c.details?.split("/")[0] || "",
            item: c.item || c.details || "",
            model: c.model || "",
            collected: Number(c.amount || 0)
          });
        }
      }
    });
  }

  function renderCreditCollectedTables() {
    const salesBody = qs("#creditSalesCollected tbody");
    const svcBody   = qs("#creditServiceCollected tbody");

    // refresh derived lists first
    _rebuildCreditListsFromCollections();

    if (salesBody) {
      if (!window.creditSalesCollected.length) {
        salesBody.innerHTML = `<tr><td colspan="4" style="text-align:center;opacity:.6;">No collected credit sales yet</td></tr>`;
      } else {
        salesBody.innerHTML = window.creditSalesCollected.map((r, idx) => `
          <tr data-idx="${idx}">
            <td>${esc(r.date)}</td>
            <td>${esc(r.customer || "-")}<br><small>${esc(r.product || "")} (${r.qty}×₹${r.price})</small></td>
            <td><span class="status-paid">Collected ₹${Number(r.collected).toLocaleString()}</span></td>
            <td><button class="btn-link credit-delete" data-which="sale" data-colid="${r.__colId}" data-idx="${idx}" title="Delete">🗑️</button></td>
          </tr>
        `).join("");
      }
    }

    if (svcBody) {
      if (!window.creditServiceCollected.length) {
        svcBody.innerHTML = `<tr><td colspan="4" style="text-align:center;opacity:.6;">No collected service credits yet</td></tr>`;
      } else {
        svcBody.innerHTML = window.creditServiceCollected.map((r, idx) => `
          <tr data-idx="${idx}">
            <td>${esc(r.date)}</td>
            <td>${esc(r.customer || "-")}<br><small>${esc(r.item || "")} ${esc(r.model || "")}</small></td>
            <td><span class="status-paid">Collected ₹${Number(r.collected).toLocaleString()}</span></td>
            <td><button class="btn-link credit-delete" data-which="service" data-colid="${r.__colId}" data-idx="${idx}" title="Delete">🗑️</button></td>
          </tr>
        `).join("");
      }
    }
  }

  /* -------------------------
     ADD collection entry (main)
     - ensures no duplicates
     - saves and triggers renders
     entry shape: { date, source, details, amount, optional extra fields... }
  --------------------------*/
  function addCollectionEntry(entry) {
    if (!entry || !entry.amount) return false;

    const e = {
      id: entry.id || ("col_" + Math.random().toString(36).slice(2,10)),
      date: entry.date || todayISO(),
      source: entry.source || "Unknown",
      details: entry.details || "",
      amount: num(entry.amount),
      // keep optional fields if present for richer UI (customer, product, qty, price, item, model)
      customer: entry.customer,
      product: entry.product,
      qty: entry.qty,
      price: entry.price,
      item: entry.item,
      model: entry.model
    };

    const key = _makeEntryKey(e);
    if (!window._collectionKeys) _rebuildKeys();
    if (window._collectionKeys.includes(key)) return false;

    window._collectionKeys.unshift(key);
    window.collections.unshift(e);

    // persist
    _persistCollections();

    // update derived lists and UI
    try { renderCollectionHistory(); } catch (err) { console.warn(err); }
    try { renderCreditCollectedTables(); } catch (err) { console.warn(err); }
    try { if (typeof window.updateUniversalBar === "function") window.updateUniversalBar(); } catch (err) {}
    try { if (typeof window.renderCollection === "function") window.renderCollection(); } catch (err) {}

    return true;
  }
  window.addCollectionEntry = addCollectionEntry;

  /* -------------------------
     HANDLE UI "Collect" buttons (net/stock/service)
     - pushes to window.collections via addCollectionEntry
  --------------------------*/
  async function handleCollect(type) {
    try {
      type = String(type || "").toLowerCase();
      const idMap = { net: "unNetProfit", stock: "unStockInv", service: "unServiceInv" };
      const id = idMap[type];
      const el = id ? qs("#" + id) : null;
      let raw = 0;
      if (el) {
        raw = Number((el.textContent || el.innerText || "").replace(/[₹,]/g,"").trim()) || 0;
      }
      if (!raw || raw <= 0) {
        alert("Nothing to collect for: " + type);
        return;
      }

      const entry = {
        date: todayISO(),
        source: (type === "net") ? "Net Profit (Collected)" :
                (type === "stock") ? "Stock Investment (Collected)" :
                "Service Investment (Collected)",
        details: `Collected from ${type}`,
        amount: raw
      };

      const ok = addCollectionEntry(entry);
      if (!ok) {
        alert("Already collected or failed to record.");
        return;
      }

      // reset display
      if (el) el.textContent = "₹0";

      // call optional hook
      if (typeof window.onCollect === "function") {
        try { await window.onCollect(type, entry); } catch (e) { console.warn("onCollect hook failed", e); }
      }

      try { if (typeof window.renderCollection === "function") window.renderCollection(); } catch (e) {}
    } catch (err) {
      console.error("handleCollect error:", err);
      alert("Collect failed — see console.");
    }
  }
  window.handleCollect = handleCollect;

  /* -------------------------
     Collect Credit Sale / Service
     - Called by sales/service modules when a credit is paid
     - Adds to window.collections and marks sale/service as collected if possible
  --------------------------*/
  function collectCreditSale(saleObj) {
    try {
      if (!saleObj) return false;

      const collected = num(saleObj.collectedAmount || saleObj.collected || saleObj.total || (num(saleObj.qty) * num(saleObj.price)));
      if (collected <= 0) return false;

      const entry = {
        date: saleObj.creditCollectedOn || saleObj.date || todayISO(),
        source: "Sales (Credit Collected)",
        details: `${saleObj.customer || "-"} / ${saleObj.product || "-"}`,
        amount: collected,
        customer: saleObj.customer,
        product: saleObj.product,
        qty: saleObj.qty,
        price: saleObj.price
      };

      const ok = addCollectionEntry(entry);
      if (!ok) return false;

      // mark sale in main sales array if present
      try {
        if (saleObj.id && Array.isArray(window.sales)) {
          const idx = window.sales.findIndex(s => s.id === saleObj.id);
          if (idx >= 0) {
            window.sales[idx].wasCredit = true;
            window.sales[idx].status = "paid";
            window.sales[idx].collectedAmount = collected;
            window.sales[idx].creditCollectedOn = entry.date;
            if (typeof window.saveSales === "function") window.saveSales();
          }
        }
      } catch (e) { console.warn("marking sale as collected failed", e); }

      try { renderCreditCollectedTables(); } catch (e) {}
      try { if (typeof window.updateUniversalBar === "function") window.updateUniversalBar(); } catch (e) {}
      return true;
    } catch (e) {
      console.error("collectCreditSale failed:", e);
      return false;
    }
  }
  window.collectCreditSale = collectCreditSale;

  function collectCreditService(jobObj) {
    try {
      if (!jobObj) return false;

      const collected = num(jobObj.creditCollectedAmount || jobObj.collected || 0);
      if (collected <= 0) return false;

      const entry = {
        date: jobObj.creditCollectedOn || jobObj.date_out || jobObj.date_in || todayISO(),
        source: "Service (Credit Collected)",
        details: `${jobObj.customer || "-"} / ${jobObj.item || "-"}`,
        amount: collected,
        customer: jobObj.customer,
        item: jobObj.item,
        model: jobObj.model
      };

      const ok = addCollectionEntry(entry);
      if (!ok) return false;

      // mark job in main services array if present
      try {
        if (jobObj.id && Array.isArray(window.services)) {
          const idx = window.services.findIndex(s => s.id === jobObj.id);
          if (idx >= 0) {
            window.services[idx].creditStatus = "collected";
            window.services[idx].creditCollectedAmount = collected;
            window.services[idx].creditCollectedOn = entry.date;
            window.services[idx].status = "collected";
            if (typeof window.saveServices === "function") window.saveServices();
          }
        }
      } catch (e) { console.warn("marking service as collected failed", e); }

      try { renderCreditCollectedTables(); } catch (e) {}
      try { if (typeof window.updateUniversalBar === "function") window.updateUniversalBar(); } catch (e) {}
      return true;
    } catch (e) {
      console.error("collectCreditService failed:", e);
      return false;
    }
  }
  window.collectCreditService = collectCreditService;

  /* -------------------------
     Delete handler for credit-delete buttons (removes from window.collections)
  --------------------------*/
  document.addEventListener("click", function (ev) {
    const btn = ev.target.closest(".credit-delete");
    if (!btn) return;
    const colId = btn.dataset.colid;
    if (!colId) return;

    // confirm
    if (!confirm("Delete this collected entry?")) return;

    const idx = (window.collections || []).findIndex(c => c.id === colId);
    if (idx === -1) {
      // maybe it's a derived-only item (no id) — try index from derived lists
      const which = btn.dataset.which;
      const derivedIdx = Number(btn.dataset.idx);
      if (which === "sale" && window.creditSalesCollected[derivedIdx]) {
        const derived = window.creditSalesCollected[derivedIdx];
        // remove matching collection by date+amount+source
        const matchIdx = (window.collections||[]).findIndex(c => Math.abs(num(c.amount) - num(derived.collected)) < 0.0001 && String(c.date) === String(derived.date) && String(c.source || "").toLowerCase().includes("sales"));
        if (matchIdx !== -1) {
          window.collections.splice(matchIdx,1);
        }
      } else if (which === "service" && window.creditServiceCollected[derivedIdx]) {
        const derived = window.creditServiceCollected[derivedIdx];
        const matchIdx = (window.collections||[]).findIndex(c => Math.abs(num(c.amount) - num(derived.collected)) < 0.0001 && String(c.date) === String(derived.date) && String(c.source || "").toLowerCase().includes("service"));
        if (matchIdx !== -1) {
          window.collections.splice(matchIdx,1);
        }
      }
    } else {
      window.collections.splice(idx, 1);
    }

    // persist and rerender
    _rebuildKeys();
    _persistCollections();
    try { renderCollectionHistory(); } catch (e) {}
    try { renderCreditCollectedTables(); } catch (e) {}
    try { if (typeof window.updateUniversalBar === "function") window.updateUniversalBar(); } catch (e) {}
  });

  /* -------------------------
     Public render wrapper
  --------------------------*/
  window.renderCollection = function () {
    renderCollectionHistory();
    renderCreditCollectedTables();
  };

  /* -------------------------
     INIT: rebuild keys + render on DOM ready
  --------------------------*/
  document.addEventListener("DOMContentLoaded", function () {
    try { _rebuildKeys(); } catch (e) {}
    try { renderCollectionHistory(); } catch (e) {}
    try { renderCreditCollectedTables(); } catch (e) {}
  });

  // expose internals for testing/compat
  window._collectionKeys = window._collectionKeys || [];
  window.renderCollectionHistory = renderCollectionHistory;
  window.renderCreditCollectedTables = renderCreditCollectedTables;

  console.log("collection.js v5 loaded — core-compatible");
})();
