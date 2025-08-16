const API_BASE = "https://art-frenzy-admin-3.onrender.com";
const productsContainer = document.getElementById("products");
const orderModal = document.getElementById("orderModal");
const orderForm = document.getElementById("orderForm");
const selectedProductId = document.getElementById("selectedProductId");

// Generate or get unique client ID
if (!localStorage.getItem("client_id")) {
    localStorage.setItem("client_id", crypto.randomUUID());
}
const clientId = localStorage.getItem("client_id");

// Load products
async function loadProducts() {
    productsContainer.innerHTML = "Loading...";
    try {
        const res = await fetch(`${API_BASE}/admin/products`);
        const products = await res.json();
        productsContainer.innerHTML = "";
        if (!products || products.length === 0) {
            productsContainer.innerHTML = "<p style='text-align:center;'>No products available.</p>";
            return;
        }
        products.forEach(p => {
            const card = document.createElement("div");
            card.className = "product-card";
            card.innerHTML = `
                ${p.stock === 0 ? '<div class="sold-badge">Sold Out</div>' : ''}
                <img src="${p.thumb_url || p.image_url}" alt="${p.title}" />
                <h3>${p.title}</h3>
                <p>KES ${p.price}</p>
                <p>Stock: ${p.stock}</p>
                <button ${p.stock === 0 ? 'disabled' : `onclick="openOrderModal('${p.id}')"`}>
                    ${p.stock === 0 ? 'Unavailable' : 'Order'}
                </button>
            `;
            productsContainer.appendChild(card);
        });
    } catch(err) {
        console.error(err);
        productsContainer.innerHTML = "<p style='text-align:center; color:red;'>Failed to load products.</p>";
    }
}

// Open modal
function openOrderModal(productId) {
    selectedProductId.value = productId;
    orderModal.style.display = "flex";
}

// Close modal on outside click
orderModal.addEventListener("click", e => {
    if (e.target === orderModal) orderModal.style.display = "none";
});

// Submit order
orderForm.addEventListener("submit", async e => {
    e.preventDefault();
    const data = {
        product_id: selectedProductId.value,
        buyer_name: document.getElementById("buyerName").value,
        buyer_phone: document.getElementById("buyerPhone").value,
        drop_location: document.getElementById("dropLocation").value,
        transaction_id: document.getElementById("transactionId").value,
        client_id: clientId,
        time: new Date().toISOString() // capture order time
    };
    try {
        const res = await fetch(`${API_BASE}/admin/add-purchase`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if(res.ok){
            alert("Order placed successfully!");
            orderModal.style.display = "none";
            orderForm.reset();
        } else {
            const errData = await res.json();
            alert("Failed: " + (errData.error || "Unknown error"));
        }
    } catch(err){
        console.error(err);
        alert("Network error. Try again.");
    }
});

// Init
loadProducts();
