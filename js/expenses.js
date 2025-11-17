/* ===========================================================
   🧾 expenses.js — Expense Manager (v2.2)
   Works with: core.js, analytics.js, dashboard
   =========================================================== */

/* window.expenses already loaded from core.js */

/* ----------------------------------------------------------
   ADD EXPENSE
---------------------------------------------------------- */
function addNewExpense() {
  const date = document.getElementById("expDate")?.value || todayDate();
  const category = document.getElementById("expCategory")?.value.trim();
  const amount = parseFloat(document.getElementById("expAmount")?.value || 0);
  const note = document.getElementById("expNote")?.value.trim();

  if (!category || !amount) {
    return alert("Please enter category and amount.");
  }

  window.expenses.push({
    id: uid("exp"),
    date,
    category,
    amount,
    note
  });

  saveExpenses();
  renderExpenses();

  // clear form
  document.getElementById("expCategory").value = "";
  document.getElementById("expAmount").value = "";
  document.getElementById("expNote").value = "";
}

/* ----------------------------------------------------------
   DELETE EXPENSE
---------------------------------------------------------- */
function deleteExpense(id) {
  if (!confirm("Delete this expense?")) return;

  window.expenses = window.expenses.filter(e => e.id !== id);
  saveExpenses();
  renderExpenses();
}

/* ----------------------------------------------------------
   RENDER TABLE
---------------------------------------------------------- */
function renderExpenses() {
  const tbody = document.querySelector("#expensesTable tbody");
  const totalEl = document.getElementById("expensesTotal");

  if (!tbody || !totalEl) return;

  if (!window.expenses || window.expenses.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">No expenses found</td></tr>`;
    totalEl.textContent = 0;
    return;
  }

  let total = 0;

  tbody.innerHTML = window.expenses
    .map(e => {
      total += Number(e.amount || 0);
      return `
        <tr>
          <td>${e.date}</td>
          <td>${esc(e.category)}</td>
          <td>₹${e.amount}</td>
          <td>${esc(e.note || "")}</td>
          <td>
            <button onclick="deleteExpense('${e.id}')" class="small-btn" style="background:#d32f2f;color:#fff">
              ❌ Delete
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  totalEl.textContent = "₹" + total;

  // Update Overview summary cards
  if (typeof updateSummaryCards === "function") {
    updateSummaryCards();
  }

  // Update Analytics
  if (typeof renderAnalytics === "function") {
    renderAnalytics();
  }
}

/* ----------------------------------------------------------
   EVENTS
---------------------------------------------------------- */
document.addEventListener("click", e => {
  if (e.target.id === "addExpBtn") addNewExpense();
});

/* ----------------------------------------------------------
   INITIAL LOAD
---------------------------------------------------------- */
window.addEventListener("load", () => {
  renderExpenses();
});

/* Expose */
window.addNewExpense = addNewExpense;
window.renderExpenses = renderExpenses;
window.deleteExpense = deleteExpense;
