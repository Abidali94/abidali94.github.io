/* ===========================================================
   🧾 expenses.js — Expense Manager (FINAL v6.1 FIXED)
   FIXED: dd-mm-yyyy display + correct internal date saving
   No duplicate global variables (exToDisp, exToInt)
=========================================================== */

const exToDisp = window.toDisplay;
const exToInt  = window.toInternal;

/* ----------------------------------------------------------
   SAVE WRAPPER
---------------------------------------------------------- */
function _saveExpensesLocal() {
  if (typeof saveExpenses === "function") {
    saveExpenses();
  } else {
    localStorage.setItem("expenses-data", JSON.stringify(window.expenses || []));
    window.dispatchEvent(new Event("storage"));
  }
}

/* ----------------------------------------------------------
   ADD NEW EXPENSE
---------------------------------------------------------- */
function addNewExpense() {
  const dateEl = qs("#expDate");
  const categoryEl = qs("#expCategory");
  const amountEl = qs("#expAmount");
  const noteEl = qs("#expNote");

  let date = dateEl?.value || todayDate();

  // convert dd-mm-yyyy → yyyy-mm-dd
  if (date.includes("-") && date.split("-")[0].length === 2) {
    date = exToInt(date);
  }

  const category = (categoryEl?.value || "").trim();
  const amount = parseFloat((amountEl?.value || "0").replace(",", ""));
  const note = (noteEl?.value || "").trim();

  if (!category) return alert("Please enter a category.");
  if (!amount || isNaN(amount) || amount <= 0) return alert("Please enter a valid amount.");

  window.expenses = window.expenses || [];

  window.expenses.push({
    id: uid("exp"),
    date,           // internal yyyy-mm-dd
    category,
    amount,
    note
  });

  _saveExpensesLocal();
  renderExpenses();

  categoryEl.value = "";
  amountEl.value = "";
  noteEl.value = "";
}

/* ----------------------------------------------------------
   DELETE EXPENSE ENTRY
---------------------------------------------------------- */
function deleteExpense(id) {
  if (!confirm("Delete this expense?")) return;

  window.expenses = (window.expenses || []).filter(e => e.id !== id);
  _saveExpensesLocal();
  renderExpenses();
}

/* ----------------------------------------------------------
   RENDER EXPENSES TABLE (display dd-mm-yyyy)
---------------------------------------------------------- */
function renderExpenses() {
  const tbody = document.querySelector("#expensesTable tbody");
  const totalEl = qs("#expensesTotal");

  if (!tbody || !totalEl) return;

  const list = window.expenses || [];

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="5">No expenses found</td></tr>`;
    totalEl.textContent = "₹0";
    updateSummaryCards?.();
    renderAnalytics?.();
    return;
  }

  let total = 0;

  tbody.innerHTML = list
    .map(e => {
      total += Number(e.amount || 0);
      return `
        <tr>
          <td>${exToDisp(e.date)}</td>
          <td>${esc(e.category)}</td>
          <td>₹${Number(e.amount || 0)}</td>
          <td>${esc(e.note || "")}</td>
          <td>
            <button onclick="deleteExpense('${e.id}')" 
                    class="small-btn" 
                    style="background:#d32f2f;color:#fff">
              ❌ Delete
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  totalEl.textContent = "₹" + total;

  updateSummaryCards?.();
  renderAnalytics?.();
}

/* ----------------------------------------------------------
   EVENTS
---------------------------------------------------------- */
document.addEventListener("click", (e) => {
  if (e.target?.id === "addExpBtn") addNewExpense();
});

/* ----------------------------------------------------------
   INITIAL LOAD
---------------------------------------------------------- */
window.addEventListener("load", () => {
  window.expenses = Array.isArray(window.expenses)
    ? window.expenses
    : (safeParse(localStorage.getItem("expenses-data")) || []);

  renderExpenses();
});

/* PUBLIC API */
window.addNewExpense = addNewExpense;
window.renderExpenses = renderExpenses;
window.deleteExpense = deleteExpense;
