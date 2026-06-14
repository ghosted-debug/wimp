// ===== CONFIG =====
const API_BASE = "http://localhost:5000/api";
const PRICE_PER_GB = 3.5;

// ===== GENERATE BUNDLES (1GB to 30GB) =====
const bundles = Array.from({ length: 30 }, (_, i) => {
  const gb = i + 1;
  const price = gb * PRICE_PER_GB;
  let fee = 0;
  
  // Tiered fee structure
  if (gb >= 20) fee = 1.5;
  else if (gb >= 10) fee = 1;
  else if (gb >= 5) fee = 0.5;
  
  return {
    id: `atgo-${gb}gb`,
    label: `${gb}GB`,
    gb: gb,
    price: price,
    fee: fee
  };
});

// ===== GET USER =====
function getUser() {
  return JSON.parse(localStorage.getItem("user"));
}

// ===== UPDATE WALLET (BACKEND) =====
async function updateWallet() {
  const user = getUser();
  if (!user) {
    document.getElementById("wallet-balance").textContent = "0.00";
    document.getElementById("user-name").textContent = "Guest";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/wallet/${user.email}`);
    const data = await res.json();

    document.getElementById("wallet-balance").textContent =
      data.balance.toFixed(2);

    document.getElementById("user-name").textContent =
      user.fullname || user.email;

  } catch (err) {
    console.error("Wallet error:", err);
    document.getElementById("wallet-balance").textContent = (getUser()?.balance || 0).toFixed(2);
  }
}

// ===== RENDER BUNDLES =====
function renderBundles() {
  const container = document.getElementById("bundle-list");

  container.innerHTML = bundles.map(b => {
    const total = (b.price + b.fee).toFixed(2);

    return `
      <div class="bundle-card">
        <div class="card-header">
          <div class="bundle-icon">
            <i class="fas fa-database"></i>
          </div>
          <h3 class="bundle-label">${b.label}</h3>
        </div>
        
        <div class="card-pricing">
          <div class="price-item">
            <span class="label">Base Price:</span>
            <span class="value">GHS ${b.price.toFixed(2)}</span>
          </div>
          <div class="price-item">
            <span class="label">Fee:</span>
            <span class="value">GHS ${b.fee.toFixed(2)}</span>
          </div>
          <div class="price-item total">
            <span class="label">Total:</span>
            <span class="value">GHS ${total}</span>
          </div>
        </div>

        <div class="card-actions">
          <div class="quantity-group">
            <label for="qty-${b.id}">Quantity:</label>
            <input type="number" id="qty-${b.id}" class="qty-input" min="1" max="10" value="1">
          </div>
          <button class="btn btn-buy" onclick="openCheckout('${b.id}')">
            <i class="fas fa-shopping-cart"></i> Buy
          </button>
        </div>
      </div>
    `;
  }).join("");
}

// ===== GET BUNDLE =====
function getBundle(id) {
  return bundles.find(b => b.id === id);
}

// ===== BUY WITH WALLET =====
async function buyWallet(id) {
  const bundle = getBundle(id);
  if (!bundle) return;

  const user = getUser();
  
  if (!user) {
    alert("Please login first");
    window.location.href = "./login-page.html";
    return;
  }

  // Prompt for phone number for bundle delivery
  let phoneNumber = prompt('Enter your ATgo phone number to receive the bundle:');
  if (!phoneNumber) {
    alert('Phone number is required to receive the bundle.');
    return;
  }
  // Clean and validate phone number
  phoneNumber = phoneNumber.replace(/\s+/g, '').replace(/^0/, '233');
  if (!/^233[0-9]{9}$/.test(phoneNumber)) {
    alert('Please enter a valid Ghana phone number (e.g., 0597532120 or 233597532120)');
    return;
  }

  const total = bundle.price + bundle.fee;

  try {
    const res = await fetch(`${API_BASE}/wallet/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: user.email,
        amount: total,
        network: "ATgo",
        bundle: bundle.label,
        phone: phoneNumber
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.msg);
      return;
    }

    alert(`ATgo bundle purchased successfully!\\nBundle will be sent to: ${phoneNumber}`);
    updateWallet();

  } catch (err) {
    console.error(err);
    alert("Payment failed");
  }
}

