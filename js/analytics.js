/* ===========================================================
   📊 analytics.js — Smart Dashboard (Final v2.2)
   Works with: sales.js, expenses.js, core.js
   Uses: Chart.js
   =========================================================== */

let salesBarChart = null;
let salesPieChart = null;

/* ----------------------------------------------------------
   HELPERS
---------------------------------------------------------- */
function formatDate(d) {
  return new Date(d).toISOString().split("T")[0];
}

function getStartOfWeek() {
  const t = new Date();
  const day = t.getDay();
  t.setDate(t.getDate() - day);
  return formatDate(t);
}

function getStartOfMonth() {
  const d = new Date();
  return formatDate(new Date(d.getFullYear(), d.getMonth(), 1));
}

function getExpensesByDate(date) {
  if (!window.expenses) return 0;
  return window.expenses
    .filter(e => e.date === date)
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);
}

/* ----------------------------------------------------------
   COLLECT ANALYTICS DATA
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
      grossProfit = 0,
      todayExpenses = getExpensesByDate(today);

  sales.forEach(s => {
    const d = s.date;
    if (!d) return;

    const amt = Number(s.amount || 0);
    const prof = Number(s.profit || 0);

    // Today
    if (d === today) todaySales += amt;

    // Week
    if (d >= weekStart) weekSales += amt;

    // Month
    if (d >= monthStart) monthSales += amt;

    // Status
    if (s.status === "Credit") creditSales += amt;
    else paidSales += amt;

    // Profit
    grossProfit += prof;
  });

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
   RENDER ANALYTICS CHARTS
---------------------------------------------------------- */
function renderAnalytics() {
  const data = getAnalyticsData();

  const barCanvas = document.getElementById("salesBar");
  const pieCanvas = document.getElementById("salesPie");

  if (!barCanvas || !pieCanvas) return;

  // Destroy charts before re-render
  if (salesBarChart) salesBarChart.destroy();
  if (salesPieChart) salesPieChart.destroy();

  /* ========= BAR CHART ========= */
  salesBarChart = new Chart(barCanvas, {
    type: "bar",
    data: {
      labels: ["Today", "This Week", "This Month"],
      datasets: [
        {
          label: "Sales ₹",
          data: [data.todaySales, data.weekSales, data.monthSales],
          backgroundColor: ["#ffa726", "#fb8c00", "#ef6c00"],
          borderRadius: 8
        }
      ]
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

  /* ========= PIE CHART ========= */
  salesPieChart = new Chart(pieCanvas, {
    type: "pie",
    data: {
      labels: ["Paid Sales", "Credit Sales"],
      datasets: [
        {
          data: [data.paidSales, data.creditSales],
          backgroundColor: ["#43a047", "#42a5f5"],
          borderWidth: 1
        }
      ]
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

  // Update summary cards if available
  if (typeof updateSummaryCards === "function") {
    updateSummaryCards();
  }
}

/* ----------------------------------------------------------
   AUTO REFRESH EVERY 60s
---------------------------------------------------------- */
setInterval(() => {
  try { renderAnalytics(); } catch (e) {}
}, 60000);

/* ----------------------------------------------------------
   LOCAL STORAGE SYNC
---------------------------------------------------------- */
window.addEventListener("storage", () => {
  try { renderAnalytics(); } catch (e) {}
});

/* ----------------------------------------------------------
   INITIAL LOAD
---------------------------------------------------------- */
window.addEventListener("load", () => {
  try { renderAnalytics(); } catch (e) {}
});

/* Expose */
window.renderAnalytics = renderAnalytics;
