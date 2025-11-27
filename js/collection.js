/* ===========================================================
   collection.js — Collection Center (SAFE FINAL V2.0)
   • Works with current business-dashboard v3.1 layout
   • Uses global helpers from core.js (todayDate, esc, etc.)
   • Shows:
       - Sales Profit (collected)
       - Service Profit (collected)
       - Pending Credit (sales credit)
       - Total Investment After Sale
   • Keeps a simple Collection History list in localStorage
=========================================================== */

/* ------------ LOCAL HISTORY STORE ------------ */
// stored as: [{ id, date, source, details, amount }]
window.collections = JSON.parse(localStorage.getItem("ks-collections") || "[]");

function saveCollections() {
  try {
    localStorage.setItem("ks-collections", JSON.stringify(window.collections || []));
  } catch (e) {
    console.warn("Unable to save collections", e);
  }
}

/* ------------ PUBLIC HELPER (for future use) ------------
   Any file can call:
   addCollectionEntry("Sales Profit", "Product ABC", 500);
---------------------------------------------------------- */
window.addCollectionEntry = function (source, details, amount) {
  const escFn = window.esc || (x => String(x ?? ""));
  const entry = {
    id: window.uid ? uid("coll") : Date.now().toString(),
    date: window.todayDate ? todayDate() : new Date().toISOString().slice(0, 10),
    source: escFn(source || ""),
    details: escFn(details || ""),
    amount: Number(amount || 0)
  };

  window.collections = window.collections || [];
  window.collections.push(entry);
  saveCollections();
  renderCollection(); // refresh UI if tab open
};

/* ===========================================================
   🔢 SUMMARY NUMBERS
   Uses helpers from core.js + analytics.js
=========================================================== */
function getSafeNumber(v) {
  const n = Number(v || 0);
  return isNaN(n) ? 0 : n;
}

function computeCollectionSummary() {
  let salesCollected   = 0;
  let serviceCollected = 0;
  let pendingCredit    = 0;
  let investRemain     = 0;

  // 1) Sales Profit Collected (paid only)
  if (typeof window.getSalesProfitCollected === "function") {
    salesCollected = getSafeNumber(window.getSalesProfitCollected());
  } else {
    // fallback: sum profit where status != credit
    (window.sales || []).forEach(s => {
      const status = String(s.status || "").toLowerCase();
      if (status !== "credit") {
        salesCollected += getSafeNumber(s.profit);
      }
    });
  }

  // 2) Service Profit Collected (Completed only)
  if (typeof window.getServiceProfitCollected === "function") {
    serviceCollected = getSafeNumber(window.getServiceProfitCollected());
  } else {
    (window.services || []).forEach(j => {
      if (String(j.status || "").toLowerCase() === "completed") {
        serviceCollected += getSafeNumber(j.profit);
      }
    });
  }

  // 3) Pending Credit (Sales)
  (window.sales || []).forEach(s => {
    const status = String(s.status || "").toLowerCase();
    if (status === "credit") {
      const total = getSafeNumber(
        s.total || s.amount ||
        (getSafeNumber(s.qty) * getSafeNumber(s.price))
      );
      pendingCredit += total;
    }
  });

  // 4) Investment After Sale (stock remain + service investment)
  if (typeof window.getStockInvestmentAfterSale === "function") {
    investRemain += getSafeNumber(window.getStockInvestmentAfterSale());
  }
  if (typeof window.getServiceInvestmentCollected === "function") {
    investRemain += getSafeNumber(window.getServiceInvestmentCollected());
  }

  return { salesCollected, serviceCollected, pendingCredit, investRemain };
}

/* ===========================================================
   📊 RENDER COLLECTION TAB
=========================================================== */
function renderCollection() {
  const escFn = window.esc || (x => String(x ?? ""));

  // ---- Summary Cards ----
  const sum = computeCollectionSummary();

  const salesEl   = document.getElementById("colSales");
  const svcEl     = document.getElementById("colService");
  const creditEl  = document.getElementById("colCredit");
  const invEl     = document.getElementById("colInvRemain");

  if (salesEl)  salesEl.textContent  = "₹" + Math.round(sum.salesCollected);
  if (svcEl)    svcEl.textContent    = "₹" + Math.round(sum.serviceCollected);
  if (creditEl) creditEl.textContent = "₹" + Math.round(sum.pendingCredit);
  if (invEl)    invEl.textContent    = "₹" + Math.round(sum.investRemain);

  // ---- History Table ----
  const tbody = document.querySelector("#collectionTable tbody");
  if (!tbody) return;

  const list = window.collections || [];

  if (!list.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center;opacity:0.7">
          No collection history yet
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = list.map(row => `
    <tr>
      <td data-label="Date">${window.toDisplay ? toDisplay(row.date) : escFn(row.date)}</td>
      <td data-label="Type">${escFn(row.source)}</td>
      <td data-label="Details">${escFn(row.details)}</td>
      <td data-label="Amount">₹${escFn(row.amount)}</td>
    </tr>
  `).join("");
}
window.renderCollection = renderCollection;

/* ===========================================================
   🗑 CLEAR HISTORY BUTTON
=========================================================== */
document.addEventListener("click", e => {
  if (e.target && e.target.id === "clearCollectionBtn") {
    if (!confirm("Clear entire collection history?")) return;
    window.collections = [];
    saveCollections();
    renderCollection();
  }
});

/* ===========================================================
   🚀 INIT ON LOAD
=========================================================== */
window.addEventListener("load", () => {
  try {
    // ensure array
    if (!Array.isArray(window.collections)) {
      window.collections = [];
      saveCollections();
    }
    renderCollection();
  } catch (e) {
    console.error("Error in collection init:", e);
  }
});
