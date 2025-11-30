/* ===========================================================
   collection.js — FINAL CLEAN v8.0
   ✔ Shows Qty × Rate = Total everywhere
   ✔ Customer + Phone always visible
   ✔ Credit → Paid update + detailed history entry
   ✔ Fully synced with universalBar metrics
=========================================================== */

/* -----------------------------
   Helpers
----------------------------- */
function escLocal(x) {
  return (x === undefined || x === null) ? "" : String(x);
}

function cNum(v) {
  const n = Number(v || 0);
  return isNaN(n) ? 0 : n;
}

/* -----------------------------
   Local storage (History)
----------------------------- */
window.collections = JSON.parse(localStorage.getItem("ks-collections") || "[]");

function saveCollections() {
  localStorage.setItem("ks-collections", JSON.stringify(window.collections || []));
}

/* ===========================================================
   PUBLIC: addCollectionEntry (FULL DETAILS)
=========================================================== */
window.addCollectionEntry = function (source, details, amount) {
  const entry = {
    id: Date.now().toString(),
    date: window.todayDate ? todayDate() : new Date().toISOString().slice(0, 10),
    source: escLocal(source || ""),
    details: escLocal(details || ""),
    amount: cNum(amount)
  };

  window.collections.push(entry);
  saveCollections();
  renderCollection();
  window.updateUniversalBar?.();
};

/* ===========================================================
   SUMMARY
=========================================================== */
function computeCollectionSummary() {
  window.updateUniversalBar?.();
  const m = window.__unMetrics || {};

  return {
    salesCollected:   cNum(m.saleProfitCollected),
    serviceCollected: cNum(m.serviceProfitCollected),
    pendingCredit:    cNum(m.pendingCreditTotal),
    investmentRemain: cNum(m.stockInvestSold) + cNum(m.serviceInvestCompleted)
  };
}

/* ===========================================================
   GET PENDING CREDIT LIST
=========================================================== */
function getPendingList() {
  const list = [];

  (window.sales || []).forEach(s => {
    if (String(s.status || "").toLowerCase() === "credit") {
      const total = cNum(s.total || s.qty * s.price);

      list.push({
        id: s.id,
        name: s.product,
        type: s.type,
        date: s.date,
        qty: cNum(s.qty),
        price: cNum(s.price),
        pending: total,
        customer: escLocal(s.customer),
        phone: escLocal(s.phone)
      });
    }
  });

  return list;
}

/* ===========================================================
   RENDER PENDING COLLECTION TABLE
   (Now shows Qty × Rate also)
=========================================================== */
function renderPendingCollections() {
  const tbody = qs("#pendingCollectionTable tbody");
  if (!tbody) return;

  const list = getPendingList();

  if (!list.length) {
    tbody.innerHTML = `
      <tr><td colspan="5" style="text-align:center;opacity:0.6;">
        No pending collections
      </td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(r => `
    <tr>

      <td data-label="Date">${window.toDisplay ? toDisplay(r.date) : r.date}</td>

      <td data-label="Name">
        ${escLocal(r.name)}
        <br><small>Qty ${r.qty} × ₹${r.price} = <b>₹${r.pending}</b></small>
        ${r.customer ? `<br><small>${r.customer}</small>` : ""}
        ${r.phone ? `<br><small>📞 ${r.phone}</small>` : ""}
      </td>

      <td data-label="Type">${escLocal(r.type)}</td>

      <td data-label="Pending"><b>₹${r.pending}</b></td>

      <td data-label="Action">
        <button class="small-btn pending-collect-btn"
                data-id="${r.id}"
                data-amount="${r.pending}">
          Collect
        </button>
      </td>
    </tr>
  `).join("");
}

/* ===========================================================
   RENDER COLLECTION HISTORY + SUMMARY
=========================================================== */
function renderCollection() {
  const sum = computeCollectionSummary();
  const fmt = v => "₹" + Math.round(cNum(v));

  if (qs("#colSales"))     qs("#colSales").textContent     = fmt(sum.salesCollected);
  if (qs("#colService"))   qs("#colService").textContent   = fmt(sum.serviceCollected);
  if (qs("#colCredit"))    qs("#colCredit").textContent    = fmt(sum.pendingCredit);
  if (qs("#colInvRemain")) qs("#colInvRemain").textContent = fmt(sum.investmentRemain);

  const tbody = qs("#collectionHistory tbody");
  if (!tbody) return;

  const list = window.collections;

  if (!list.length) {
    tbody.innerHTML = `
      <tr><td colspan="4" style="text-align:center;opacity:0.6;">
        No collection history yet
      </td></tr>`;
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

/* ===========================================================
   GLOBAL CLICK HANDLER (Collect button)
=========================================================== */
document.addEventListener("click", e => {
  const target = e.target;

  /* CLEAR HISTORY */
  if (target.id === "clearCollectionBtn") {
    if (!confirm("Clear entire collection history?")) return;
    window.collections = [];
    saveCollections();
    renderCollection();
    window.updateUniversalBar?.();
    return;
  }

  /* CREDIT → PAID */
  const btn = target.closest(".pending-collect-btn");
  if (!btn) return;

  const id  = btn.dataset.id;
  const amt = cNum(btn.dataset.amount);

  const sale = (window.sales || []).find(s => s.id == id);
  if (!sale) return alert("Sale not found.");

  if (String(sale.status).toLowerCase() !== "credit") {
    alert("This sale is not CREDIT anymore.");
    renderPendingCollections();
    renderCollection();
    return;
  }

  /* Confirmation (full details) */
  const confirmMsg =
    `Product: ${sale.product}\n` +
    `Qty: ${sale.qty}\n` +
    `Rate: ₹${sale.price}\n` +
    `Total: ₹${sale.total}\n` +
    (sale.customer ? `Customer: ${sale.customer}\n` : "") +
    (sale.phone ? `Phone: ${sale.phone}\n` : "") +
    `\nMark this as COLLECTED?`;

  if (!confirm(confirmMsg)) return;

  /* Mark as paid */
  sale.status = "Paid";
  window.saveSales?.();

  /* Build history string */
  const detailText =
    `${sale.product} — Qty ${sale.qty} × ₹${sale.price} = ₹${sale.total}` +
    (sale.customer ? ` — ${sale.customer}` : "") +
    (sale.phone ? ` — ${sale.phone}` : "");

  /* Save entry */
  window.addCollectionEntry("Sale (Credit cleared)", detailText, amt);

  /* Refresh UI */
  renderPendingCollections();
  renderCollection();
  window.renderSales?.();
  window.updateUniversalBar?.();

  alert("Collection saved & marked as Paid.");
});

/* ===========================================================
   INIT
=========================================================== */
window.addEventListener("load", () => {
  if (!Array.isArray(window.collections)) {
    window.collections = [];
    saveCollections();
  }

  renderPendingCollections();
  renderCollection();
  window.updateUniversalBar?.();
});
