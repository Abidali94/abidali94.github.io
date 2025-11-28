/* ===========================================================
   collection.js — Collection Center (SAFE FINAL V4.1)
   • Simple History:
        - window.collections from localStorage
        - addCollectionEntry(source, details, amount)
   • Summary numbers:
        - Sales Profit (collected)
        - Service Profit (collected)
        - Pending Credit Sales
        - Total Investment (after sale)
   • Pending table is for info only (no double-calculation)
=========================================================== */

// local escape (no global esc clash)
function escLocal(x) {
  return (x === undefined || x === null) ? "" : String(x);
}

/* -----------------------------------------------------------
   HISTORY STORAGE
----------------------------------------------------------- */
window.collections = JSON.parse(localStorage.getItem("ks-collections") || "[]");

function saveCollections() {
  try {
    localStorage.setItem("ks-collections", JSON.stringify(window.collections || []));
  } catch (e) {
    console.warn("Collection save error:", e);
  }
}

/* -----------------------------------------------------------
   PUBLIC ADD ENTRY  (used also by universalBar.js)
----------------------------------------------------------- */
window.addCollectionEntry = function (source, details, amount) {
  const entry = {
    id: Date.now().toString(),
    date: window.todayDate ? todayDate() : new Date().toISOString().slice(0,10),
    source: escLocal(source || ""),
    details: escLocal(details || ""),
    amount: Number(amount || 0)
  };

  window.collections = window.collections || [];
  window.collections.push(entry);
  saveCollections();
  renderCollection();
  window.updateUniversalBar?.();
};

/* -----------------------------------------------------------
   SUMMARY NUMBERS (for Collection tab)
----------------------------------------------------------- */
function cNum(v) {
  const n = Number(v || 0);
  return isNaN(n) ? 0 : n;
}

function computeCollectionSummary() {
  let salesCollected   = 0;
  let serviceCollected = 0;
  let pendingCredit    = 0;
  let investmentRemain = 0;

  // Sales profit collected (non-credit)
  (window.sales || []).forEach(s => {
    const status = String(s.status || "").toLowerCase();
    if (status !== "credit") {
      salesCollected += cNum(s.profit);
    } else {
      const total = cNum(s.total || (cNum(s.qty) * cNum(s.price)));
      pendingCredit += total;
    }
  });

  // Service profit collected
  (window.services || []).forEach(job => {
    if (String(job.status || "").toLowerCase() === "completed") {
      serviceCollected += cNum(job.profit);
      investmentRemain += cNum(job.invest); // part of after-sale investment
    }
  });

  // Stock investment (after sale)
  if (typeof window.getStockInvestmentAfterSale === "function") {
    investmentRemain += cNum(window.getStockInvestmentAfterSale());
  }

  return { salesCollected, serviceCollected, pendingCredit, investmentRemain };
}

/* -----------------------------------------------------------
   BUILD PENDING COLLECTION LIST (for display only)
----------------------------------------------------------- */
function getPendingList() {
  const list = [];

  // Credit sales only (pure info; collect happens via Sales)
  (window.sales || []).forEach(s => {
    if (String(s.status || "").toLowerCase() === "credit") {
      const total = cNum(s.total || (cNum(s.qty) * cNum(s.price)));
      if (total > 0) {
        list.push({
          id: s.id,
          name: s.product || "Sale",
          type: "Sale Credit",
          date: s.date,
          pending: total
        });
      }
    }
  });

  return list;
}

/* -----------------------------------------------------------
   RENDER PENDING COLLECTIONS TABLE
----------------------------------------------------------- */
function renderPendingCollections() {
  const tbody = qs("#pendingCollectionTable tbody");
  if (!tbody) return;

  const list = getPendingList();
  if (!list.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;opacity:0.6;">
          No pending collections
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = list.map(r => `
    <tr>
      <td data-label="Date">${window.toDisplay ? toDisplay(r.date) : r.date}</td>
      <td data-label="Name">${escLocal(r.name)}</td>
      <td data-label="Type">${escLocal(r.type)}</td>
      <td data-label="Pending">₹${r.pending}</td>
      <td data-label="Action">
        <!-- Info only; no Collect button here -->
        <span style="font-size:11px;opacity:0.7;">Shown for info</span>
      </td>
    </tr>
  `).join("");
}

/* -----------------------------------------------------------
   RENDER COLLECTION TAB (SUMMARY + HISTORY)
----------------------------------------------------------- */
function renderCollection() {
  // Summary cards
  const sum = computeCollectionSummary();

  const colSales   = document.getElementById("colSales");
  const colService = document.getElementById("colService");
  const colCredit  = document.getElementById("colCredit");
  const colInv     = document.getElementById("colInvRemain");

  const fmt = v => "₹" + Math.round(cNum(v));

  if (colSales)   colSales.textContent   = fmt(sum.salesCollected);
  if (colService) colService.textContent = fmt(sum.serviceCollected);
  if (colCredit)  colCredit.textContent  = fmt(sum.pendingCredit);
  if (colInv)     colInv.textContent     = fmt(sum.investmentRemain);

  // History table
  const tbody = document.querySelector("#collectionHistory tbody");
  if (!tbody) return;

  const list = window.collections || [];

  if (!list.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center;opacity:0.6">
          No collection history yet
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = list.map(e => `
    <tr>
      <td data-label="Date">${e.date}</td>
      <td data-label="Source">${escLocal(e.source)}</td>
      <td data-label="Details">${escLocal(e.details)}</td>
      <td data-label="Amount">₹${e.amount}</td>
    </tr>
  `).join("");
}

window.renderCollection = renderCollection;

/* -----------------------------------------------------------
   CLEAR HISTORY BUTTON
----------------------------------------------------------- */
document.addEventListener("click", e => {
  if (e.target && e.target.id === "clearCollectionBtn") {
    if (!confirm("Clear entire collection history?")) return;
    window.collections = [];
    saveCollections();
    renderCollection();
    window.updateUniversalBar?.();
  }
});

/* -----------------------------------------------------------
   INIT ON LOAD
----------------------------------------------------------- */
window.addEventListener("load", () => {
  if (!Array.isArray(window.collections)) {
    window.collections = [];
    saveCollections();
  }
  renderPendingCollections();
  renderCollection();
  window.updateUniversalBar?.();
});
