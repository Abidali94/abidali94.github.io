/* ===========================================================
   collection.js — FINAL STABLE V5
   • Adds working Collect button
   • Proper history entry
   • Updates sale status (credit → paid)
   • Updates universal bar & dashboard
   • No double calculation
=========================================================== */

// Safe text escape
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
   PUBLIC: Add collection entry (used globally)
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
   SUMMARY CALCULATION
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

  // Sales section
  (window.sales || []).forEach(s => {
    const status = String(s.status || "").toLowerCase();

    const total = cNum(s.total || (cNum(s.qty) * cNum(s.price)));

    if (status === "credit") {
      pendingCredit += total;
    } else {
      // collected or paid
      salesCollected += cNum(s.profit);
    }
  });

  // Service section
  (window.services || []).forEach(job => {
    if (String(job.status || "").toLowerCase() === "completed") {
      serviceCollected += cNum(job.profit);
      investmentRemain += cNum(job.invest);
    }
  });

  // After-sale stock investment
  if (typeof window.getStockInvestmentAfterSale === "function") {
    investmentRemain += cNum(window.getStockInvestmentAfterSale());
  }

  return { salesCollected, serviceCollected, pendingCredit, investmentRemain };
}

/* -----------------------------------------------------------
   GET PENDING LIST
----------------------------------------------------------- */
function getPendingList() {
  const list = [];

  (window.sales || []).forEach(s => {
    if (String(s.status || "").toLowerCase() === "credit") {
      const total = cNum(s.total || (cNum(s.qty) * cNum(s.price)));
      if (total > 0) {
        list.push({
          id: s.id,
          name: s.product || "Sale",
          type: s.type || "Sale",
          date: s.date,
          pending: total
        });
      }
    }
  });

  return list;
}

/* -----------------------------------------------------------
   RENDER PENDING TABLE  (WITH COLLECT BUTTON)
----------------------------------------------------------- */
function renderPendingCollections() {
  const tbody = qs("#pendingCollectionTable tbody");
  if (!tbody) return;

  const list = getPendingList();

  if (!list.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;opacity:0.6;">No pending collections</td>
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
        <button class="small-btn collect-btn"
                data-id="${r.id}"
                data-amount="${r.pending}">
          Collect
        </button>
      </td>
    </tr>
  `).join("");
}

/* -----------------------------------------------------------
   RENDER COLLECTION HISTORY + SUMMARY
----------------------------------------------------------- */
function renderCollection() {
  const sum = computeCollectionSummary();

  const fmt = v => "₹" + Math.round(cNum(v));

  // Summary card elements
  if (qs("#colSales"))   qs("#colSales").textContent   = fmt(sum.salesCollected);
  if (qs("#colService")) qs("#colService").textContent = fmt(sum.serviceCollected);
  if (qs("#colCredit"))  qs("#colCredit").textContent  = fmt(sum.pendingCredit);
  if (qs("#colInvRemain")) qs("#colInvRemain").textContent = fmt(sum.investmentRemain);

  // History table
  const tbody = qs("#collectionHistory tbody");
  if (!tbody) return;

  const list = window.collections || [];

  if (!list.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center;opacity:0.6;">
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
   DELETE HISTORY BUTTON
----------------------------------------------------------- */
document.addEventListener("click", e => {
  // Clear all collection history
  if (e.target.id === "clearCollectionBtn") {
    if (!confirm("Clear entire collection history?")) return;
    window.collections = [];
    saveCollections();
    renderCollection();
    window.updateUniversalBar?.();
  }

  /* -----------------------------------------------
     COLLECT BUTTON HANDLER (Credit → Paid)
  ----------------------------------------------- */
  if (e.target.classList.contains("collect-btn")) {
    const id = e.target.getAttribute("data-id");
    const amt = Number(e.target.getAttribute("data-amount") || 0);

    const sale = (window.sales || []).find(s => s.id == id);
    if (!sale) {
      alert("Error: Sale not found!");
      return;
    }

    // Convert credit → paid
    sale.status = "paid";
    saveSales?.();

    // Add collection history entry
    window.addCollectionEntry("Sale", sale.product, amt);

    // Refresh UI
    renderPendingCollections();
    renderCollection();
    window.updateUniversalBar?.();

    alert("Amount collected successfully!");
  }
});

/* -----------------------------------------------------------
   INIT
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
