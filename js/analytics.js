// analytics.js — FINAL V6 (Dashboard Only)
// - Safe, self-contained, minimal global pollution
// - Exposes: window.getAnalyticsData, window.getSummaryTotals,
//            window.renderAnalytics, window.updateSummaryCards
// - Relies on optional helpers: todayDate(), getStockInvestmentAfterSale(), getServiceInvestmentCollected(), updateUniversalBar()

(function (global) {
  'use strict';

  // local safe helpers (don't rely on core.js being loaded first)
  const qs = s => document.querySelector(s);
  const escNum = v => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  // keep chart instance private but persistent across renders
  let cleanPieChart = null;

  /* --------------------------------
     TODAY + TOTAL ANALYTICS DATA
  ---------------------------------- */
  function getAnalyticsData() {
    const today = (typeof todayDate === "function")
      ? todayDate()
      : new Date().toISOString().slice(0, 10);

    const sales = Array.isArray(global.sales) ? global.sales : [];
    const expenses = Array.isArray(global.expenses) ? global.expenses : [];
    const services = Array.isArray(global.services) ? global.services : [];

    let todaySales = 0;
    let creditSales = 0;
    let todayExpenses = 0;
    let grossProfit = 0;

    // TODAY SALES
    sales.forEach(s => {
      if (!s || String(s.date || "") !== String(today)) return;

      const total = escNum(
        s.total ?? s.amount ??
        (Number(s.qty || 0) * Number(s.price || 0))
      );

      const status = String(s.status || "").toLowerCase();
      if (status === "credit") {
        creditSales += total;
      } else {
        todaySales += total;
        grossProfit += escNum(s.profit || 0);
      }
    });

    // TODAY SERVICE PROFIT (use date_out as completion date)
    services.forEach(j => {
      if (!j) return;
      if (String(j.date_out || "") === String(today)) {
        grossProfit += escNum(j.profit || 0);
      }
    });

    // TODAY EXPENSES
    expenses.forEach(e => {
      if (!e) return;
      if (String(e.date || "") === String(today)) {
        todayExpenses += escNum(e.amount || 0);
      }
    });

    const netProfit = grossProfit - todayExpenses;

    return {
      todaySales,
      creditSales,
      todayExpenses,
      grossProfit,
      netProfit
    };
  }

  /* --------------------------------
     GLOBAL TOTAL SUMMARY NUMBERS
  ---------------------------------- */
  function getSummaryTotals() {
    const sales = Array.isArray(global.sales) ? global.sales : [];
    const expenses = Array.isArray(global.expenses) ? global.expenses : [];
    const services = Array.isArray(global.services) ? global.services : [];

    let salesProfit = 0;
    let serviceProfit = 0;
    let creditTotal = 0;

    sales.forEach(s => {
      if (!s) return;
      const status = String(s.status || "").toLowerCase();
      const total = escNum(
        s.total ?? s.amount ??
        (Number(s.qty || 0) * Number(s.price || 0))
      );

      if (status === "credit") {
        creditTotal += total;
      } else {
        salesProfit += escNum(s.profit || 0);
      }
    });

    services.forEach(j => {
      if (!j) return;
      serviceProfit += escNum(j.profit || 0);
    });

    const totalProfit = salesProfit + serviceProfit;

    const totalExpenses = expenses.reduce((sum, e) => {
      if (!e) return sum;
      return sum + escNum(e.amount || 0);
    }, 0);

    const netProfit = totalProfit - totalExpenses;

    // Investments: delegate to optional functions (safe-check)
    let stockAfter = 0;
    let serviceInv = 0;

    try {
      if (typeof global.getStockInvestmentAfterSale === "function") {
        stockAfter = escNum(global.getStockInvestmentAfterSale());
      }
    } catch (err) {
      console.warn("getStockInvestmentAfterSale() threw:", err);
      stockAfter = 0;
    }

    try {
      if (typeof global.getServiceInvestmentCollected === "function") {
        serviceInv = escNum(global.getServiceInvestmentCollected());
      }
    } catch (err) {
      console.warn("getServiceInvestmentCollected() threw:", err);
      serviceInv = 0;
    }

    return {
      salesProfit,
      serviceProfit,
      totalProfit,
      totalExpenses,
      netProfit,
      creditTotal,
      stockAfter,
      serviceInv
    };
  }

  /* --------------------------------
     SMART DASHBOARD RENDER
  ---------------------------------- */
  function renderAnalytics() {
    // compute totals
    const {
      salesProfit,
      serviceProfit,
      totalProfit,
      totalExpenses,
      netProfit,
      creditTotal,
      stockAfter,
      serviceInv
    } = getSummaryTotals();

    // Dashboard DOM nodes (may not exist on some pages)
    const dashProfit = qs("#dashProfit");
    const dashExpenses = qs("#dashExpenses");
    const dashCredit = qs("#dashCredit");
    const dashInv = qs("#dashInv");

    if (dashProfit) dashProfit.textContent = "₹" + Math.round(totalProfit || 0);
    if (dashExpenses) dashExpenses.textContent = "₹" + Math.round(totalExpenses || 0);
    if (dashCredit) dashCredit.textContent = "₹" + Math.round(creditTotal || 0);
    if (dashInv) dashInv.textContent = "₹" + Math.round((Number(stockAfter || 0) + Number(serviceInv || 0)) || 0);

    // delegate universal bar (if available) to update itself
    try {
      if (typeof global.updateUniversalBar === "function") {
        global.updateUniversalBar();
      }
    } catch (err) {
      console.warn("updateUniversalBar() error:", err);
    }

    // PIE CHART: lazy create / destroy safely
    const canvas = qs("#cleanPie");
    if (!canvas) return;

    if (typeof Chart === "undefined") {
      // Chart.js not loaded — skip silently
      return;
    }

    try {
      if (cleanPieChart && typeof cleanPieChart.destroy === "function") {
        cleanPieChart.destroy();
        cleanPieChart = null;
      }

      const dataValues = [
        Number(totalProfit || 0),
        Number(totalExpenses || 0),
        Number(creditTotal || 0),
        Number((Number(stockAfter || 0) + Number(serviceInv || 0)) || 0)
      ];

      cleanPieChart = new Chart(canvas, {
        type: "pie",
        data: {
          labels: ["Profit", "Expenses", "Credit", "Investment"],
          datasets: [{
            data: dataValues,
            // keep colors consistent; you can move to CSS variables if desired
            backgroundColor: ["#2e7d32", "#c62828", "#1565c0", "#fbc02d"]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: "bottom" }
          }
        }
      });
    } catch (err) {
      console.error("renderAnalytics — Chart render failed:", err);
    }
  }

  /* --------------------------------
     TODAY SUMMARY CARDS (Overview Tab)
  ---------------------------------- */
  function updateSummaryCards() {
    const data = getAnalyticsData();

    const tSales = qs("#todaySales");
    const tCredit = qs("#todayCredit");
    const tExp = qs("#todayExpenses");
    const tGross = qs("#todayGross");
    const tNet = qs("#todayNet");

    if (tSales) tSales.textContent = "₹" + Math.round(data.todaySales || 0);
    if (tCredit) tCredit.textContent = "₹" + Math.round(data.creditSales || 0);
    if (tExp) tExp.textContent = "₹" + Math.round(data.todayExpenses || 0);
    if (tGross) tGross.textContent = "₹" + Math.round(data.grossProfit || 0);
    if (tNet) tNet.textContent = "₹" + Math.round(data.netProfit || 0);
  }

  /* --------------------------------
     Expose API on window (safe)
  ---------------------------------- */
  try {
    global.getAnalyticsData = getAnalyticsData;
    global.getSummaryTotals = getSummaryTotals;
    global.renderAnalytics = renderAnalytics;
    global.updateSummaryCards = updateSummaryCards;
  } catch (err) {
    // ignore if cannot attach
    console.warn("analytics: couldn't attach to global window:", err);
  }

  /* --------------------------------
     AUTO-RENDER on load (safe guards)
  ---------------------------------- */
  window.addEventListener("load", () => {
    // render analytics and summary only if relevant DOM present
    try { renderAnalytics(); } catch (e) { console.warn("renderAnalytics failed:", e); }
    try { updateSummaryCards(); } catch (e) { console.warn("updateSummaryCards failed:", e); }
  });

})(window);
