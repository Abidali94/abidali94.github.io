/* ===========================================================
   🧾 expenses.js — Expense Manager (v2.3)
   Works with: core.js (saveExpenses, todayDate, esc), analytics.js, dashboard
   =========================================================== */

/* ----------------------------------------------------------
   SAVE WRAPPER (uses core.saveExpenses if available)
---------------------------------------------------------- */
function _saveExpensesLocal() {
  if (typeof saveExpenses === "function") {
    saveExpenses();
  } else {
    localStorage.setItem("expenses-data", JSON.stringify(window.expenses || []));
    // best-effort dispatch to trigger storage listeners
    window.dispatchEvent(new Event("storage"));
  }
}

/* ----------------------------------------------------------
   ADD NEW EXPENSE
   - Validates inputs
   - Pushes into window.expenses
   - Saves + re-renders
---------------------------------------------------------- */
function addNewExpense() {
  const dateEl = document.getElementById("expDate");
  const categoryEl = document.getElementById("expCategory");
  const amountEl = document.getElementById("expAmount");
  const noteEl = document.getElementById("expNote");

  const date = (dateEl?.value) || todayDate();
  const category = (categoryEl?.value || "").trim();
  const amount = parseFloat((amountEl?.value || "0").replace(",", ""));
  const note = (noteEl?.value || "").trim();

  if (!category) return alert("Please enter a category.");
  if (!amount || isNaN(amount) || amount <= 0) return alert("Please enter a valid amount.");

  window.expenses = window.expenses || [];

  window.expenses.push({
    id: uid("exp"),
    date,
    category,
    amount,
    note
  });

  _saveExpensesLocal();
  renderExpenses();

  // clear form (keep date for convenience)
  if (categoryEl) categoryEl.value = "";
  if (amountEl) amountEl.value = "";
  if (noteEl) noteEl.value = "";
}

/* ----------------------------------------------------------
   DELETE EXPENSE
   - single confirmation (one-step)
---------------------------------------------------------- */
function deleteExpense(id) {
  if (!confirm("Delete this expense? This cannot be undone.")) return;
  window.expenses = (window.expenses || []).filter(e => e.id !== id);
  _saveExpensesLocal();
  renderExpenses();
}

/* ----------------------------------------------------------
   RENDER EXPENSES TABLE
---------------------------------------------------------- */
function renderExpenses() {
  const tbody = document.querySelector("#expensesTable tbody");
  const totalEl = document.getElementById("expensesTotal");

  if (!tbody || !totalEl) return;

  const list = window.expenses || [];

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="5">No expenses found</td></tr>`;
    totalEl.textContent = "₹0";
    // update overview & analytics
    if (typeof updateSummaryCards === "function") updateSummaryCards();
    if (typeof renderAnalytics === "function") renderAnalytics();
    return;
  }

  let total = 0;
  tbody.innerHTML = list.map(e => {
    total += Number(e.amount || 0);
    return `
      <tr>
        <td>${esc(e.date)}</td>
        <td>${esc(e.category)}</td>
        <td>₹${Number(e.amount || 0)}</td>
        <td>${esc(e.note || "")}</td>
        <td>
          <button onclick="deleteExpense('${e.id}')" class="small-btn" style="background:#d32f2f;color:#fff">
            ❌ Delete
          </button>
        </td>
      </tr>
    `;
  }).join("");

  totalEl.textContent = "₹" + total;

  // Update overview & analytics
  if (typeof updateSummaryCards === "function") updateSummaryCards();
  if (typeof renderAnalytics === "function") renderAnalytics();
}

/* ----------------------------------------------------------
   EVENTS
---------------------------------------------------------- */
document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "addExpBtn") addNewExpense();
});

/* ----------------------------------------------------------
   INITIAL LOAD
---------------------------------------------------------- */
window.addEventListener("load", () => {
  // ensure window.expenses exists as array
  window.expenses = Array.isArray(window.expenses) ? window.expenses : (safeParse(localStorage.getItem("expenses-data")) || []);
  renderExpenses();
});

/* PUBLIC API */
window.addNewExpense = addNewExpense;
window.renderExpenses = renderExpenses;
window.deleteExpense = deleteExpense;
