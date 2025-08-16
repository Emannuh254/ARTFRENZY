const API_BASE = "https://art-frenzy-admin-6.onrender.com";
const ordersContainer = document.getElementById("ordersContainer");

// Get or generate client ID
let clientId = localStorage.getItem("client_id");
if (!clientId) {
    clientId = crypto.randomUUID();
    localStorage.setItem("client_id", clientId);
}

async function loadOrders() {
    ordersContainer.innerHTML = "Loading your orders...";
    try {
        const res = await fetch(`${API_BASE}/all_p${clientId}`);
        const orders = await res.json();

        if (!orders || orders.length === 0) {
            ordersContainer.innerHTML = "<p style='text-align:center;'>No orders yet.</p>";
            return;
        }

        ordersContainer.innerHTML = "";
        orders.forEach(o => {
            const div = document.createElement("div");
            div.className = "order-card";
            div.innerHTML = `
                <h3>${o.product_title || 'Product #' + o.product_id}</h3>
                <p><strong>Name:</strong> ${o.buyer_name}</p>
                <p><strong>Phone:</strong> ${o.buyer_phone}</p>
                <p><strong>Location:</strong> ${o.drop_location}</p>
                <p><strong>Transaction ID:</strong> ${o.transaction_id || '-'}</p>
                <p><strong>Time:</strong> ${new Date(o.time).toLocaleString()}</p>
            `;
            ordersContainer.appendChild(div);
        });
    } catch(err) {
        console.error(err);
        ordersContainer.innerHTML = "<p style='text-align:center; color:red;'>Failed to load your orders.</p>";
    }
}

loadOrders();
