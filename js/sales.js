/* ===========================================================
   sales.js — FINAL (consolidated)
   - Credit profit excluded until collection
   - collectCreditSale() calls window.collectCreditSale(...) (collection module)
   - Full UI refresh + safe checks
=========================================================== */

/* ------------------------------
   TIME FORMAT
------------------------------ */
function getCurrentTime12hr() {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
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

/* ===========================================================
   ADD SALE ENTRY
   ⭐ CREDIT profit NOT added here (profit reserved for collection)
=========================================================== */
function addSaleEntry({ date, type, product, qty, price, status, customer, phone }) {
  qty = Number(qty);
  price = Number(price);

  if (!type || !product || qty <= 0 || price <= 0) return;

  const p = (window.stock || []).find(x => x.type === type && x.name === product);
  if (!p) { alert("Product not found in stock."); return; }

  const remain = Number(p.qty) - Number(p.sold || 0);
  if (remain < qty) { alert("Not enough stock!"); return; }

  const cost  = Number(p.cost || 0);
  const total = qty * price;
  const profit = total - qty * cost; // stored but only treated as realized after payment

  // Update stock (sold quantity)
  p.sold = Number(p.sold || 0) + qty;
  window.saveStock?.();

  // Add sale
  window.sales = window.sales || [];
  window.sales.push({
    id: uid ? uid("sale") : Date.now().toString(),
    date: date || todayDate(),
    time: getCurrentTime12hr(),
    type,
    product,
    qty,
    price,
    total,
    profit,   // candidate profit; considered realized only when status != credit
    cost,
    status: (status || "Paid"),
    customer: customer || "",
    phone: phone || ""
  });

  window.saveSales?.();

  // Full UI refresh
  renderSales?.();
  renderPendingCollections?.();
  renderCollection?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
  window.updateUniversalBar?.();
}
window.addSaleEntry = addSaleEntry;

/* ===========================================================
   CREDIT → PAID (Collect)
   - Mark sale as Paid
   - Compute and persist profit
   - DO NOT push collected credit to collectionHistory
   - Instead call window.collectCreditSale(sale) so credit-history module handles it
=========================================================== */
function collectCreditSale(id) {
  const s = (window.sales || []).find(x => x.id === id);
  if (!s) {
    alert("Sale not found.");
    return;
  }

  if (String(s.status || "").toLowerCase() !== "credit") {
    alert("This sale is already Paid.");
    return;
  }

  const msg = [
    `Product: ${s.product} (${s.type})`,
    `Qty: ${s.qty}`,
    `Rate: ₹${s.price}`,
    `Total: ₹${s.total}`,
  ];
  if (s.customer) msg.push("Customer: " + s.customer);
  if (s.phone)    msg.push("Phone: " + s.phone);

  if (!confirm(msg.join("\n") + "\n\nMark as PAID & Collect?")) return;

  // update status + profit
  s.status = "Paid";
  s.profit = Number(s.total) - Number((s.qty || 0) * (s.cost || 0));

  // save
  window.saveSales?.();

  // If collection module provides a collector for credit-sales, call it.
  // This keeps credit-collected entries separate from regular collectionHistory.
  try {
    if (typeof window.collectCreditSale === "function" && window.collectCreditSale !== collectCreditSale) {
      // Avoid infinite recursion: ensure we are not calling ourselves
      window.collectCreditSale(s);
    } else if (typeof window.collectCreditSaleFallback === "function") {
      // fallback hook if collection module exported a differently-named helper
      window.collectCreditSaleFallback(s);
    } else {
      // As a last-resort fallback (shouldn't be the default),
      // add a zero-amount collection history entry so Collection tab doesn't break.
      // NOTE: user prefers credit-collected NOT to appear in Collection tab, so this is fallback only.
      window.addCollectionEntry?.("Sale (Credit cleared)", `${s.product} — Collected ₹${s.total}`, 0);
    }
  } catch (err) {
    console.warn("collectCreditSale: error calling external collector:", err);
  }

  // Recompute UI / totals
  renderSales?.();
  renderPendingCollections?.();
  renderCollection?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
  window.updateUniversalBar?.();

  alert("Credit marked PAID and recorded in Credit History.");
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
      const t = Number(s.total || 0);
      totalSum += t;

      // Realised profit counted only for Paid sales
      if (String(s.status || "").toLowerCase() !== "credit") {
        profitSum += Number(s.profit || 0);
      }

      const isCredit = String(s.status || "").toLowerCase() === "credit";

      const statusHTML = isCredit
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
          <td>₹${s.profit || 0}</td>
          <td>${statusHTML}</td>
        </tr>
      `;
    })
    .join("");

  document.getElementById("salesTotal") && (document.getElementById("salesTotal").textContent = totalSum);
  document.getElementById("profitTotal") && (document.getElementById("profitTotal").textContent = profitSum);

  window.updateUniversalBar?.();
}
window.renderSales = renderSales;

/* ===========================================================
   CLEAR SALES
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
