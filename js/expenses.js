/* ===========================================================
   expenses.js — (FINAL v6.0)
   ✔ Delete button restored
   ✔ Action column restored
   ✔ expTotal null-error fixed
   ✔ Auto UI Refresh: Overview + Profit + Smart Dashboard
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

  // dd-mm-yyyy → yyyy-mm-dd
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

  renderExpenses();
  renderAnalytics?.();
  updateSummaryCards?.();
  updateTabSummaryBar?.();

  qs("#expAmount").value = "";
  qs("#expNote").value = "";
}

/* -------------------------
   DELETE EXPENSE ENTRY
-------------------------- */
function deleteExpense(id) {
  window.expenses = (window.expenses || []).filter(e => e.id !== id);
  saveExpenses();
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

  const fdate = qs("#expFilterDate")?.value || "";
  const fcat  = qs("#expFilterCat")?.value || "all";

  let list = window.expenses || [];

  if (fdate) list = list.filter(e => e.date === fdate);
  if (fcat !== "all") list = list.filter(e => e.category === fcat);

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

  // FIX: expTotal exists?
  const totalBox = qs("#expTotal");
  if (totalBox) totalBox.textContent = total;
}

/* -------------------------
   CLEAR ALL
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
   FILTERS
-------------------------- */
qs("#addExpenseBtn")?.addEventListener("click", addExpenseEntry);
qs("#expFilterDate")?.addEventListener("change", renderExpenses);
qs("#expFilterCat")?.addEventListener("change", renderExpenses);

/* -------------------------
   INITIAL LOAD
-------------------------- */
window.addEventListener("load", () => {
  renderExpenses();
});

window.renderExpenses = renderExpenses;
