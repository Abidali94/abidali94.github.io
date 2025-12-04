/* ===========================================================
   expenses.js — FINAL ONLINE VERSION v9.1 (improved)
   - Backwards-compatible with core.js v4+
   - Better UX + safe rendering + no-conflict with other files
=========================================================== */

(function () {
  const qs = s => document.querySelector(s);

  /* -------------------------------------------------------
     ➕ ADD EXPENSE ENTRY
  ------------------------------------------------------- */
  function addExpenseEntry() {
    let date = qs("#expDate")?.value || todayDate();
    const categoryEl = qs("#expCat");
    const category = categoryEl ? categoryEl.value.trim() : "";
    const amountRaw = qs("#expAmount")?.value || "0";
    const amount = Number(amountRaw);
    const note = qs("#expNote")?.value.trim();

    if (!category || amount <= 0) {
      return alert("Enter category and amount!");
    }

    // Convert DD-MM-YYYY → YYYY-MM-DD safely (core.js helper)
    date = toInternalIfNeeded(date);

    window.expenses = window.expenses || [];

    const newExp = {
      id: uid("exp"),
      date,
      category,
      amount: Number(amount),
      note: note || ""
    };

    window.expenses.push(newExp);

    // LOCAL + CLOUD SAVE (saveExpenses from core.js handles local + cloud sync)
    try { if (typeof window.saveExpenses === "function") window.saveExpenses(); } catch (e) { console.warn("saveExpenses failed:", e); }

    // UI REFRESH
    renderExpenses();
    try { renderAnalytics?.(); } catch (e) {}
    try { updateSummaryCards?.(); } catch (e) {}
    try { updateTabSummaryBar?.(); } catch (e) {}
    try { updateUniversalBar?.(); } catch (e) {}

    // Clear fields (keep date so user can add multiple same-day entries)
    if (qs("#expAmount")) qs("#expAmount").value = "";
    if (qs("#expNote")) qs("#expNote").value = "";
    if (categoryEl) categoryEl.value = "";
  }

  /* -------------------------------------------------------
     ❌ DELETE EXPENSE ENTRY
  ------------------------------------------------------- */
  function deleteExpense(id) {
    window.expenses = (window.expenses || []).filter(e => e.id !== id);

    try { if (typeof window.saveExpenses === "function") window.saveExpenses(); } catch (e) { console.warn("saveExpenses failed:", e); }

    renderExpenses();
    try { renderAnalytics?.(); } catch (e) {}
    try { updateSummaryCards?.(); } catch (e) {}
    try { updateTabSummaryBar?.(); } catch (e) {}
    try { updateUniversalBar?.(); } catch (e) {}
  }
  window.deleteExpense = deleteExpense;

  /* -------------------------------------------------------
     📊 RENDER EXPENSE TABLE
  ------------------------------------------------------- */
  function formatAmt(n) {
    return "₹" + (Number(n) || 0).toLocaleString("en-IN");
  }

  function renderExpenses() {
    const tbody = qs("#expensesTable tbody");
    if (!tbody) return;

    const list = Array.isArray(window.expenses) ? window.expenses : [];
    let total = 0;

    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;opacity:.6;">No expenses yet</td></tr>`;
    } else {
      tbody.innerHTML = list.map(e => {
        const amt = Number(e.amount || 0);
        total += amt;

        return `
          <tr>
            <td data-label="Date">${toDisplay(e.date)}</td>
            <td data-label="Category">${esc(e.category)}</td>
            <td data-label="Amount">${formatAmt(amt)}</td>
            <td data-label="Note">${esc(e.note || "-")}</td>
            <td data-label="Action">
              <button class="small-btn" onclick="deleteExpense('${esc(e.id)}')" style="background:#d32f2f;color:white;">
                🗑 Delete
              </button>
            </td>
          </tr>
        `;
      }).join("");
    }

    const totalBox = qs("#expTotal");
    if (totalBox) totalBox.textContent = formatAmt(total);
  }

  /* -------------------------------------------------------
     🗑 CLEAR ALL EXPENSES
  ------------------------------------------------------- */
  qs("#clearExpensesBtn")?.addEventListener("click", () => {
    if (!confirm("Clear ALL expenses?")) return;

    window.expenses = [];
    try { if (typeof window.saveExpenses === "function") window.saveExpenses(); } catch (e) { console.warn("saveExpenses failed:", e); }

    renderExpenses();
    try { renderAnalytics?.(); } catch (e) {}
    try { updateSummaryCards?.(); } catch (e) {}
    try { updateTabSummaryBar?.(); } catch (e) {}
    try { updateUniversalBar?.(); } catch (e) {}
  });

  /* -------------------------------------------------------
     ➕ ADD BUTTON
  ------------------------------------------------------- */
  qs("#addExpenseBtn")?.addEventListener("click", addExpenseEntry);

  /* -------------------------------------------------------
     🚀 INITIAL LOAD
  ------------------------------------------------------- */
  window.addEventListener("load", () => {
    renderExpenses();
    try { updateUniversalBar?.(); } catch (e) {}
  });

  window.renderExpenses = renderExpenses;
})();
