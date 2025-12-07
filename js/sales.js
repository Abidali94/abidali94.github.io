/* ===========================================================
   sales.js — BUSINESS VERSION (v16 FINAL)
   ✔ Sales + Credit unified
   ✔ Credit profit added only after collection
   ✔ Collection history entry for paid credit
   ✔ UniversalBar, Dashboard, Analytics LIVE refresh
   ✔ FIX: Type dropdown auto refresh ALWAYS
=========================================================== */

/* ------------------------------
   TIME FORMAT
------------------------------ */
function getCurrentTime12hr() {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

/* ------------------------------
   REFRESH SALE TYPE DROPDOWN
------------------------------ */
function refreshSaleTypeSelector() {
  const sel = document.getElementById("saleType");
  if (!sel) return;

  sel.innerHTML = `<option value="all">All Types</option>`;

  (window.types || []).forEach(t => {
    sel.innerHTML += `<option value="${t.name}">${t.name}</option>`;
  });
}
window.refreshSaleTypeSelector = refreshSaleTypeSelector;

/* ===========================================================
   ADD SALE ENTRY
   ⭐ CREDIT: profit NOT counted now
=========================================================== */
function addSaleEntry({ date, type, product, qty, price, status, customer, phone }) {

  qty = Number(qty);
  price = Number(price);
  status = status || "Paid";

  if (!type || !product || qty <= 0 || price <= 0) return;

  const p = (window.stock || []).find(x => x.type === type && x.name === product);
  if (!p) { alert("Product not found in stock."); return; }

  const remain = Number(p.qty) - Number(p.sold);
  if (remain < qty) { alert("Not enough stock!"); return; }

  const cost = Number(p.cost);
  const total = qty * price;
  let profit = 0;

  /* ⭐ if PAID → profit now, if CREDIT → profit later */
  if ((status.toLowerCase()) === "paid") {
    profit = total - qty * cost;
  } else {
    profit = 0;
  }

  /* -------------------------
      STOCK UPDATE
  ------------------------- */
  p.sold = Number(p.sold) + qty;
  window.saveStock?.();

  /* -------------------------
      NEW SALE RECORD
  ------------------------- */
  window.sales.push({
    id: uid("sale"),
    date: date || todayDate(),
    time: getCurrentTime12hr(),
    type,
    product,
    qty,
    price,
    total,
    profit,
    cost,
    status,
    customer: customer || "",
    phone: phone || ""
  });

  window.saveSales?.();

  /* -------------------------
      FULL LIVE REFRESH
  ------------------------- */
  renderSales?.();
  renderPendingCollections?.();
  renderCollection?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
  window.updateUniversalBar?.();
}

window.addSaleEntry = addSaleEntry;

/* ===========================================================
   CREDIT → PAID
   ⭐ Profit & analytics added ONLY now
=========================================================== */
function collectCreditSale(id) {
  const s = window.sales.find(x => x.id === id);
  if (!s) return;

  if ((s.status || "").toLowerCase() !== "credit") {
    alert("Already Paid.");
    return;
  }

  /* CONFIRM */
  const msg = [
    `Product: ${s.product} (${s.type})`,
    `Qty: ${s.qty}`,
    `Rate: ₹${s.price}`,
    `Total: ₹${s.total}`,
    s.customer ? `Customer: ${s.customer}` : "",
    s.phone ? `Phone: ${s.phone}` : ""
  ].filter(Boolean);

  if (!confirm(msg.join("\n") + "\n\nMark as PAID & Collect?")) return;

  /* -------------------------
     UPDATE STATUS
  ------------------------- */
  s.status = "Paid";

  /* -------------------------
     NOW profit becomes valid
  ------------------------- */
  s.profit = Number(s.total) - Number(s.qty * s.cost);
  window.saveSales?.();

  /* -------------------------
     COLLECTION HISTORY ENTRY
     ⭐ Amount = TOTAL collected
  ------------------------- */
  const collected = s.total;

  const details =
    `${s.product} — Qty ${s.qty} × ₹${s.price} = ₹${s.total}` +
    ` (Credit Cleared)` +
    (s.customer ? ` — ${s.customer}` : "") +
    (s.phone ? ` — ${s.phone}` : "");

  window.addCollectionEntry("Sale (Credit cleared)", details, collected);

  /* -------------------------
     LIVE REFRESH EVERYTHING
  ------------------------- */
  renderSales?.();
  renderPendingCollections?.();
  renderCollection?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
  window.updateUniversalBar?.();

  alert("Credit Collected Successfully!");
}

window.collectCreditSale = collectCreditSale;

/* ===========================================================
   RENDER SALES TABLE
=========================================================== */
function renderSales() {
  const tbody = document.querySelector("#salesTable tbody");
  if (!tbody) return;

  const filterType = document.getElementById("saleType")?.value || "all";
  const filterDate = document.getElementById("saleDate")?.value || "";

  let list = [...(window.sales || [])];

  if (filterType !== "all") list = list.filter(s => s.type === filterType);
  if (filterDate) list = list.filter(s => s.date === filterDate);

  let totalSum = 0;
  let profitSum = 0;

  tbody.innerHTML = list
    .map(s => {
      const t = Number(s.total);
      totalSum += t;

      /* ⭐ Profit ONLY if PAID */
      if ((s.status || "").toLowerCase() === "paid") {
        profitSum += Number(s.profit || 0);
      }

      const statusHTML =
        (s.status || "").toLowerCase() === "credit"
          ? `
            <span class="status-credit">Credit</span>
            <button class="small-btn"
              style="background:#16a34a;color:white;padding:3px 8px;font-size:11px"
              onclick="collectCreditSale('${s.id}')">
              Collect
            </button>
          `
          : `<span class="status-paid">Paid</span>`;

      return `
        <tr>
          <td>${s.date}<br><small>${s.time || ""}</small></td>
          <td>${s.type}</td>
          <td>${s.product}</td>
          <td>${s.qty}</td>
          <td>₹${s.price}</td>
          <td>₹${t}</td>
          <td>₹${s.profit}</td>
          <td>${statusHTML}</td>
        </tr>
      `;
    })
    .join("");

  document.getElementById("salesTotal").textContent = totalSum;
  document.getElementById("profitTotal").textContent = profitSum;

  window.updateUniversalBar?.();
}
window.renderSales = renderSales;

/* ===========================================================
   CLEAR SALES (PAID + CREDIT)
=========================================================== */
document.getElementById("clearSalesBtn")?.addEventListener("click", () => {
  if (!confirm("Clear ALL sales?")) return;

  window.sales = [];
  window.saveSales?.();

  renderSales();
  renderPendingCollections?.();
  renderCollection?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
  window.updateUniversalBar?.();
});

/* ===========================================================
   ⭐ VERY IMPORTANT — INITIALIZATION FIX
   (Dropdown must fill when page loads)
=========================================================== */
window.addEventListener("load", () => {
  refreshSaleTypeSelector();   // ⭐ FIX: always load types
  renderSales();
});
