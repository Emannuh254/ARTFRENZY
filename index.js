const API_BASE = "https://art-frenzy-admin-6.onrender.com"; // your backend URL
const productsContainer = document.getElementById("products");
const orderModal = document.getElementById("orderModal");
const orderForm = document.getElementById("orderForm");
const selectedProductId = document.getElementById("selectedProductId");

// ---------------- Client ID ----------------
let clientId = localStorage.getItem("client_id");
if (!clientId && crypto?.randomUUID) {
    clientId = crypto.randomUUID();
    localStorage.setItem("client_id", clientId);
}

// ---------------- Toast ----------------
let toastContainer = document.getElementById("toastContainer");
if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toastContainer";
    toastContainer.style.position = "fixed";
    toastContainer.style.bottom = "20px";
    toastContainer.style.left = "50%";
    toastContainer.style.transform = "translateX(-50%)";
    toastContainer.style.zIndex = "2000";
    toastContainer.style.display = "flex";
    toastContainer.style.flexDirection = "column";
    toastContainer.style.gap = "0.5rem";
    document.body.appendChild(toastContainer);
}

function showToast(message, type = "info", duration = 3000) {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.background = type === "error" ? "#aa0000" : "#0ff";
    toast.style.color = type === "error" ? "#fff" : "#000";
    toast.style.padding = "0.75rem 1.5rem";
    toast.style.borderRadius = "8px";
    toast.style.fontWeight = "bold";
    toast.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease";

    toastContainer.appendChild(toast);
    requestAnimationFrame(() => { toast.style.opacity = "1"; });

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.addEventListener("transitionend", () => toast.remove());
    }, duration);
}

// ---------------- Helper: format image URL ----------------
function formatImageUrl(path) {
    if (!path) return "https://via.placeholder.com/250x250?text=No+Image";
    return `${API_BASE}/uploads/${encodeURIComponent(path.replace(/\\/g, '/'))}`;
}

// ---------------- Load Products ----------------
async function loadProducts() {
    if (!productsContainer) return console.error("Products container not found");

    productsContainer.innerHTML = "<p style='text-align:center;'>Loading...</p>";

    try {
        const res = await fetch(`${API_BASE}/products`);
        if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
        const products = await res.json();

        productsContainer.innerHTML = "";

        if (!Array.isArray(products) || products.length === 0) {
            productsContainer.innerHTML = "<p style='text-align:center;'>No products available.</p>";
            return;
        }

        products.forEach(p => {
            const stock = parseInt(p.stock) || 0;
            const imgSrc = formatImageUrl(p.image_url);

            const card = document.createElement("div");
            card.className = "product-card";
            card.style.textAlign = "center";
            card.style.border = "1px solid #ccc";
            card.style.padding = "1rem";
            card.style.borderRadius = "10px";
            card.style.margin = "1rem";
            card.style.maxWidth = "280px";
            card.style.flex = "1 1 250px";

            card.innerHTML = `
                ${stock === 0 ? '<div style="color:red;font-weight:bold;">Sold Out</div>' : ''}
                <img src="${imgSrc}" alt="${p.title || 'Product'}" style="width:100%; height:auto; border-radius:8px;"/>
                <h3>${p.title || 'Untitled'}</h3>
                <p>KES ${p.price || '0'}</p>
                <p>Stock: ${stock}</p>
                <button ${stock === 0 ? 'disabled' : `data-id="${p.id}"`} type="button">
                    ${stock === 0 ? 'Unavailable' : 'Order'}
                </button>
            `;

            const btn = card.querySelector("button");
            if (btn && stock > 0) {
                btn.addEventListener("click", () => openOrderModal(p.id));
            }

            productsContainer.appendChild(card);
        });

        // Flex container styling for responsiveness
        productsContainer.style.display = "flex";
        productsContainer.style.flexWrap = "wrap";
        productsContainer.style.justifyContent = "center";

    } catch (err) {
        console.error("Error loading products:", err);
        productsContainer.innerHTML = "<p style='text-align:center; color:red;'>Failed to load products.</p>";
        showToast("Failed to load products.", "error");
    }
}

// ---------------- Open/Close Modal ----------------
function openOrderModal(productId) {
    if (!orderModal || !selectedProductId) return;
    selectedProductId.value = productId;
    orderModal.style.display = "flex";
}

if (orderModal) {
    orderModal.addEventListener("click", e => {
        if (e.target === orderModal) orderModal.style.display = "none";
    });
}

// ---------------- Submit Order ----------------
if (orderForm) {
    orderForm.addEventListener("submit", async e => {
        e.preventDefault();

        const buyer_name = document.getElementById("buyerName")?.value?.trim();
        const buyer_phone = document.getElementById("buyerPhone")?.value?.trim();
        const drop_location = document.getElementById("dropLocation")?.value?.trim();
        const transaction_id = document.getElementById("transactionId")?.value?.trim();
        const product_id = selectedProductId?.value;

        if (!buyer_name || !buyer_phone || !drop_location || !transaction_id || !product_id) {
            return showToast("Please fill in all fields.", "error");
        }

        const data = { product_id, buyer_name, buyer_phone, drop_location, transaction_id, client_id: clientId };

        const submitBtn = orderForm.querySelector("button[type='submit']");
        if (submitBtn) submitBtn.disabled = true;

        try {
            const res = await fetch(`${API_BASE}/add-purchase`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            const result = await res.json();

            if (res.ok) {
                showToast("Order placed successfully!", "info");
                orderModal.style.display = "none";
                orderForm.reset();
                loadProducts();
            } else {
                showToast(result.error || "Failed to place order.", "error");
            }
        } catch (err) {
            console.error("Network error:", err);
            showToast("Network error. Try again.", "error");
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });
}

// ---------------- Initial Load ----------------
document.addEventListener("DOMContentLoaded", loadProducts);