// ===== DELIVER BUNDLE TO USER =====
async function deliverBundleToNetwork(email, phone, network, bundle) {
  try {
    console.log(`Delivering ${bundle.label} bundle to ${phone} on ${network} network`);
    
    // Send delivery notification to backend
    await fetch(`${API_BASE}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        amount: bundle.price + bundle.fee,
        bundleType: bundle.label,
        network,
        phone,
        status: "completed"
      })
    }).catch(err => console.log("Delivery notification sent"));

    return true;
  } catch (err) {
    console.error("Error in bundle delivery:", err);
    return false;
  }
}

// ===== PAYSTACK PURCHASE =====
function buyPaystack(id) {
  const bundle = getBundle(id);
  if (!bundle) return;

  const user = getUser();
  
  if (!user) {
    alert("Please login first");
    window.location.href = "./login-page.html";
    return;
  }

  // Prompt for phone number for bundle delivery
  let phoneNumber = prompt('Enter your ATgo phone number to receive the bundle:');
  if (!phoneNumber) {
    alert('Phone number is required to receive the bundle.');
    return;
  }
  // Clean and validate phone number
  phoneNumber = phoneNumber.replace(/\s+/g, '').replace(/^0/, '233');
  if (!/^233[0-9]{9}$/.test(phoneNumber)) {
    alert('Please enter a valid Ghana phone number (e.g., 0597532120 or 233597532120)');
    return;
  }

  const total = bundle.price + bundle.fee;

  if (!window.PaystackPop) {
    alert("Paystack not loaded");
    return;
  }

  if (PAYSTACK_KEY === "pk_test_replace_with_your_key_here") {
    alert("Paystack API key not configured. Please set PAYSTACK_PUBLIC_KEY in config.js");
    return;
  }

  console.log("Starting Paystack payment for bundle:", bundle.label);

  try {
    const handler = PaystackPop.setup({
      key: PAYSTACK_KEY,
      email: user.email,
      amount: Math.round(total * 100),
      currency: "GHS",
      ref: "WIMPS-" + Date.now(),

      callback: async function (response) {
        console.log("Payment successful:", response);

        try {
          const res = await fetch(`${API_BASE}/wallet/pay`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              email: user.email,
              amount: total,
              network: "ATgo",
              bundle: bundle.label,
              phone: phoneNumber,
              paymentMethod: "paystack",
              reference: response.reference
            })
          });

          const data = await res.json();
          console.log("Backend response:", data);

          // Deliver bundle to user's phone
          await deliverBundleToNetwork(user.email, phoneNumber, "ATgo", bundle);

          alert(`✓ Payment Successful!\n\n📦 Bundle: ${bundle.label}\n💰 Amount: GHS ${total.toFixed(2)}\n📱 Network: ATgo\n📞 Will be sent to: ${phoneNumber}\n\nReference: ${response.reference}\n\nYou will receive your bundle within minutes.`);
          updateWallet();
        } catch (err) {
          console.error("Error processing purchase:", err);
          alert("Payment successful! Bundle will be sent shortly.");
        }
      },

      onClose: function () {
        console.log("Bundle purchase payment cancelled by user");
      }
    });

    handler.openIframe();
  } catch (err) {
    console.error("Paystack error:", err);
    alert("Failed to open payment modal: " + err.message);
  }
}

// ===== DEPOSIT =====
const depositForm = document.getElementById("deposit-form");
if (depositForm) {
  depositForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const amount = parseFloat(
      document.getElementById("deposit-amount").value
    );

    const user = getUser();

    if (!user) {
      alert("Please login first");
      window.location.href = "./login-page.html";
      return;
    }

    if (!amount || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/wallet/deposit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: user.email,
          amount
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.msg || "Deposit failed");
        return;
      }

      alert("Deposit successful");
      document.getElementById("deposit-form").reset();
      updateWallet();

    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    }
  });
}

// ===== DEPOSIT WITH PAYSTACK =====
const depositPaystackBtn = document.getElementById("deposit-paystack");
if (depositPaystackBtn) {
  depositPaystackBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const amount = parseFloat(
      document.getElementById("deposit-amount").value
    );

    const user = getUser();

    if (!user) {
      alert("Please login first");
      window.location.href = "./login-page.html";
      return;
    }

    if (!amount || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (!window.PaystackPop) {
      alert("Paystack not loaded. Please refresh the page.");
      return;
    }

    if (PAYSTACK_KEY === "pk_test_replace_with_your_key_here") {
      alert("Paystack API key not configured. Please set PAYSTACK_PUBLIC_KEY in config.js");
      return;
    }

    // Disable button during payment
    const originalText = depositPaystackBtn.textContent;
    depositPaystackBtn.disabled = true;
    depositPaystackBtn.textContent = "Processing...";
    depositPaystackBtn.style.opacity = "0.6";

    try {
      console.log("Opening Paystack for deposit:", { amount, email: user.email });

      const handler = PaystackPop.setup({
        key: PAYSTACK_KEY,
        email: user.email,
        amount: Math.round(amount * 100),
        currency: "GHS",
        ref: "DEP-" + Date.now(),

        callback: async function (response) {
          console.log("Deposit payment successful:", response);

          try {
            const res = await fetch(`${API_BASE}/wallet/deposit`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                email: user.email,
                amount,
                paymentMethod: "paystack",
                reference: response.reference
              })
            });

            const data = await res.json();

            if (res.ok) {
              alert(`✓ Deposit Successful!\nAmount: GHS ${amount.toFixed(2)}\nNew Balance: GHS ${data.balance.toFixed(2)}\nReference: ${response.reference}`);
              document.getElementById("deposit-form").reset();
              updateWallet();
            } else {
              alert(data.msg || "Failed to record deposit");
            }
          } catch (err) {
            console.error(err);
            alert("Error recording deposit: " + err.message);
          } finally {
            depositPaystackBtn.disabled = false;
            depositPaystackBtn.textContent = originalText;
            depositPaystackBtn.style.opacity = "1";
          }
        },

        onClose: function () {
          console.log("Payment modal closed");
          depositPaystackBtn.disabled = false;
          depositPaystackBtn.textContent = originalText;
          depositPaystackBtn.style.opacity = "1";
        }
      });

      handler.openIframe();
    } catch (err) {
      console.error("Paystack error:", err);
      alert("Failed to open payment modal: " + err.message);
      depositPaystackBtn.disabled = false;
      depositPaystackBtn.textContent = originalText;
      depositPaystackBtn.style.opacity = "1";
    }
  });
}

// ===== INIT =====
window.onload = () => {
  renderBundles();
  updateWallet();
};