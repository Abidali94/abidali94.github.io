/* ===========================================================
   📊 analytics.js — Smart Dashboard (FINAL v9.0)
   ✔ Today/Week/Month sales
   ✔ Paid Sales Profit + Service Profit (credit excluded)
   ✔ Today expenses fixed
   ✔ Pie: Total Profit | Expenses | Credit Sales
   ✔ Compatible with core.js universal date system
=========================================================== */

let salesBarChart = null;
let salesPieChart = null;

/* -------------------- HELPERS -------------------- */

function toNum(d) {
  return d ? Number(String(d).replace(/-/g, "")) : 0;
}

function getStartOfWeek() {
  const t = new Date();
  const day = t.getDay();
  t.setDate(t.getDate() - day);
  return t.toISOString().split("T")[0];
}

function getStartOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1)
    .toISOString()
    .split("T")[0];
}

function getExpensesByDate(date) {
  return (window.expenses || [])
    .filter(e => e.date === date)
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);
}

/* ----------------------------------------------------------
   MAIN ANALYTICS DATA
---------------------------------------------------------- */
function getAnalyticsData() {
  const sales = window.sales || [];
  const services = window.services || [];
  const expenses = window.expenses || [];

  const today = todayDate();
  const weekStart = getStartOfWeek();
  const monthStart = getStartOfMonth();

  const weekN = toNum(weekStart);
  const monthN = toNum(monthStart);

  let todaySales = 0,
    weekSales = 0,
    monthSales = 0;

  let totalProfitSales = 0;     // PAID SALES ONLY
  let totalProfitService = 0;   // REPAIR PROFIT
  let totalExpenses = 0;
  let creditSales = 0;
  let paidSalesAmount = 0;

  /* ----- SALES ----- */
  sales.forEach(s => {
    if (!s || !s.date) return;

    const d = s.date;
    const amt = Number(s.amount || 0);
    const prof = Number(s.profit || 0);
    const dNum = toNum(d);

    // Sales amounts for chart
    if (d === today) todaySales += amt;
    if (dNum >= weekN) weekSales += amt;
    if (dNum >= monthN) monthSales += amt;

    // Credit sales → separate
    if (String(s.status || "").toLowerCase() === "credit") {
      creditSales += amt;
      return; // do NOT add to profit
    }

    // Paid sales → add profit
    totalProfitSales += prof;
    paidSalesAmount += amt;
  });

  /* ----- SERVICE PROFITS ----- */
  services.forEach(j => {
    totalProfitService += Number(j.profit || 0);
  });

  /* ----- TOTAL EXPENSES ----- */
  totalExpenses = expenses.reduce((t, e) => t + Number(e.amount || 0), 0);

  const grossProfit = totalProfitSales + totalProfitService; // exclude credit
  const netProfit = grossProfit - totalExpenses;

  const todayExpenses = getExpensesByDate(today);

  return {
    todaySales,
    weekSales,
    monthSales,

    totalProfitSales,
    totalProfitService,
    grossProfit,
    totalExpenses,
    todayExpenses,
    netProfit,

    creditSales,
    paidSalesAmount
  };
}

/* ----------------------------------------------------------
   RENDER SMART DASHBOARD
---------------------------------------------------------- */
function renderAnalytics() {
  const barCanvas = qs("#salesBar");
  const pieCanvas = qs("#salesPie");
  const data = getAnalyticsData();

  /* ----- UPDATE TOP SUMMARY CARDS (Smart Dashboard) ----- */
  qs("#sumToday")  && (qs("#sumToday").textContent  = "₹" + data.todaySales);
  qs("#sumWeek")   && (qs("#sumWeek").textContent   = "₹" + data.weekSales);
  qs("#sumMonth")  && (qs("#sumMonth").textContent  = "₹" + data.monthSales);
  qs("#sumGross")  && (qs("#sumGross").textContent  = "₹" + data.grossProfit);
  qs("#sumNet")    && (qs("#sumNet").textContent    = "₹" + data.netProfit);

  updateSummaryCards?.();
  updateTabSummaryBar?.();

  if (!barCanvas || !pieCanvas) return;

  if (salesBarChart) salesBarChart.destroy();
  if (salesPieChart) salesPieChart.destroy();

  /* ---------- BAR CHART (SALES) ---------- */
  salesBarChart = new Chart(barCanvas, {
    type: "bar",
    data: {
      labels: ["Today", "This Week", "This Month"],
      datasets: [{
        label: "Sales ₹",
        data: [data.todaySales, data.weekSales, data.monthSales],
        backgroundColor: ["#ff9800", "#fb8c00", "#f57c00"],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true }},
      plugins: {
        title: { display: true, text: "Sales Overview" },
        legend: { display: false }
      }
    }
  });

  /* ---------- PIE CHART (Profit | Expenses | Credit) ---------- */
  salesPieChart = new Chart(pieCanvas, {
    type: "pie",
    data: {
      labels: ["Total Profit", "Expenses", "Credit Sales"],
      datasets: [{
        data: [
          data.grossProfit,
          data.totalExpenses,
          data.creditSales
        ],
        backgroundColor: ["#4caf50", "#e53935", "#2196f3"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        title: {
          display: true,
          text: `Net Profit: ₹${data.netProfit}  (Credit excluded until paid)`
        }
      }
    }
  });
}

/* ----------------------------------------------------------
   AUTO REFRESH & SYNC
---------------------------------------------------------- */
setInterval(() => {
  try { renderAnalytics(); } catch {}
}, 45000);

window.addEventListener("storage", () => {
  try { renderAnalytics(); } catch {}
});

window.addEventListener("load", () => {
  try { renderAnalytics(); } catch {}
});

window.renderAnalytics = renderAnalytics;
window.getAnalyticsData = getAnalyticsData;
