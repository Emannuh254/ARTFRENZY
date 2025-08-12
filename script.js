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

const whatsappFaqBtn = document.getElementById("whatsappFaqBtn");

let selectedProductId = null;

function showAlert(message) {
  alertMessage.textContent = message;
  alertBox.classList.remove("hidden");
  closeAlertBtn.focus();
}

closeAlertBtn.onclick = () => alertBox.classList.add("hidden");

function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
    .then(() => showAlert(`Mpesa number ${text} copied to clipboard! Please pay and paste the confirmation code.`))
    .catch(() => showAlert("Could not copy Mpesa number to clipboard. Please copy it manually: " + text));
}

async function loadProducts() {
  try {
    const res = await fetch("http://localhost:8000/admin/products");
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
        selectedProductId = Number(btn.dataset.id);
        locationModal.style.display = "block";
        // Focus on buyerName input when modal opens
        buyerNameInput.focus();
      };
    });
  } catch (err) {
    showAlert("Failed to load products.");
  }
}

document.getElementById("cancelBuy").onclick = () => {
  locationModal.style.display = "none";
  [dropLocationInput, buyerNameInput, buyerPhoneInput].forEach(input => input.value = "");
};

document.getElementById("confirmBuy").onclick = () => {
  const buyerName = buyerNameInput.value.trim();
  const buyerPhone = buyerPhoneInput.value.trim();
  const dropLocation = dropLocationInput.value.trim();

  if (!buyerName || !buyerPhone || !dropLocation) {
    showAlert("Please fill in your name, phone, and drop location.");
    return;
  }

  // Validate Kenya phone number format: starts with 2547 + 8 digits
  if (!/^2547\d{8}$/.test(buyerPhone)) {
    showAlert("Please enter a valid phone number in the format 2547xxxxxxxx.");
    return;
  }

  const purchaseTime = new Date().toISOString();

  fetch("http://localhost:8000/purchase", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      product_id: selectedProductId,
      buyer_name: buyerName,
      buyer_phone: buyerPhone,
      drop_location: dropLocation,
      purchase_time: purchaseTime,
    }),
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      showAlert(`Purchase error: ${data.error}`);
      return;
    }

    locationModal.style.display = "none";
    [dropLocationInput, buyerNameInput, buyerPhoneInput].forEach(input => input.value = "");

    // Copy Mpesa number to clipboard
    const mpesaNumber = "254712472601"; // Your business Mpesa number
    copyToClipboard(mpesaNumber);

    // Show transaction modal for confirmation code
    transactionIdInput.value = "";
    transactionModal.style.display = "block";
    transactionIdInput.focus();
  })
  .catch(() => showAlert("Error submitting purchase. Please try again."));
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

  fetch("http://localhost:8000/submit-transaction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      product_id: selectedProductId,
      transaction_id: transactionId,
      payment_time: paymentTime,
    }),
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      showAlert(`Transaction error: ${data.error}`);
      return;
    }

    transactionModal.style.display = "none";
    transactionIdInput.value = "";
    selectedProductId = null;

    showAlert("Payment confirmed! Your order is now being processed. Await delivery.");
  })
  .catch(() => showAlert("Error submitting payment confirmation. Please try again."));
};

if (whatsappFaqBtn) {
  whatsappFaqBtn.onclick = () => {
    const faqMessage = encodeURIComponent("I need assistance or more info.");
    const whatsappUrl = `https://wa.me/254712472601?text=${faqMessage}`;
    window.open(whatsappUrl, "_blank");
  };
}

loadProducts();
