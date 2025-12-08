/* ===========================================================
   expenses.js — BUSINESS FIXED VERSION (v12)
   ⭐ Safe with Universal Offset Logic
   ⭐ Clear All does NOT impact collected Net
=========================================================== */

const qs = s => document.querySelector(s);

/* ===========================================================
   ENSURE REQUIRED DOM EXISTS (AUTO CREATE)
=========================================================== */
function ensureExpenseDOM() {
  let section = qs("#expenses");
  if (!section) return;  // may be hidden

  /* ---------- Ensure EXPENSE TABLE ---------- */
  let table = qs("#expensesTable");
  if (!table) {
    table = document.createElement("table");
    table.id = "expensesTable";
    table.innerHTML = `
      <thead>
        <tr>
          <th>Date</th>
          <th>Category</th>
          <th>Amount</th>
          <th>Note</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    section.appendChild(table);
  }

  /* ---------- Ensure TOTAL SPAN ---------- */
  let totalBox = qs("#expTotal");
  if (!totalBox) {
    const box = document.createElement("div");
    box.style.marginTop = "8px";
    box.innerHTML = `
      <b>Total: ₹<span id="expTotal">0</span></b>
    `;
    section.appendChild(box);
  }
}

/* ===========================================================
   ➕ ADD EXPENSE ENTRY
=========================================================== */
function addExpenseEntry() {
  let date = qs("#expDate")?.value || todayDate();
  const category = qs("#expCat")?.value?.trim();
  const amount = Number(qs("#expAmount")?.value || 0);
  const note = qs("#expNote")?.value?.trim();

  if (!category || amount <= 0)
    return alert("Enter category and amount!");

  date = toInternalIfNeeded(date);

  window.expenses = window.expenses || [];

  /* ⭐ Store real raw expense — NO OFFSET */
  window.expenses.push({
    id: uid("exp"),
    date,
    category,
    amount,
    note
  });

  window.saveExpenses?.();

  /* ⭐ REFRESH ORDER FIXED */
  renderExpenses();
  renderAnalytics?.();
  updateSummaryCards?.();

  /* ⭐ DELAYED UNIVERSAL CALC = ALWAYS CORRECT */
  setTimeout(() => {
    updateUniversalBar?.();
    updateTabSummaryBar?.();
  }, 50);

  qs("#expAmount").value = "";
  qs("#expNote").value = "";
}

/* ===========================================================
   ❌ DELETE EXPENSE ENTRY (SAFE)
=========================================================== */
function deleteExpense(id) {
  window.expenses = (window.expenses || []).filter(e => e.id !== id);

  window.saveExpenses?.();

  /* ⭐ REFRESH ORDER FIXED */
  renderExpenses();
  renderAnalytics?.();
  updateSummaryCards?.();

  setTimeout(() => {
    updateUniversalBar?.();
    updateTabSummaryBar?.();
  }, 50);
}
window.deleteExpense = deleteExpense;

/* ===========================================================
   📊 RENDER EXPENSE TABLE
=========================================================== */
function renderExpenses() {
  ensureExpenseDOM();

  const tbody = qs("#expensesTable tbody");
  const totalBox = qs("#expTotal");
  if (!tbody) return;

  const list = window.expenses || [];
  let total = 0;

  tbody.innerHTML = list
    .map(e => {
      total += Number(e.amount || 0);

      return `
        <tr>
          <td>${toDisplay(e.date)}</td>
          <td>${esc(e.category)}</td>
          <td>₹${esc(e.amount)}</td>
          <td>${esc(e.note || "-")}</td>
          <td>
            <button class="small-btn"
                    onclick="deleteExpense('${e.id}')"
                    style="background:#d32f2f;color:white;">
              🗑 Delete
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  if (totalBox) totalBox.textContent = total || 0;
}

/* ===========================================================
   🗑 CLEAR ALL EXPENSES (SAFE)
=========================================================== */
qs("#clearExpensesBtn")?.addEventListener("click", () => {
  if (!confirm("Clear ALL expenses?")) return;

  /* ⭐ ONLY HISTORY CLEARS — NO OFFSET SUBTRACT EVER */
  window.expenses = [];
  window.saveExpenses?.();

  /* ⭐ REFRESH ORDER FIXED */
  renderExpenses();
  renderAnalytics?.();
  updateSummaryCards?.();

  setTimeout(() => {
    updateUniversalBar?.();
    updateTabSummaryBar?.();
  }, 50);
});

/* ===========================================================
   ➕ ADD BUTTON
=========================================================== */
qs("#addExpenseBtn")?.addEventListener("click", addExpenseEntry);

/* ===========================================================
   🚀 INITIAL LOAD
=========================================================== */
window.addEventListener("load", () => {
  renderExpenses();
  updateUniversalBar?.();
});

window.renderExpenses = renderExpenses;
