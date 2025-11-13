console.log("types.js module loaded");

window.renderTypes = function () {
  const container = document.getElementById("typesContainer");

  let list = JSON.parse(localStorage.getItem("types-data") || "[]");

  container.innerHTML = `
    <h3>Your Product Types</h3>
    <ul>${list.map(t => `<li>${t}</li>`).join("")}</ul>
    <input id="newType" placeholder="New type" />
    <button onclick="addType()">Add</button>
  `;
};

window.addType = function () {
  let list = JSON.parse(localStorage.getItem("types-data") || "[]");
  const newType = document.getElementById("newType").value;

  if (newType.trim() !== "") {
    list.push(newType);
    localStorage.setItem("types-data", JSON.stringify(list));
    cloudSave("types", list);
    renderTypes();
  }
};
