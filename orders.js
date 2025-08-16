const API_BASE = "https://art-frenzy-admin-3.onrender.com";
const ordersContainer = document.getElementById("ordersContainer");
const clientId = localStorage.getItem("client_id");

async function loadOrders() {
    ordersContainer.innerHTML = "Loading your orders...";
    try {
        const res = await fetch(`${API_BASE}/admin/purchases`);
        const allOrders = await res.json();
        const orders = allOrders.filter(o => o.client_id === clientId);
        if (orders.length === 0) {
            ordersContainer.innerHTML = "<p style='text-align:center;'>No orders yet.</p>";
            return;
        }

        ordersContainer.innerHTML = "";
        orders.forEach(o => {
            const div = document.createElement("div");
            div.className = "order-card";
            div.innerHTML = `
                <h3>Product: ${o.product_title || o.product_id}</h3>
                <p>Name: ${o.buyer_name}</p>
                <p>Phone: ${o.buyer_phone}</p>
                <p>Location: ${o.drop_location}</p>
                <p>Transaction ID: ${o.transaction_id}</p>
                <p>Time: ${new Date(o.time).toLocaleString()}</p>
            `;
            ordersContainer.appendChild(div);
        });
    } catch(err) {
        console.error(err);
        ordersContainer.innerHTML = "<p style='text-align:center; color:red;'>Failed to load orders.</p>";
    }
}

loadOrders();
