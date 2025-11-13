console.log("wanting.js loaded");

const WANTING_KEY = "wanting-data";

window.wantingModuleInit = function () {
  renderWanting();
};

function renderWanting() {
  const box = document.getElementById("wantingContainer");
  let list = JSON.parse(localStorage.getItem(WANTING_KEY) || "[]");

  box.innerHTML = `
    <h3>Add Wanting Item</h3>
    <input id="wantText" placeholder="Enter item" />
    <button id="wantAdd">Add</button>

    <h3 style="margin-top:20px">Your Wanting List</h3>
    <ul id="wantList"></ul>
  `;

  document.getElementById("wantAdd").onclick = () => {
    const v = wantText.value.trim();
    if (!v) return alert("Enter item name!");

    list.push(v);
    localStorage.setItem(WANTING_KEY, JSON.stringify(list));
    cloudSave("wanting", list);

    renderWanting();
  };

  const ul = document.getElementById("wantList");

  if (list.length === 0) {
    ul.innerHTML = "<p>No items added yet.</p>";
    return;
  }

  list.forEach((item, i) => {
    const li = document.createElement("li");
    li.innerHTML = `${item} 
      <button style="float:right;background:red;color:white;border:none;padding:4px 8px;border-radius:6px">Delete</button>`;

    li.querySelector("button").onclick = () => {
      list.splice(i, 1);
      localStorage.setItem(WANTING_KEY, JSON.stringify(list));
      cloudSave("wanting", list);
      renderWanting();
    };

    ul.appendChild(li);
  });
}
