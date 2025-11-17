/* ==========================================================
   💰 sales.js — Sales Viewer + Profit Manager (FINAL v4.0)
   Pure VIEW MODE — No manual product adding
   Sales only come from:
     ✔ Stock Quick Sale
     ✔ Stock Quick Credit
========================================================== */

/* window.sales already loaded from core.js */

/* ----------------------------------------------------------
   SAVE SALES
---------------------------------------------------------- */
function saveSales() {
  localStorage.setItem("sales-data", JSON.stringify(window.sales));
  window.dispatchEvent(new Event("storage"));
}

/* ----------------------------------------------------------
   REFRESH PRODUCT DROPDOWNS (VIEW FILTER ONLY)
---------------------------------------------------------- */
function refreshSaleSelectors() {
  const tdd = qs("#saleType");
  const pdd = qs("#saleProduct");

  if (!tdd || !pdd) return;

  /* TYPES */
  tdd.innerHTML =
    `<option value="all">All Types</option>` +
    window.types
      .map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`)
      .join("");

  /* PRODUCTS */
  const unique = [...new Set(window.sales.map(s => s.product))];

  pdd.innerHTML =
    `<option value="all">All Products</option>` +
    unique.map(p => `<option value="${esc(p)}">${esc(p)}</option>`).join("");
}

/* ----------------------------------------------------------
   FILTER SALES
---------------------------------------------------------- */
function filterSales() {
  renderSales();
}

/* ----------------------------------------------------------
   MARK CREDIT → PAID
---------------------------------------------------------- */
function markSalePaid(id) {
  const s = window.sales.find(x => x.id === id);
  if (!s) return;

  if (s.status === "Paid") return alert("Already Paid");

  if (!confirm("Mark this entry as PAID?")) return;

  s.status = "Paid";

  saveSales();
  renderSales();
  updateSummaryCards?.();
  renderAnalytics?.();
}

/* ----------------------------------------------------------
   DELETE A SALE (Optional)
---------------------------------------------------------- */
function deleteSale(id) {
  if (!confirm("Delete this sale entry?")) return;

  window.sales = window.sales.filter(s => s.id !== id);
  saveSales();
  renderSales();
  updateSummaryCards?.();
  renderAnalytics?.();
}

/* ----------------------------------------------------------
   CLEAR ALL SALES
---------------------------------------------------------- */
qs('#clearSalesBtn')?.addEventListener('click', () => {
  if (!confirm("Delete ALL sales permanently?")) return;

  window.sales = [];
  saveSales();
  renderSales();
  updateSummaryCards?.();
  renderAnalytics?.();
});

/* ----------------------------------------------------------
   RENDER SALES TABLE (Filters Fixed)
---------------------------------------------------------- */
function renderSales() {
  const tbody = qs("#salesTable tbody");
  const totalEl = qs("#salesTotal");
  const profitEl = qs("#profitTotal");

  if (!tbody) return;

  const typeFilter = qs("#saleType")?.value || "all";
  const prodFilter = qs("#saleProduct")?.value || "all";

  let total = 0;
  let profit = 0;

  let rows = "";

  window.sales
    .filter(s => typeFilter === "all" || s.type === typeFilter)
    .filter(s => prodFilter === "all" || s.product === prodFilter)
    .forEach(s => {
      total += Number(s.amount);
      profit += Number(s.profit);

      rows += `
      <tr>
        <td>${s.date}</td>
        <td>${esc(s.type)}</td>
        <td>${esc(s.product)}</td>
        <td>${s.qty}</td>
        <td>${s.price}</td>
        <td>${s.amount}</td>
        <td>${s.profit}</td>
        <td>${s.status === "Credit" ? "💳 Credit" : "💰 Paid"}</td>
        <td>
          ${
            s.status === "Credit"
              ? `<button class="small-btn" onclick="markSalePaid('${s.id}')">Mark Paid</button>`
              : ``
          }
        </td>
      </tr>`;
    });

  if (!rows)
    rows = `<tr><td colspan="9">No sales found</td></tr>`;

  tbody.innerHTML = rows;
  totalEl.textContent = total;
  profitEl.textContent = profit;
}

/* ----------------------------------------------------------
   INITIAL LOAD
---------------------------------------------------------- */
window.addEventListener("load", () => {
  refreshSaleSelectors();
  renderSales();
});
