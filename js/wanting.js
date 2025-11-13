console.log("wanting.js module loaded");

window.renderWanting = function () {
  const container = document.getElementById("wantingContainer");

  let list = JSON.parse(localStorage.getItem("wanting-data") || "[]");

  container.innerHTML = `
    <h3>Wanting List</h3>
    <ul>${list.map(s => `<li>${s}</li>`).join("")}</ul>

    <input id="wantItem" placeholder="Item you want" />
    <button onclick="addWantItem()">Add</button>
  `;
};

window.addWantItem = function () {
  let list = JSON.parse(localStorage.getItem("wanting-data") || "[]");

  const item = document.getElementById("wantItem").value;

  if (item.trim() !== "") {
    list.push(item);
    localStorage.setItem("wanting-data", JSON.stringify(list));
    cloudSave("wanting", list);
    renderWanting();
  }
};
