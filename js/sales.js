console.log("sales.js module loaded");

window.renderSales = function () {
  const container = document.getElementById("salesContainer");

  let sales = JSON.parse(localStorage.getItem("sales-data") || "[]");

  container.innerHTML = `
    <h3>Sales Records</h3>
    <ul>${sales.map(s => `<li>${s.item} — ₹${s.amount}</li>`).join("")}</ul>

    <input id="saleItem" placeholder="Item" />
    <input id="saleAmount" type="number" placeholder="Amount" />
    <button onclick="addSale()">Add Sale</button>
  `;
};

window.addSale = function () {
  let sales = JSON.parse(localStorage.getItem("sales-data") || "[]");

  const item = document.getElementById("saleItem").value;
  const amount = Number(document.getElementById("saleAmount").value);

  if (item.trim() !== "" && amount > 0) {
    sales.push({ item, amount, date: new Date().toISOString().split("T")[0] });
    localStorage.setItem("sales-data", JSON.stringify(sales));
    cloudSave("sales", sales);
    renderSales();
  }
};
