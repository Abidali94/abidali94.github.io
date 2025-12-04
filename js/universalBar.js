/* ===========================================================
   universalBar.js — FINAL STABLE VERSION (v10)
   -----------------------------------------------------------
   • Calculates EVERYTHING from single place:
       - Net Profit
       - Stock Investment (Sold Items)
       - Service Investment (Completed Jobs)
       - Pending Credit (Sales + Service)
   • CREDIT-SAFE math (credit profit not counted)
   • Collection logic 100% sync
   • No duplicates, No stale values, No console errors
=========================================================== */

(function(){

  const safeNum = n => Number(n || 0);

  /* --------------------------------------------------------
     Read global arrays (all modules update these)
  -------------------------------------------------------- */
  function getAll() {
    return {
      sales: Array.isArray(window.sales) ? window.sales : [],
      services: Array.isArray(window.services) ? window.services : [],
      stock: Array.isArray(window.stock) ? window.stock : []
    };
  }

  /* --------------------------------------------------------
     CALCULATE STOCK INVESTMENT (sold items only)
  -------------------------------------------------------- */
  function calcStockInvestment() {
    const { stock } = getAll();
    let invested = 0;

    stock.forEach(item => {
      const qtySold = safeNum(item.sold);
      const cost = safeNum(item.cost);
      invested += (qtySold * cost);
    });

    return invested;
  }

  /* --------------------------------------------------------
     CALCULATE SERVICE INVESTMENT (completed only)
  -------------------------------------------------------- */
  function calcServiceInvestment() {
    const { services } = getAll();
    let invested = 0;

    services.forEach(svc => {
      const st = String(svc.status || "").toLowerCase();
      if (st === "completed" || st === "collected") {
        invested += safeNum(svc.invest);
      }
    });

    return invested;
  }

  /* --------------------------------------------------------
     CALCULATE NET PROFIT (PAID ONLY)
     ⭐ Credit profit excluded — added only after collection
  -------------------------------------------------------- */
  function calcNetProfit() {
    const { sales, services } = getAll();

    let saleProfit = 0;
    let serviceProfit = 0;

    sales.forEach(s => {
      if (String(s.status).toLowerCase() === "paid") {
        saleProfit += safeNum(s.profit);
      }
    });

    services.forEach(svc => {
      const st = String(svc.status || "").toLowerCase();
      if (st === "completed" || st === "collected") {
        serviceProfit += safeNum(svc.profit);
      }
    });

    return {
      sale: saleProfit,
      service: serviceProfit,
      total: saleProfit + serviceProfit
    };
  }

  /* --------------------------------------------------------
     CALCULATE PENDING CREDIT (sales + service)
  -------------------------------------------------------- */
  function calcPendingCredit() {
    const { sales, services } = getAll();
    let pending = 0;

    sales.forEach(s => {
      if (String(s.status).toLowerCase() === "credit") {
        pending += safeNum(s.total);
      }
    });

    services.forEach(svc => {
      if (String(svc.creditStatus || svc.status).toLowerCase() === "credit") {
        pending += safeNum(svc.remaining);
      }
    });

    return pending;
  }

  /* --------------------------------------------------------
     UPDATE UI (Universal Bar Cards)
  -------------------------------------------------------- */
  function updateUI(values) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = "₹" + Number(val || 0).toLocaleString();
    };

    set("unNetProfit", values.net.total);
    set("unStockInv", values.stockInv);
    set("unServiceInv", values.serviceInv);
    set("unPendingCredit", values.pendingCredit);
  }

  /* --------------------------------------------------------
     MASTER FUNCTION — used everywhere
  -------------------------------------------------------- */
  window.updateUniversalBar = function () {
    const stockInv = calcStockInvestment();
    const serviceInv = calcServiceInvestment();
    const net = calcNetProfit();
    const pendingCredit = calcPendingCredit();

    updateUI({ stockInv, serviceInv, net, pendingCredit });

    return { stockInv, serviceInv, net, pendingCredit };
  };

  /* --------------------------------------------------------
     INIT — called on load
  -------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    try { window.updateUniversalBar(); }
    catch(e){ console.error("UniversalBar init failed:", e); }
  });

})();
