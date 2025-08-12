
const productsContainer = document.getElementById("products");
const locationModal = document.getElementById("locationModal");
const dropLocationInput = document.getElementById("dropLocation");
const buyerNameInput = document.getElementById("buyerName");
const buyerPhoneInput = document.getElementById("buyerPhone");

const transactionModal = document.getElementById("transactionModal");
const transactionIdInput = document.getElementById("transactionId");

const alertBox = document.getElementById("customAlert");
const alertMessage = document.getElementById("alertMessage");
const closeAlertBtn = document.getElementById("closeAlertBtn");

let currentProductId = null;

function showAlert(message) {
  alertMessage.textContent = message;
  alertBox.classList.remove("hidden");
  closeAlertBtn.focus();
}

closeAlertBtn.onclick = () => alertBox.classList.add("hidden");

// Load products for client view
async function loadClientProducts() {
  try {
    const res = await fetch(`${API_BASE}/products`);  // Note: your backend needs this endpoint or use /admin/products and filter if needed
    const products = await res.json();

    productsContainer.innerHTML = products
      .map(({ id, title, price, image_url, stock }) => `
        <div class="product">
          <img src="${image_url}" alt="${title}" />
          <h3>${title}</h3>
          <p>KES ${price}</p>
          <button data-id="${id}" ${stock === 0 ? "disabled" : ""}>
            ${stock === 0 ? "Out of Stock" : "Buy"}
          </button>
        </div>
      `).join("");

    productsContainer.querySelectorAll("button:not(:disabled)").forEach(btn => {
      btn.onclick = () => {
        currentProductId = Number(btn.dataset.id);
        locationModal.style.display = "block";
        buyerNameInput.focus();
      };
    });
  } catch (err) {
    showAlert("Failed to load products.");
  }
}

document.getElementById("cancelBuy").onclick = () => {
  locationModal.style.display = "none";
  dropLocationInput.value = "";
  buyerNameInput.value = "";
  buyerPhoneInput.value = "";
};

document.getElementById("confirmBuy").onclick = () => {
  const buyerName = buyerNameInput.value.trim();
  const buyerPhone = buyerPhoneInput.value.trim();
  const dropLocation = dropLocationInput.value.trim();

  if (!buyerName || !buyerPhone || !dropLocation) {
    showAlert("Please fill in all fields.");
    return;
  }

  if (!/^2547\d{8}$/.test(buyerPhone)) {
    showAlert("Enter valid phone number: 2547xxxxxxxx");
    return;
  }

  const purchaseTime = new Date().toISOString();

  fetch(`${API_BASE}/purchase`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      product_id: currentProductId,
      buyer_name: buyerName,
      buyer_phone: buyerPhone,
      drop_location: dropLocation,
      purchase_time: purchaseTime,
    }),
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      showAlert("Purchase error: " + data.error);
      return;
    }
    locationModal.style.display = "none";
    dropLocationInput.value = "";
    buyerNameInput.value = "";
    buyerPhoneInput.value = "";

    const mpesaNumber = "254712472601"; // Your Mpesa number
    navigator.clipboard.writeText(mpesaNumber).then(() => {
      showAlert(`Mpesa number ${mpesaNumber} copied to clipboard! Please pay and paste confirmation code.`);
      transactionIdInput.value = "";
      transactionModal.style.display = "block";
      transactionIdInput.focus();
    });
  })
  .catch(() => showAlert("Error submitting purchase. Try again."));
};

document.getElementById("cancelTransaction").onclick = () => {
  transactionModal.style.display = "none";
  transactionIdInput.value = "";
};

document.getElementById("confirmTransaction").onclick = () => {
  const transactionId = transactionIdInput.value.trim();

  if (!transactionId) {
    showAlert("Please enter your Mpesa confirmation code.");
    return;
  }

  const paymentTime = new Date().toISOString();

  fetch(`${API_BASE}/submit-transaction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      product_id: currentProductId,
      transaction_id: transactionId,
      payment_time: paymentTime,
    }),
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      showAlert("Transaction error: " + data.error);
      return;
    }

    transactionModal.style.display = "none";
    transactionIdInput.value = "";
    currentProductId = null;

    showAlert("Payment confirmed! Your order is being processed.");
  })
  .catch(() => showAlert("Error submitting payment confirmation. Try again."));
};

// Initial load calls
loadProducts();
loadPurchases();
loadClientProducts();