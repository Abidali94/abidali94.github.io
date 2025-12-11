/* ===========================================================
   expenses.js — ONLINE MODE (Cloud Master) — FINAL v12
   ✔ Cloud-first save (Firestore)
   ✔ Local = cache only for fast UI
   ✔ Auto-create table & total box if missing
=========================================================== */

const qs = s => document.querySelector(s);

/* ===========================================================
   CLOUD + LOCAL SAVE WRAPPER (MASTER = CLOUD)
=========================================================== */
function saveExpensesOnline() {

  // 1️⃣ LOCAL CACHE (fast UI)
  try {
    localStorage.setItem("expenses-data", JSON.stringify(window.expenses));
  } catch {}

  // 2️⃣ CLOUD SAVE (MASTER)
  if (typeof cloudSaveDebounced === "function") {
    cloudSaveDebounced("expenses", window.expenses);
  }

  // 3️⃣ CLOUD → LOCAL auto-sync update
  if (typeof cloudPullAllIfAvailable === "function") {
    setTimeout(() => cloudPullAllIfAvailable(), 200);
  }
}

/* ===========================================================
   ENSURE REQUIRED DOM EXISTS (AUTO CREATE)
=========================================================== */
function ensureExpenseDOM() {
  let section = qs("#expenses");
  if (!section) return;

  /* ---------- Expense Table ---------- */
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

  /* ---------- Total Section ---------- */
  let totalBox = qs("#expTotal");
  if (!totalBox) {
    const box = document.createElement("div");
    box.style.marginTop = "8px";
    box.innerHTML = `<b>Total: ₹<span id="expTotal">0</span></b>`;
    section.appendChild(box);
  }
}

/* ===========================================================
   ➕ ADD EXPENSE ENTRY (CLOUD MODE)
=========================================================== */
function addExpenseEntry() {
  let date = qs("#expDate")?.value || todayDate();
  const category = qs("#expCat")?.value?.trim();
  const amount = Number(qs("#expAmount")?.value || 0);
  const note = qs("#expNote")?.value?.trim();

  if (!category || amount <= 0)
    return alert("Enter category and valid amount!");

  date = toInternalIfNeeded(date);

  window.expenses = window.expenses || [];

  window.expenses.push({
    id: uid("exp"),
    date,
    category,
    amount,
    note
  });

  // CLOUD + LOCAL
  saveExpensesOnline();

  renderExpenses();
  renderAnalytics?.();
  updateSummaryCards?.();
  updateTabSummaryBar?.();
  updateUniversalBar?.();

  qs("#expAmount").value = "";
  qs("#expNote").value = "";
}

/* ===========================================================
   ❌ DELETE EXPENSE ENTRY (CLOUD MODE)
=========================================================== */
function deleteExpense(id) {
  window.expenses = (window.expenses || []).filter(e => e.id !== id);

  saveExpensesOnline();

  renderExpenses();
  renderAnalytics?.();
  updateSummaryCards?.();
  updateTabSummaryBar?.();
  updateUniversalBar?.();
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
          <td data-label="Date">${toDisplay(e.date)}</td>
          <td data-label="Category">${esc(e.category)}</td>
          <td data-label="Amount">₹${esc(e.amount)}</td>
          <td data-label="Note">${esc(e.note || "-")}</td>
          <td data-label="Action">
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
   🗑 CLEAR ALL EXPENSES
=========================================================== */
qs("#clearExpensesBtn")?.addEventListener("click", () => {
  if (!confirm("Delete ALL expenses?")) return;

  window.expenses = [];
  saveExpensesOnline();

  renderExpenses();
  renderAnalytics?.();
  updateSummaryCards?.();
  updateTabSummaryBar?.();
  updateUniversalBar?.();
});

/* ===========================================================
   ➕ ADD BUTTON
=========================================================== */
qs("#addExpenseBtn")?.addEventListener("click", addExpenseEntry);

/* ===========================================================
   🚀 ON PAGE LOAD
=========================================================== */
window.addEventListener("load", () => {
  renderExpenses();
  updateUniversalBar?.();
});

window.renderExpenses = renderExpenses;
