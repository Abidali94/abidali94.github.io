/* ==========================================================
   📊 analytics.js — Smart Dashboard (v3.0)
   Now includes EXPENSES → Net Profit Calculation
   Works with: sales.js, expenses.js, core.js
   Uses: Chart.js
========================================================== */

let salesBarChart = null;
let salesPieChart = null;

/* ----------------------------------------------------------
   FORMAT DATE TO YYYY-MM-DD
---------------------------------------------------------- */
function formatDate(d) {
  return new Date(d).toISOString().split("T")[0];
}

/* ----------------------------------------------------------
   ⭐ EXPENSES: Get Expense for a given date
---------------------------------------------------------- */
function getExpensesByDate(date) {
  return (window.expenses || [])
    .filter(e => e.date === date)
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);
}

/* ----------------------------------------------------------
   DATE HELPERS
---------------------------------------------------------- */
function getStartOfWeek() {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day;
  return formatDate(new Date(today.setDate(diff)));
}

function getStartOfMonth() {
  const d = new Date();
  return formatDate(new Date(d.getFullYear(), d.getMonth(), 1));
}

/* ----------------------------------------------------------
   COLLECT SALES + EXPENSES + NET PROFIT DATA
---------------------------------------------------------- */
function getAnalyticsData() {
  const sales = window.sales || [];
  const expenses = window.expenses || [];

  const today = todayDate();
  const weekStart = getStartOfWeek();
  const monthStart = getStartOfMonth();

  let todaySales = 0,
      weekSales = 0,
      monthSales = 0,
      paidSales = 0,
      creditSales = 0,
      totalSalesProfit = 0;

  // expenses
  let todayExpenses = 0,
      weekExpenses = 0,
      monthExpenses = 0;

  // SALES CALCULATION
  sales.forEach(s => {
    const d = s.date;
    if (!d) return;

    if (d === today) todaySales += s.amount || 0;
    if (d >= weekStart) weekSales += s.amount || 0;
    if (d >= monthStart) monthSales += s.amount || 0;

    if (s.status === "Credit") creditSales += s.amount || 0;
    else paidSales += s.amount || 0;

    totalSalesProfit += s.profit || 0;
  });

  // EXPENSE CALCULATION
  expenses.forEach(e => {
    const d = e.date;
    if (!d) return;

    if (d === today) todayExpenses += Number(e.amount || 0);
    if (d >= weekStart) weekExpenses += Number(e.amount || 0);
    if (d >= monthStart) monthExpenses += Number(e.amount || 0);
  });

  // NET PROFIT (Sales Profit – Expenses)
  const todayNet = todaySales - todayExpenses;
  const weekNet = weekSales - weekExpenses;
  const monthNet = monthSales - monthExpenses;

  return {
    todaySales, weekSales, monthSales,
    paidSales, creditSales,
    todayExpenses, weekExpenses, monthExpenses,
    todayNet, weekNet, monthNet,
    totalSalesProfit
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

  if (salesBarChart) salesBarChart.destroy();
  if (salesPieChart) salesPieChart.destroy();

  /* ---------------------------------
       BAR CHART (Sales + Expenses)
  -----------------------------------*/
  salesBarChart = new Chart(barCanvas, {
    type: "bar",
    data: {
      labels: ["Today", "This Week", "This Month"],
      datasets: [
        {
          label: "Sales (₹)",
          data: [data.todaySales, data.weekSales, data.monthSales],
          backgroundColor: "#ff9800",
          borderRadius: 8
        },
        {
          label: "Expenses (₹)",
          data: [data.todayExpenses, data.weekExpenses, data.monthExpenses],
          backgroundColor: "#e53935",
          borderRadius: 8
        },
        {
          label: "Net Profit (₹)",
          data: [data.todayNet, data.weekNet, data.monthNet],
          backgroundColor: "#43a047",
          borderRadius: 8
        }
      ]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } },
      plugins: {
        title: { display: true, text: "Sales vs Expenses vs Net Profit" },
        legend: { position: "bottom" }
      }
    }
  });

  /* ---------------------------------
       PIE CHART (Paid vs Credit Sales)
  -----------------------------------*/
  salesPieChart = new Chart(pieCanvas, {
    type: "pie",
    data: {
      labels: ["Paid Sales", "Credit Sales"],
      datasets: [{
        data: [data.paidSales, data.creditSales],
        backgroundColor: ["#4caf50", "#42a5f5"],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        title: { display: true, text: `Total Sales Profit (Before Expenses): ₹${data.totalSalesProfit}` }
      }
    }
  });

  // CALL SUMMARY CARDS UPDATE (Dashboard)
  if (typeof updateSummaryCards === "function") {
    updateSummaryCards();
  }
}

/* ----------------------------------------------------------
   AUTO UPDATE
---------------------------------------------------------- */
setInterval(() => {
  try { renderAnalytics(); } catch (e) {}
}, 60000);

/* ----------------------------------------------------------
   STORAGE CHANGE LISTENER
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

/* Export */
window.renderAnalytics = renderAnalytics;
window.ensureChartsLoadedAndRender = renderAnalytics;
