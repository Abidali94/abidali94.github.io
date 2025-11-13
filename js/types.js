console.log("types.js loaded");

window.renderTypes = function () {
  const box = document.getElementById("typesContainer");
  let list = JSON.parse(localStorage.getItem("types-data") || "[]");

  box.innerHTML = `
    <h3>Product Types</h3>
    <ul>${list.map(t => `<li>${t}</li>`).join("")}</ul>
    <input id="newType" placeholder="New Type">
    <button onclick="addType()">Add</button>
  `;
};

window.addType = function () {
  let list = JSON.parse(localStorage.getItem("types-data") || "[]");
  const t = newType.value.trim();

  if (!t) return alert("Enter type!");

  list.push(t);
  localStorage.setItem("types-data", JSON.stringify(list));

  cloudSave("types", list);
  renderTypes();
};

window.moduleInit = id => {
  if (id === "types") renderTypes();
};
