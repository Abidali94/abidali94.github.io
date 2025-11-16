/* ==========================================================
   💰 sales.js — Sales + Profit Manager (v2.1)
   With: Credit Customer Prompt + Clear All + Stock Sync
========================================================== */

const SALES_KEY = "sales-data";
window.sales = JSON.parse(localStorage.getItem(SALES_KEY) || "[]");

let profitLocked = false;

/* ----------------------------------------------------------
   SAVE SALES
---------------------------------------------------------- */
function saveSales() {
  localStorage.setItem(SALES_KEY, JSON.stringify(window.sales));
  window.dispatchEvent(new Event("storage"));
}

/* ----------------------------------------------------------
   REFRESH TYPE + PRODUCT DROPDOWNS
---------------------------------------------------------- */
function refreshSaleSelectors() {
  const tdd = qs("#saleType");
  const pdd = qs("#saleProduct");
  if (!tdd || !pdd) return;

  tdd.innerHTML =
    `<option value="">Select Type</option>` +
    window.types.map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`).join("");

  const products = window.stock.map(s => ({ type: s.type, name: s.name }));
  const unique = products.filter(
    (x, i, a) => a.findIndex(y => y.type === x.type && y.name === x.name) === i
  );

  pdd.innerHTML =
    `<option value="">Select Product</option>` +
    unique
      .map(p => `<option value="${p.type}|||${p.name}">${esc(p.type)} — ${esc(p.name)}</option>`)
      .join("");
}

/* ----------------------------------------------------------
   ADD SALE (Customer Prompt Included)
---------------------------------------------------------- */
function addSale() {
  const date = qs('#saleDate')?.value || todayDate();
  const typeProd = qs('#saleProduct')?.value;
  const qty = parseInt(qs('#saleQty')?.value || 0);
  const price = parseFloat(qs('#salePrice')?.value || 0);
  const status = qs('#saleStatus')?.value || "Paid";

  if (!typeProd) return alert("Select product");
  if (!qty || qty <= 0) return alert("Invalid Qty");
  if (!price || price <= 0) return alert("Invalid Price");

  const [type, name] = typeProd.split("|||");

  /* Remaining */
  const p = findProduct(type, name);
  const remain = p ? (p.qty - (p.sold || 0)) : 0;

  if (qty > remain && !confirm(`Only ${remain} in stock. Continue?`)) return;

  /* Ask customer name for Credit */
  let customer = "";
  if (status === "Credit") {
    customer = prompt("Customer name for credit sale:") || "Customer";
  }

  /* Cost + Profit */
  const cost = getProductCost(type, name);
  const profit = Math.round((price - cost) * qty);

  /* Update Stock */
  if (p) {
    p.sold = (p.sold || 0) + qty;
    saveStock();
  }

  /* Add Entry */
  window.sales.push({
    id: uid("sale"),
    date,
    type,
    product: name,
    qty,
    price,
    amount: price * qty,
    profit,
    status,
    customer    // NEW FIELD
  });

  saveSales();
  renderSales();
  renderStock();
  updateSummaryCards?.();
  renderAnalytics?.();

  qs('#saleQty').value = "";
  qs('#salePrice').value = "";
}

/* ----------------------------------------------------------
   MARK CREDIT → PAID
---------------------------------------------------------- */
function markSalePaid(id) {
  const s = window.sales.find(x => x.id === id);
  if (!s) return;

  if (s.status === "Paid") return alert("Already Paid!");

  if (!confirm("Mark this credit as paid?")) return;

  s.status = "Paid";
  saveSales();
  renderSales();
}
qs('#clearSalesBtn')?.addEventListener('click', () => {
  if (!confirm("Delete ALL sales permanently? This cannot be undone.")) return;

  window.sales = [];
  saveSales();        // Save only sales (not entire storage)
  renderSales();
  updateSummaryCards?.();
  renderAnalytics?.();
});

/* ----------------------------------------------------------
   DELETE A SALE
---------------------------------------------------------- */
function deleteSale(id) {
  if (!confirm("Delete this record?")) return;
  window.sales = window.sales.filter(s => s.id !== id);
  saveSales();
  renderSales();
}

/* ----------------------------------------------------------
   CLEAR ALL SALES (✔ Added)
---------------------------------------------------------- */
qs('#clearSalesBtn')?.addEventListener('click', () => {
  if (!confirm("Delete ALL sales permanently? This cannot be undone.")) return;

  window.sales = [];
  saveSales();
  renderSales();
  updateSummaryCards?.();
  renderAnalytics?.();
});

/* ----------------------------------------------------------
   RENDER SALES TABLE
---------------------------------------------------------- */
function renderSales() {
  const tbody = qs("#salesTable tbody");
  const totalEl = qs("#salesTotal");
  const profitEl = qs("#profitTotal");
  if (!tbody) return;

  let total = 0, profit = 0;

  tbody.innerHTML = window.sales
    .map(s => {
      total += s.amount;
      profit += s.profit;

      return `
        <tr>
          <td>${s.date}</td>
          <td>${esc(s.type)}</td>
          <td>${esc(s.product)}</td>
          <td>${s.qty}</td>
          <td>${s.price}</td>
          <td>${s.amount}</td>
          <td class="profit-cell">${s.profit}</td>
          <td>${s.customer || ""}</td>
          <td>
            ${
              s.status === "Credit"
                ? `<button onclick="markSalePaid('${s.id}')" class="small-btn">💳 Pay</button>`
                : `<span class="ok">💰 Paid</span>`
            }
          </td>
        </tr>`;
    })
    .join("");

  totalEl.textContent = total;
  profitEl.textContent = profit;

  applyProfitVisibility();
}

/* ----------------------------------------------------------
   PROFIT LOCK
---------------------------------------------------------- */
function applyProfitVisibility() {
  const cells = document.querySelectorAll(".profit-cell");
  const head = document.querySelector("#salesTable thead th:nth-child(7)");

  if (profitLocked) {
    cells.forEach(c => (c.style.display = "none"));
    if (head) head.style.display = "none";
    qs('#profitTotal').style.display = "none";
  } else {
    cells.forEach(c => (c.style.display = ""));
    if (head) head.style.display = "";
    qs('#profitTotal').style.display = "";
  }
}

function toggleProfit() {
  if (!profitLocked) {
    profitLocked = true;
    applyProfitVisibility();
    return alert("Profit Hidden. Unlock using Admin password.");
  }

  const pw = prompt("Enter Admin password:");
  if (!pw || !validateAdminPassword(pw)) return alert("Wrong password!");

  profitLocked = false;
  applyProfitVisibility();
  alert("Profit Unlocked.");
}

/* ----------------------------------------------------------
   PRINT SALES
---------------------------------------------------------- */
function printSales() {
  const rows = qs("#salesTable tbody").innerHTML;
  const head = qs("#salesTable thead").innerHTML;

  const w = window.open("", "_blank");
  w.document.write(`
    <html><head><title>Sales Report</title>
    <style>table{width:100%;border-collapse:collapse;}
    th,td{border:1px solid #ccc;padding:6px;text-align:center;}</style>
    </head><body>
    <h2>Sales Report</h2>
    <table><thead>${head}</thead><tbody>${rows}</tbody></table>
    </body></html>`);
  w.document.close();
  w.print();
}

/* ----------------------------------------------------------
   INITIAL LOAD
---------------------------------------------------------- */
window.addEventListener("load", () => {
  refreshSaleSelectors();
  renderSales();
});
