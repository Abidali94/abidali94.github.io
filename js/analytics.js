/* ===========================================================
   📊 analytics.js — Smart Dashboard (PRO v3.0)
   Fully compatible with: core.js v3.1, sales.js v3.0, expenses.js v3.0
   Uses: Chart.js
   =========================================================== */

let salesBarChart = null;
let salesPieChart = null;

/* ----------------------------------------------------------
   📌 HELPERS
---------------------------------------------------------- */
function formatDate(date) {
  return new Date(date).toISOString().split("T")[0];
}

function getStartOfWeek() {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return formatDate(d);
}

function getStartOfMonth() {
  const d = new Date();
  return formatDate(new Date(d.getFullYear(), d.getMonth(), 1));
}

function getExpensesByDate(date) {
  return (window.expenses || [])
    .filter(e => e.date === date)
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);
}

/* ----------------------------------------------------------
   📊 COLLECT FULL ANALYTICS
---------------------------------------------------------- */
function getAnalyticsData() {
  const sales = window.sales || [];
  const today = todayDate();
  const weekStart = getStartOfWeek();
  const monthStart = getStartOfMonth();

  let todaySales = 0,
      weekSales = 0,
      monthSales = 0,
      paidSales = 0,
      creditSales = 0,
      grossProfit = 0;

  sales.forEach(s => {
    const d = s.date;
    const amt = Number(s.amount || 0);
    const prof = Number(s.profit || 0);

    if (d === today) todaySales += amt;
    if (d >= weekStart) weekSales += amt;
    if (d >= monthStart) monthSales += amt;

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
   📈 RENDER SMART DASHBOARD CHARTS
---------------------------------------------------------- */
function renderAnalytics() {
  const data = getAnalyticsData();

  const barCanvas = document.getElementById("salesBar");
  const pieCanvas = document.getElementById("salesPie");

  // If analytics tab not opened yet → skip safely
  if (!barCanvas || !pieCanvas) return;

  // Destroy previous charts to avoid duplicates
  if (salesBarChart) salesBarChart.destroy();
  if (salesPieChart) salesPieChart.destroy();

  /* ------------------ BAR CHART ------------------ */
  salesBarChart = new Chart(barCanvas, {
    type: "bar",
    data: {
      labels: ["Today", "This Week", "This Month"],
      datasets: [{
        label: "Sales ₹",
        data: [data.todaySales, data.weekSales, data.monthSales],
        backgroundColor: ["#ff9800", "#fb8c00", "#ef6c00"],
        borderRadius: 10
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: "Sales Summary" }
      },
      scales: { y: { beginAtZero: true } }
    }
  });

  /* ------------------ PIE CHART ------------------ */
  salesPieChart = new Chart(pieCanvas, {
    type: "pie",
    data: {
      labels: ["Paid Sales", "Credit Sales"],
      datasets: [{
        data: [data.paidSales, data.creditSales],
        backgroundColor: ["#4caf50", "#42a5f5"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        title: {
          display: true,
          text: `Gross Profit: ₹${data.grossProfit} | Net Profit: ₹${data.netProfit}`
        }
      }
    }
  });

  // Update Summary Cards (Dashboard page)
  updateSummaryCards?.();
}

/* ----------------------------------------------------------
   🔁 AUTO REFRESH EVERY 60 SECONDS
---------------------------------------------------------- */
setInterval(() => {
  try { renderAnalytics(); } catch (e) {}
}, 60000);

/* ----------------------------------------------------------
   🔄 LOCAL STORAGE SYNC
---------------------------------------------------------- */
window.addEventListener("storage", () => {
  try { renderAnalytics(); } catch (e) {}
});

/* ----------------------------------------------------------
   🚀 INITIAL LOAD
---------------------------------------------------------- */
window.addEventListener("load", () => {
  try { renderAnalytics(); } catch (e) {}
});

window.renderAnalytics = renderAnalytics;
