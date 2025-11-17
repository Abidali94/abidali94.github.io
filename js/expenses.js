/* ===========================================================
   🧾 expenses.js — Expense Manager (v3.0 PRO)
   Fully optimized for: core.js v3.2, analytics.js, dashboard
   =========================================================== */

/* ----------------------------------------------------------
   ➕ ADD EXPENSE
---------------------------------------------------------- */
function addNewExpense() {
  const date = qs("#expDate")?.value || todayDate();
  const category = qs("#expCategory")?.value.trim();
  const amount = Number(qs("#expAmount")?.value || 0);
  const note = qs("#expNote")?.value.trim();

  if (!category || !amount) {
    return alert("Please enter Category and Amount.");
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
  updateSummaryCards?.();
  renderAnalytics?.();

  // Reset fields
  qs("#expCategory").value = "";
  qs("#expAmount").value = "";
  qs("#expNote").value = "";
}

/* ----------------------------------------------------------
   ❌ DELETE EXPENSE (with better safety)
---------------------------------------------------------- */
function deleteExpense(id) {
  const exp = window.expenses.find(e => e.id === id);
  if (!exp) return;

  const msg =
    `Delete this expense?\n\n` +
    `Category: ${exp.category}\n` +
    `Amount: ₹${exp.amount}\n` +
    `Date: ${exp.date}`;

  if (!confirm(msg)) return;

  window.expenses = window.expenses.filter(e => e.id !== id);

  saveExpenses();
  renderExpenses();
  updateSummaryCards?.();
  renderAnalytics?.();
}

/* ----------------------------------------------------------
   📋 RENDER EXPENSES TABLE
---------------------------------------------------------- */
function renderExpenses() {
  const tbody = qs("#expensesTable tbody");
  const totalEl = qs("#expensesTotal");

  if (!tbody || !totalEl) return;

  if (!window.expenses.length) {
    tbody.innerHTML = `<tr><td colspan="5">No expenses added yet</td></tr>`;
    totalEl.textContent = "₹0";
    return;
  }

  let total = 0;

  tbody.innerHTML = window.expenses
    .map(e => {
      total += Number(e.amount);

      return `
        <tr>
          <td>${e.date}</td>
          <td>${esc(e.category)}</td>
          <td>₹${e.amount}</td>
          <td>${esc(e.note || "")}</td>
          <td>
            <button onclick="deleteExpense('${e.id}')" 
              class="small-btn" 
              style="background:#c62828;color:#fff">
              🗑 Delete
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  totalEl.textContent = "₹" + total;
}

/* ----------------------------------------------------------
   🖱 EVENT HANDLER
---------------------------------------------------------- */
document.addEventListener("click", e => {
  if (e.target.id === "addExpBtn") return addNewExpense();
});

/* ----------------------------------------------------------
   🚀 INITIAL LOAD
---------------------------------------------------------- */
window.addEventListener("load", () => {
  renderExpenses();
});

/* Expose */
window.addNewExpense = addNewExpense;
window.renderExpenses = renderExpenses;
window.deleteExpense = deleteExpense;
