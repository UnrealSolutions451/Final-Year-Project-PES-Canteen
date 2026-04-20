const menuDiv = document.getElementById("menu");

db.collection("menu").get().then(snapshot => {
  menuDiv.innerHTML = "";
  snapshot.forEach(doc => {
    const item = doc.data();
    const div = document.createElement("div");
    div.innerHTML = `
      <strong>${item.name}</strong> - ₹${item.price}
      <button onclick="addToCart('${doc.id}', '${item.name}', ${item.price})">Add</button>
    `;
    menuDiv.appendChild(div);
  });
});

function addToCart(id, name, price) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.push({ id, name, price });
  localStorage.setItem("cart", JSON.stringify(cart));
  alert(`${name} added to cart!`);
}
