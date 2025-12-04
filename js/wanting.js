/* =======================================================
   wanting.js — FINAL (v10)
   Compatible with core.js v13 & stock.js v14
   - Safe globals checks
   - Uses addStockEntry() when available
   - Preserves type dropdown selection
   - Minimal UI refresh
   - Idempotent, no duplicates
======================================================= */

(function () {
  "use strict";

  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));
  const esc = x => (window.esc ? window.esc(x) : String(x || ""));
  const today = () => (typeof window.todayDate === "function" ? window.todayDate() : new Date().toISOString().split("T")[0]);
  const toDisplay = v => (typeof window.toDisplay === "function" ? window.toDisplay(v) : (v || ""));
  const toInternalIfNeeded = v => (typeof window.toInternalIfNeeded === "function" ? window.toInternalIfNeeded(v) : v);
  const uid = id => (typeof window.uid === "function" ? window.uid(id) : (id + "_" + Math.random().toString(36).slice(2, 9)));
  const num = v => Number(v || 0);

  // Ensure global wanting array exists
  window.wanting = Array.isArray(window.wanting) ? window.wanting : [];

  // ---------- Helpers ----------

  function _saveWantingLocal() {
    if (typeof window.saveWanting === "function") {
      try { window.saveWanting(); return; } catch (e) { console.warn("saveWanting failed", e); }
    }
    // fallback to localStorage (key used by core.js)
    try { localStorage.setItem("wanting-data", JSON.stringify(window.wanting || [])); } catch (e) {}
  }

  function _safeRender(fnName) {
    try { if (typeof window[fnName] === "function") window[fnName](); } catch (e) { console.warn(fnName, "render failed", e); }
  }

  // ---------- Dropdown (preserve selection) ----------
  function ensureWantTypeDropdown() {
    const el = qs("#wantType");
    if (!el) return;
    const prev = el.value || "";
    const types = Array.isArray(window.types) ? window.types : [];

    el.innerHTML =
      `<option value="">Select Type</option>` +
      types.map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`).join("");

    if (prev) {
      try { el.value = prev; } catch (e) {}
    }
  }

  // ---------- Render wanting table ----------
  function renderWanting() {
    const tbody = qs("#wantingTable tbody");
    ensureWantTypeDropdown();

    if (!tbody) return;

    const list = Array.isArray(window.wanting) ? window.wanting : [];

    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;opacity:.6;">No wanting items</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map((w, i) => `
      <tr>
        <td data-label="Date">${esc(toDisplay(w.date))}</td>
        <td data-label="Type">${esc(w.type)}</td>
        <td data-label="Product">${esc(w.name)}</td>
        <td data-label="Note">${esc(w.note || "-")}</td>
        <td data-label="Action">
          <button class="want-add-btn small-btn" data-i="${i}">Add to Stock</button>
          <button class="want-del-btn small-btn" data-i="${i}" style="background:#d32f2f;color:#fff">Delete</button>
        </td>
      </tr>
    `).join("");
  }

  // ---------- Add wanting item ----------
  function addWantingItem() {
    const typeEl = qs("#wantType");
    const nameEl = qs("#wantName");
    const noteEl = qs("#wantNote");

    const type = typeEl ? (typeEl.value || "").trim() : "";
    const name = nameEl ? (nameEl.value || "").trim() : "";
    const note = noteEl ? (noteEl.value || "").trim() : "";

    if (!type || !name) return alert("Enter type and product name");

    // Prevent duplicate same type+name in wanting list
    if ((window.wanting || []).some(w => String(w.type).toLowerCase() === String(type).toLowerCase() && String(w.name).toLowerCase() === String(name).toLowerCase())) {
      alert("This item is already in wanting list.");
      return;
    }

    const row = {
      id: uid("want"),
      date: toInternalIfNeeded(today()),
      type,
      name,
      note
    };

    window.wanting.unshift(row);
    _saveWantingLocal();

    // Minimal UI updates
    renderWanting();
    _safeRender("updateUniversalBar");
    _safeRender("renderStock"); // stock dropdowns might depend on types (keeps consistent)

    // clear inputs
    if (nameEl) nameEl.value = "";
    if (noteEl) noteEl.value = "";
  }

  // ---------- Convert wanting -> stock ----------
  function wantingToStock(index) {
    const i = Number(index);
    if (Number.isNaN(i) || !Array.isArray(window.wanting) || !window.wanting[i]) return alert("Item not found");

    const w = window.wanting[i];

    // Prompt for qty
    const qtyRaw = prompt(`Enter quantity to purchase for "${w.name}"`, "1");
    const qty = Number(qtyRaw);
    if (!qty || qty <= 0) return alert("Invalid quantity");

    // Prompt for cost per unit
    const costRaw = prompt("Enter purchase cost ₹ each", "0");
    const cost = Number(costRaw);
    if (!cost || cost <= 0) return alert("Invalid cost");

    // Use core's addStockEntry if available (preferred)
    const dateToUse = toInternalIfNeeded(today());
    if (typeof window.addStockEntry === "function") {
      try {
        window.addStockEntry({
          date: dateToUse,
          type: w.type,
          name: w.name,
          qty,
          cost
        });
      } catch (e) {
        console.error("addStockEntry error:", e);
        return alert("Failed to add stock. See console.");
      }
    } else {
      // Fallback: modify window.stock directly (safe)
      window.stock = Array.isArray(window.stock) ? window.stock : [];
      const existing = window.stock.find(p => p.type === w.type && String(p.name || "").toLowerCase() === String(w.name || "").toLowerCase());
      if (!existing) {
        const newItem = {
          id: uid("stk"),
          date: dateToUse,
          type: w.type,
          name: w.name,
          qty,
          remain: qty,
          sold: 0,
          cost,
          limit: (typeof window.getGlobalLimit === "function") ? window.getGlobalLimit() : 0,
          history: [{ date: dateToUse, qty, cost }]
        };
        window.stock.unshift(newItem);
      } else {
        existing.qty = Number(existing.qty || 0) + qty;
        existing.remain = (Number(existing.remain || 0) + qty);
        existing.history = Array.isArray(existing.history) ? existing.history : [];
        existing.history.push({ date: dateToUse, qty, cost });
        existing.cost = cost;
      }
      if (typeof window.saveStock === "function") {
        try { window.saveStock(); } catch (e) { console.warn("saveStock failed", e); }
      } else {
        try { localStorage.setItem("stock-data", JSON.stringify(window.stock)); } catch (e) {}
      }
    }

    // Remove from wanting
    window.wanting.splice(i, 1);
    _saveWantingLocal();

    // UI updates (minimal)
    renderWanting();
    _safeRender("renderStock");
    _safeRender("updateUniversalBar");
    _safeRender("renderCollection");
    // sales may depend on stock/inventory, update only if present
    _safeRender("renderSales");
  }

  // ---------- Delete wanting item ----------
  function deleteWantingItem(index) {
    const i = Number(index);
    if (Number.isNaN(i) || !Array.isArray(window.wanting) || !window.wanting[i]) return;
    if (!confirm("Delete this item?")) return;

    window.wanting.splice(i, 1);
    _saveWantingLocal();

    renderWanting();
    _safeRender("updateUniversalBar");
  }

  // ---------- Clear all wanting ----------
  function clearWanting() {
    if (!confirm("Clear entire wanting list?")) return;
    window.wanting = [];
    _saveWantingLocal();
    renderWanting();
    _safeRender("updateUniversalBar");
  }

  // ---------- Delegated Events ----------
  document.addEventListener("click", function (e) {
    const t = e.target;
    if (!t) return;

    if (t.id === "addWantBtn") return addWantingItem();
    if (t.id === "clearWantBtn") return clearWanting();

    const addBtn = t.closest(".want-add-btn");
    if (addBtn) {
      const idx = Number(addBtn.dataset.i);
      return wantingToStock(idx);
    }

    const delBtn = t.closest(".want-del-btn");
    if (delBtn) {
      const idx = Number(delBtn.dataset.i);
      return deleteWantingItem(idx);
    }
  });

  // ---------- Init on load ----------
  window.addEventListener("load", function () {
    // Ensure dropdown is in sync with types
    ensureWantTypeDropdown();
    renderWanting();
  });

  // ---------- Expose API ----------
  window.renderWanting = renderWanting;
  window.addWantingItem = addWantingItem;
  window.wantingToStock = wantingToStock;
  window.deleteWantingItem = deleteWantingItem;
  window.clearWanting = clearWanting;
})();
