/* ===========================================================
   expenses.js — FINAL v7.0 (Perfect Sync With Your HTML)
   ✔ Fully matches your HTML IDs
   ✔ Add/Delete working 100%
   ✔ Auto updates: Overview + Smart Dashboard + Profit Bar
=========================================================== */

/* -------------------------
   ADD EXPENSE ENTRY
-------------------------- */
function addExpenseEntry() {
  let date = qs("#expDate")?.value || todayDate();
  const category = qs("#expCat")?.value;
  const amount = Number(qs("#expAmount")?.value || 0);
  const note = qs("#expNote")?.value || "";

  if (!category || amount <= 0)
    return alert("Enter category and amount!");

  // Convert dd-mm-yyyy → yyyy-mm-dd (if needed)
  if (date.includes("-") && date.split("-")[0].length === 2)
    date = toInternal(date);

  window.expenses = window.expenses || [];

  window.expenses.push({
    id: uid("exp"),
    date,
    category,
    amount,
    note
  });

  saveExpenses();

  // Refresh UI everywhere
  renderExpenses();
  renderAnalytics?.();
  updateSummaryCards?.();
  updateTabSummaryBar?.();

  // Clear inputs
  qs("#expAmount").value = "";
  qs("#expNote").value = "";
}

/* -------------------------
   DELETE EXPENSE ENTRY
-------------------------- */
function deleteExpense(id) {
  window.expenses = (window.expenses || []).filter(e => e.id !== id);

  saveExpenses();

  // Refresh UI everywhere
  renderExpenses();
  renderAnalytics?.();
  updateSummaryCards?.();
  updateTabSummaryBar?.();
}

window.deleteExpense = deleteExpense;

/* -------------------------
   RENDER EXPENSE TABLE
-------------------------- */
function renderExpenses() {
  const tbody = qs("#expensesTable tbody");
  if (!tbody) return;

  let list = window.expenses || [];
  let total = 0;

  tbody.innerHTML = list
    .map(e => {
      total += Number(e.amount || 0);
      return `
        <tr>
          <td>${toDisplay(e.date)}</td>
          <td>${e.category}</td>
          <td>₹${e.amount}</td>
          <td>${e.note || "-"}</td>
          <td>
            <button class="btn-del" onclick="deleteExpense('${e.id}')">🗑 Delete</button>
          </td>
        </tr>
      `;
    })
    .join("");

  // Update Total box (HTML: id="expTotal")
  const totalBox = qs("#expTotal");
  if (totalBox) totalBox.textContent = total;
}

/* -------------------------
   CLEAR ALL EXPENSES
-------------------------- */
qs("#clearExpensesBtn")?.addEventListener("click", () => {
  if (!confirm("Clear ALL expenses?")) return;

  window.expenses = [];
  saveExpenses();

  renderExpenses();
  renderAnalytics?.();
  updateSummaryCards?.();
  updateTabSummaryBar?.();
});

/* -------------------------
   ADD BUTTON
-------------------------- */
qs("#addExpenseBtn")?.addEventListener("click", addExpenseEntry);

/* -------------------------
   INITIAL PAGE LOAD
-------------------------- */
window.addEventListener("load", () => {
  renderExpenses();
});

window.renderExpenses = renderExpenses;
