/* ===========================================================
   universal-bar.js — Top Metrics + Collect Buttons (v1.0)
   • Calculates:
       - Net Profit  = (Sale + Service) − Expenses
       - Stock Investment (sold items)
       - Service Investment (completed jobs)
       - Pending Credit Sales
   • Provides:
       - window.updateUniversalBar()
       - Collect buttons for Net, Stock, Service
   • Uses:
       - window.sales, window.services, window.expenses, window.stock
       - window.addCollectionEntry (from collection.js)
=========================================================== */

(function () {

  function num(v) {
    const n = Number(v || 0);
    return isNaN(n) ? 0 : n;
  }

  function computeMetrics() {
    const sales   = window.sales   || [];
    const services = window.services || [];
    const expenses = window.expenses || [];
    const stock    = window.stock    || [];

    let saleProfitCollected   = 0;
    let serviceProfitCollected = 0;
    let totalExpenses         = 0;
    let pendingCreditTotal    = 0;
    let stockInvestSold       = 0;
    let serviceInvestCompleted = 0;

    // ---- Sales ----
    sales.forEach(s => {
      const st = String(s.status || "").toLowerCase();
      const profit = num(s.profit);
      const total  = num(s.total || (num(s.qty) * num(s.price)));

      if (st === "credit") {
        pendingCreditTotal += total;
      } else {
        saleProfitCollected += profit;
      }
    });

    // ---- Service ----
    services.forEach(j => {
      const st = String(j.status || "").toLowerCase();
      if (st === "completed") {
        serviceProfitCollected += num(j.profit);
        serviceInvestCompleted += num(j.invest);
      }
    });

    // ---- Expenses ----
    expenses.forEach(e => {
      totalExpenses += num(e.amount || e.value);
    });

    // ---- Stock Investment (Sold Items) ----
    stock.forEach(p => {
      const soldQty = num(p.sold);
      const cost    = num(p.cost);
      if (soldQty > 0 && cost > 0) {
        stockInvestSold += soldQty * cost;
      }
    });

    const netProfit = saleProfitCollected + serviceProfitCollected - totalExpenses;

    return {
      saleProfitCollected,
      serviceProfitCollected,
      totalExpenses,
      pendingCreditTotal,
      stockInvestSold,
      serviceInvestCompleted,
      netProfit
    };
  }

  function formatMoney(v) {
    return "₹" + Math.round(num(v));
  }

  function updateUniversalBar() {
    const m = computeMetrics();

    const elNet        = document.getElementById("unNetProfit");
    const elSaleProfit = document.getElementById("unSaleProfit");
    const elServProfit = document.getElementById("unServiceProfit");
    const elExpenses   = document.getElementById("unExpenses");
    const elStockInv   = document.getElementById("unStockInv");
    const elServInv    = document.getElementById("unServiceInv");
    const elCredit     = document.getElementById("unCreditSales");

    if (elNet)        elNet.textContent        = formatMoney(m.netProfit);
    if (elSaleProfit) elSaleProfit.textContent = formatMoney(m.saleProfitCollected);
    if (elServProfit) elServProfit.textContent = formatMoney(m.serviceProfitCollected);
    if (elExpenses)   elExpenses.textContent   = formatMoney(m.totalExpenses);
    if (elStockInv)   elStockInv.textContent   = formatMoney(m.stockInvestSold);
    if (elServInv)    elServInv.textContent    = formatMoney(m.serviceInvestCompleted);
    if (elCredit)     elCredit.textContent     = formatMoney(m.pendingCreditTotal);

    // last snapshot – collect prompts లో చూపించడానికి
    window.__unMetrics = m;
  }

  window.updateUniversalBar = updateUniversalBar;

  // ---------- Collect Button Logic (Option 1) ----------
  function handleCollect(kind) {
    if (!window.addCollectionEntry) {
      alert("Collection history is not ready yet.");
      return;
    }

    const m = window.__unMetrics || computeMetrics();

    let label = "";
    let approx = 0;

    if (kind === "net") {
      label = "Net Profit (Sale + Service − Expenses)";
      approx = m.netProfit;
    } else if (kind === "stock") {
      label = "Stock Investment (Sold Items)";
      approx = m.stockInvestSold;
    } else if (kind === "service") {
      label = "Service Investment (Completed)";
      approx = m.serviceInvestCompleted;
    } else {
      return;
    }

    const hint = approx > 0
      ? `Approx available: ₹${Math.round(approx)}`
      : `No positive balance visible.`;

    const inStr = prompt(
      `${label}\n${hint}\n\nEnter amount to record as collected:`
    );
    if (!inStr) return;

    const amt = Number(inStr);
    if (!amt || amt <= 0) {
      alert("Invalid amount.");
      return;
    }

    const note = prompt("Optional note (e.g., 'Owner withdrawal', 'Bank deposit'):", "") || "";

    // 👉 Option 1: Just record in collection history. We DO NOT touch sales/stock/services.
    window.addCollectionEntry(label, note, amt);

    // Collection tab + universal bar refresh
    window.renderCollection?.();
    window.updateUniversalBar?.();
    alert("Collection recorded in history.");
  }

  document.addEventListener("click", e => {
    const t = e.target;
    const kind = t?.dataset?.collect;
    if (!kind) return;
    handleCollect(kind);
  });

  window.addEventListener("load", () => {
    // initial render once all data loaded
    setTimeout(updateUniversalBar, 50);
  });

})();
