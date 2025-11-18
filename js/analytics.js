/* ===========================================================
   📊 analytics.js — Smart Dashboard (FINAL v6.0)
   FULL dd-mm-yyyy SUPPORT
   Fully Synced with core.js normalization
=========================================================== */

let salesBarChart = null;
let salesPieChart = null;

/* ----------------------------------------------------------
   DATE HELPERS
---------------------------------------------------------- */

/* Convert internal yyyy-mm-dd to number for comparison */
function toNum(d) {
  return d ? Number(d.replace(/-/g, "")) : 0;
}

function formatDate(d) {
  return new Date(d).toISOString().split("T")[0]; // always yyyy-mm-dd
}

/* Start of Week */
function getStartOfWeek() {
  const t = new Date();
  const day = t.getDay(); // Sunday = 0
  t.setDate(t.getDate() - day);
  return formatDate(t); // yyyy-mm-dd
}

/* Start of Month */
function getStartOfMonth() {
  const d = new Date();
  return formatDate(new Date(d.getFullYear(), d.getMonth(), 1));
}

/* Expenses by date */
function getExpensesByDate(date) {
  return (window.expenses || [])
    .filter(e => e.date === date)
    .reduce((s, e) => s + Number(e.amount || 0), 0);
}

/* ----------------------------------------------------------
   COLLECT ANALYTICS DATA
---------------------------------------------------------- */
function getAnalyticsData() {
  const sales = window.sales || [];

  const today = todayDate();       // yyyy-mm-dd
  const weekStart = getStartOfWeek();
  const monthStart = getStartOfMonth();

  let todaySales = 0;
  let weekSales = 0;
  let monthSales = 0;
  let paidSales = 0;
  let creditSales = 0;
  let grossProfit = 0;

  const todayN = toNum(today);
  const weekN = toNum(weekStart);
  const monthN = toNum(monthStart);

  sales.forEach(s => {
    if (!s.date) return;

    const d = s.date;          // INTERNAL ALWAYS yyyy-mm-dd
    const dNum = toNum(d);

    const amt = Number(s.amount || 0);
    const prof = Number(s.profit || 0);

    if (d === today) todaySales += amt;
    if (dNum >= weekN) weekSales += amt;
    if (dNum >= monthN) monthSales += amt;

    if (s.status === "Credit") creditSales += amt;
    else paidSales += amt;

    grossProfit += prof;
  });

  const todayExpenses = getExpensesByDate(today);
  const netProfit = grossProfit - todayExpenses;

  return {
    todaySales,
    weekSales,
    monthSales,
    paidSales,
    creditSales,
    grossProfit,
    todayExpenses,
    netProfit
  };
}

/* ----------------------------------------------------------
   MAIN RENDER FUNCTION
---------------------------------------------------------- */
function renderAnalytics() {
  const barCanvas = qs("#salesBar");
  const pieCanvas = qs("#salesPie");

  if (!barCanvas || !pieCanvas) return;

  const data = getAnalyticsData();

  /* Destroy previous charts */
  if (salesBarChart) salesBarChart.destroy();
  if (salesPieChart) salesPieChart.destroy();

  /* ------------------ BAR CHART ------------------- */
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
      scales: { y: { beginAtZero: true } },
      plugins: {
        title: { display: true, text: "Sales Summary" },
        legend: { display: false }
      }
    }
  });

  /* ------------------ PIE CHART ------------------- */
  salesPieChart = new Chart(pieCanvas, {
    type: "pie",
    data: {
      labels: ["Paid", "Credit"],
      datasets: [{
        data: [data.paidSales, data.creditSales],
        backgroundColor: ["#4caf50", "#2196f3"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        title: {
          display: true,
          text: `Gross: ₹${data.grossProfit} | Net: ₹${data.netProfit}`
        }
      }
    }
  });

  /* Update Overview Summary Cards */
  updateSummaryCards?.();
}

/* ----------------------------------------------------------
   AUTO REFRESH
---------------------------------------------------------- */
setInterval(() => {
  try { renderAnalytics(); } catch {}
}, 45000);

/* ----------------------------------------------------------
   STORAGE SYNC
---------------------------------------------------------- */
window.addEventListener("storage", () => {
  try { renderAnalytics(); } catch {}
});

/* ----------------------------------------------------------
   INITIAL
---------------------------------------------------------- */
window.addEventListener("load", () => {
  try { renderAnalytics(); } catch {}
});

window.renderAnalytics = renderAnalytics;
