/* ==========================================================
   📊 analytics.js — Smart Dashboard (v2)
   Works with: sales.js, stock.js, expenses.js, core.js
   Uses: Chart.js
   ========================================================== */

let salesBarChart = null;
let salesPieChart = null;

/* ---------- helpers ---------- */
function formatDateISO(d) {
  if (!d) return todayDate();
  return new Date(d).toISOString().split('T')[0];
}

function getStartOfWeek() {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day;
  const start = new Date(today.setDate(diff));
  return formatDateISO(start);
}

function getStartOfMonth() {
  const d = new Date();
  return formatDateISO(new Date(d.getFullYear(), d.getMonth(), 1));
}

/* ---------- expenses helper to be used elsewhere ---------- */
function getExpensesByDate(date) {
  if (!window.expenses || !window.expenses.length) return 0;
  return window.expenses
    .filter(e => e.date === date)
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);
}
window.getExpensesByDate = getExpensesByDate;

/* ----------------------------------------------------------
   COLLECT SALES + EXPENSES DATA
---------------------------------------------------------- */
function getAnalyticsData() {
  const sales = window.sales || [];
  const expenses = window.expenses || [];

  const today = todayDate();
  const weekStart = getStartOfWeek();
  const monthStart = getStartOfMonth();

  let todaySales = 0, weekSales = 0, monthSales = 0;
  let paidSales = 0, creditSales = 0;
  let totalProfit = 0;

  sales.forEach(s => {
    const d = s.date;
    if (!d) return;
    if (d === today) todaySales += Number(s.amount || 0);
    if (d >= weekStart) weekSales += Number(s.amount || 0);
    if (d >= monthStart) monthSales += Number(s.amount || 0);

    if (s.status === 'Credit') creditSales += Number(s.amount || 0);
    else paidSales += Number(s.amount || 0);

    totalProfit += Number(s.profit || 0);
  });

  // Expenses totals
  let todayExpenses = 0, weekExpenses = 0, monthExpenses = 0;
  expenses.forEach(e => {
    const d = e.date;
    if (!d) return;
    if (d === today) todayExpenses += Number(e.amount || 0);
    if (d >= weekStart) weekExpenses += Number(e.amount || 0);
    if (d >= monthStart) monthExpenses += Number(e.amount || 0);
  });

  return {
    todaySales, weekSales, monthSales,
    paidSales, creditSales, totalProfit,
    todayExpenses, weekExpenses, monthExpenses,
  };
}

/* ----------------------------------------------------------
   RENDER CHARTS
---------------------------------------------------------- */
function renderAnalytics() {
  const data = getAnalyticsData();

  const barCanvas = document.getElementById('salesBar');
  const pieCanvas = document.getElementById('salesPie');
  if (!barCanvas || !pieCanvas) return;

  // destroy previous charts
  if (salesBarChart) salesBarChart.destroy();
  if (salesPieChart) salesPieChart.destroy();

  // Bar chart: Sales vs Expenses (Today / Week / Month)
  salesBarChart = new Chart(barCanvas, {
    type: 'bar',
    data: {
      labels: ['Today', 'This Week', 'This Month'],
      datasets: [
        {
          label: 'Sales (₹)',
          data: [data.todaySales, data.weekSales, data.monthSales],
          backgroundColor: ['#ffa726','#fb8c00','#ef6c00'],
          borderRadius: 6
        },
        {
          label: 'Expenses (₹)',
          data: [data.todayExpenses, data.weekExpenses, data.monthExpenses],
          backgroundColor: ['#e57373','#ef5350','#e53935'],
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } },
      plugins: {
        title: { display: true, text: 'Sales vs Expenses' },
        legend: { position: 'bottom' }
      }
    }
  });

  // Pie chart: Paid vs Credit
  salesPieChart = new Chart(pieCanvas, {
    type: 'pie',
    data: {
      labels: ['Paid Sales', 'Credit Sales'],
      datasets: [{
        data: [data.paidSales, data.creditSales],
        backgroundColor: ['#43a047', '#42a5f5'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        title: { display: true, text: `Total Profit: ₹${data.totalProfit}` }
      }
    }
  });

  // update summary cards
  if (typeof updateSummaryCards === 'function') updateSummaryCards();
}

/* ----------------------------------------------------------
   AUTO REFRESH + STORAGE LISTENERS
---------------------------------------------------------- */
window.addEventListener('load', () => {
  try { renderAnalytics(); } catch (e) {}
});

window.addEventListener('storage', () => {
  try { renderAnalytics(); } catch (e) {}
});

setInterval(() => {
  try { renderAnalytics(); } catch (e) {}
}, 60000);

/* Exports */
window.renderAnalytics = renderAnalytics;
window.getAnalyticsData = getAnalyticsData;
