/* ===========================================================
   collection.js — FINAL V1.0
   Handles:
   ✔ Credit Sales Collection
   ✔ Service Payment Collection
   ✔ Collection History Recording
   ✔ Today's Collection Summary
=========================================================== */

const esc = x => (x === undefined || x === null) ? "" : String(x);

/* ---------- LOAD HISTORY ---------- */
window.collections = JSON.parse(localStorage.getItem("ks-collections") || "[]");

function saveCollections() {
  localStorage.setItem("ks-collections", JSON.stringify(window.collections));
}

/* ===========================================================
   🔥 RENDER PENDING CREDIT SALES
=========================================================== */
function renderPendingCredit() {
  const tbody = qs("#pendingCreditTable tbody");
  if (!tbody) return;

  const list = (window.sales || []).filter(s => s.status === "credit");

  qs("#pendingCreditCount").textContent = list.length;

  tbody.innerHTML = list.map((s, i) => `
    <tr>
      <td data-label="Date">${toDisplay(s.date)}</td>
      <td data-label="Type">${esc(s.type)}</td>
      <td data-label="Product">${esc(s.name)}</td>
      <td data-label="Qty">${esc(s.qty)}</td>
      <td data-label="Total">₹${esc(s.total)}</td>
      <td data-label="Action">
        <button class="small-btn" onclick="collectCredit(${i})">Collect</button>
      </td>
    </tr>
  `).join("");
}

/* ---------- COLLECT CREDIT ---------- */
function collectCredit(i) {
  const list = (window.sales || []).filter(s => s.status === "credit");
  const s = list[i];
  if (!s) return;

  // mark as paid
  const index = window.sales.findIndex(x => x.id === s.id);
  window.sales[index].status = "paid";
  saveSales();

  // add to collection history
  window.collections.push({
    date: todayDate(),
    source: "Sales Credit",
    details: `${s.type} - ${s.name}`,
    amount: s.total
  });
  saveCollections();

  renderPendingCredit();
  renderCollectionHistory();
  renderSales?.();
  updateSummaryCards?.();
  renderAnalytics?.();
}

/* ===========================================================
   🔥 RENDER PENDING SERVICE PAYMENTS
=========================================================== */
function renderPendingService() {
  const tbody = qs("#pendingServiceTable tbody");
  if (!tbody) return;

  const list = (window.services || []).filter(s => s.status === "Pending" && s.bill > s.advance);

  qs("#pendingServiceCount").textContent = list.length;

  tbody.innerHTML = list.map((s, i) => `
    <tr>
      <td data-label="Job ID">${esc(s.id)}</td>
      <td data-label="Customer">${esc(s.customer)}</td>
      <td data-label="Item">${esc(s.item)}</td>
      <td data-label="Invest">₹${esc(s.invest)}</td>
      <td data-label="Pending">₹${esc(s.bill - s.advance)}</td>
      <td data-label="Action">
        <button class="small-btn" onclick="collectService(${i})">Collect</button>
      </td>
    </tr>
  `).join("");
}

/* ---------- COLLECT SERVICE PAYMENT ---------- */
function collectService(i) {
  const list = (window.services || []).filter(s => s.status === "Pending" && s.bill > s.advance);
  const s = list[i];
  if (!s) return;

  const pending = s.bill - s.advance;

  // Update service entry
  const idx = window.services.findIndex(x => x.id === s.id);
  window.services[idx].advance = s.bill;
  window.services[idx].status = "Completed";
  saveServices();

  // Record in history
  window.collections.push({
    date: todayDate(),
    source: "Service",
    details: `${s.customer} (${s.item})`,
    amount: pending
  });
  saveCollections();

  renderPendingService();
  renderCollectionHistory();
  renderServiceTables?.();
  updateSummaryCards?.();
  renderAnalytics?.();
}

/* ===========================================================
   🔥 RENDER COLLECTION HISTORY
=========================================================== */
function renderCollectionHistory() {
  const tbody = qs("#collectionHistoryTable tbody");
  if (!tbody) return;

  let today = 0;

  tbody.innerHTML = window.collections.map(c => {
    if (c.date === todayDate()) today += Number(c.amount || 0);

    return `
      <tr>
        <td data-label="Date">${toDisplay(c.date)}</td>
        <td data-label="Source">${esc(c.source)}</td>
        <td data-label="Details">${esc(c.details)}</td>
        <td data-label="Amount">₹${esc(c.amount)}</td>
      </tr>
    `;
  }).join("");

  qs("#collectedToday").textContent = "₹" + today;
}

/* ===========================================================
   🚀 INIT
=========================================================== */
window.addEventListener("load", () => {
  renderPendingCredit();
  renderPendingService();
  renderCollectionHistory();
});
