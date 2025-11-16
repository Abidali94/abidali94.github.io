/* expenses.js */
function addExpense({date,category,amount,note}){
  const it = {id: uid('exp'), date: date || todayDate(), category:category||'misc', amount: Number(amount||0), note:note||''};
  window.expenses = window.expenses || [];
  window.expenses.push(it);
  saveAllLocal();
  if(typeof window.cloudSave === 'function') window.cloudSave('expenses', window.expenses);
  renderExpenses();
}

function renderExpenses(){
  const tbody = document.querySelector('#expensesTable tbody');
  if(!tbody) return;
  tbody.innerHTML = '';
  let total = 0;
  (window.expenses||[]).slice().reverse().forEach(e=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${e.date}</td><td>${escapeHtml(e.category)}</td><td>${e.amount}</td><td>${escapeHtml(e.note)}</td><td><button class="exp-del" data-id="${e.id}">Delete</button></td>`;
    tbody.appendChild(tr);
    total += Number(e.amount);
  });
  const elTotal = document.getElementById('expensesTotal');
  if(elTotal) elTotal.textContent = total;
  qsa('.exp-del').forEach(b=>{
    b.addEventListener('click', e=>{
      const id = e.target.dataset.id;
      window.expenses = window.expenses.filter(x=>x.id!==id);
      saveAllLocal();
      renderExpenses();
    });
  });
}
window.renderExpenses = renderExpenses;
