// ===== CONFIG =====
const API_BASE = "http://localhost:5000/api";
const PRICE_PER_GB = 4;
const PAYSTACK_KEY = "pk_test_23c3ab0dd94346d7f9ae1377537cfd1214c39b56";

// ===== USER =====
function getUser() {
  return JSON.parse(localStorage.getItem("user"));
}

function setUser(user) {
  localStorage.setItem("user", JSON.stringify(user));
}

// ===== BUNDLES =====
const bundles = Array.from({ length: 30 }, (_, i) => {
  const gb = i + 1;

  let fee = 0;
  if (gb >= 20) fee = 1.5;
  else if (gb >= 10) fee = 1;
  else if (gb >= 5) fee = 0.5;

  return {
    id: `mtn-${gb}`,
    label: `${gb}GB`,
    gb,
    price: gb * PRICE_PER_GB,
    fee
  };
});

// ===== WALLET =====
async function updateWallet() {
  const user = getUser();
  if (!user) return;

  const balanceEl = document.getElementById("wallet-balance");
  const nameEl = document.getElementById("user-name");

  try {
    const res = await fetch(`${API_BASE}/wallet/${user.email}`);
    if (!res.ok) throw new Error("Failed");

    const data = await res.json();

    // ✅ update UI
    if (balanceEl) {
      balanceEl.textContent = Number(data.balance || 0).toFixed(2);
    }

    if (nameEl) {
      nameEl.textContent = user.fullname || user.email;
    }

    // ✅ keep localStorage in sync
    user.balance = data.balance;
    setUser(user);

  } catch (err) {
    console.error("Wallet fetch error:", err);
    if (balanceEl) balanceEl.textContent = "0.00";
  }
}

// ===== RENDER =====
function renderBundles() {
  const container = document.getElementById("bundle-list");

  container.innerHTML = bundles.map(b => `
    <div class="bundle-card">
      <h3>${b.label}</h3>
      <p>Price: GHS ${b.price.toFixed(2)}</p>
      <p>Fee: GHS ${b.fee.toFixed(2)}</p>
      <p><strong>Total: GHS ${(b.price + b.fee).toFixed(2)}</strong></p>

      <input type="number" id="qty-${b.id}" value="1" min="1" class="qty-input">
      <button onclick="openCheckout('${b.id}')" class="btn-buy">Buy</button>
    </div>
  `).join("");
}

// ===== CHECKOUT =====
function openCheckout(id) {
  const user = getUser();
  if (!user) return alert("Login first");

  const b = bundles.find(x => x.id === id);
  const qty = parseInt(document.getElementById(`qty-${id}`).value) || 1;

  const base = b.price * qty;
  const fee = b.fee * qty;
  const total = base + fee;

  window.currentPurchase = { b, qty, total, user };

  document.getElementById("modal-bundle-name").textContent = b.label;
  document.getElementById("modal-quantity").textContent = qty;
  document.getElementById("modal-base-amount").textContent = `GHS ${base}`;
  document.getElementById("modal-fee").textContent = `GHS ${fee}`;
  document.getElementById("modal-total").textContent = `GHS ${total}`;

  document.getElementById("checkout-modal").style.display = "flex";
}

function closeCheckoutModal() {
  document.getElementById("checkout-modal").style.display = "none";
}

// ===== WALLET BUY (FIXED) =====
async function buyWithWallet() {
  const p = window.currentPurchase;
  if (!p) return;

  const phone = document.getElementById("phone-number").value.trim();
  if (!phone) return alert("Enter phone");

  try {
    const res = await fetch(`${API_BASE}/wallet/buy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: p.user.email,
        amount: p.total,
        bundle: `${p.qty}x ${p.b.label}`,
        phone
      })
    });

    const data = await res.json();

    if (!res.ok) {
      return alert(data.msg || "Payment failed");
    }

    // ✅ update balance locally
    p.user.balance = data.balance;
    setUser(p.user);

    alert("Purchase successful");
    closeCheckoutModal();
    updateWallet();

  } catch (err) {
    console.error(err);
    alert("Network error");
  }
}

// ===== PAYSTACK BUY (FIXED FLOW) =====
function buyWithPaystack() {
  const p = window.currentPurchase;
  if (!p) return;

  const phone = document.getElementById("phone-number").value.trim();
  if (!phone) return alert("Enter phone");

  const handler = PaystackPop.setup({
    key: PAYSTACK_KEY,
    email: p.user.email,
    amount: p.total * 100,
    currency: "GHS",

    callback: function(response) {
      console.log("PAYSTACK SUCCESS:", response);

      fetch(`${API_BASE}/wallet/buy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: p.user.email,
          amount: p.total,
          bundle: `${p.qty}x ${p.b.label}`,
          phone,
          reference: response.reference
        })
      })
      .then(res => res.json())
      .then(data => {
        if (!data || data.msg) {
          alert(data.msg || "Payment failed");
          return;
        }

        alert("Payment successful");
        closeCheckoutModal();
        updateWallet();
      })
      .catch(err => {
        console.error(err);
        alert("Verification failed");
      });
    },

    onClose: function() {
      alert("Transaction cancelled");
    }
  });

  handler.openIframe();
}
// ===== DEPOSIT PAYSTACK (FIXED) =====
function depositWithPaystack() {
  const user = getUser();
  const amountEl = document.getElementById("deposit-amount");

  if (!user) return alert("Login first");
  if (!amountEl) return alert("Amount input missing");

  const amount = Number(amountEl.value);
  if (!amount || amount < 10) return alert("Enter valid amount , deposit GHS10 plus");

  const handler = PaystackPop.setup({
    key: PAYSTACK_KEY,
    email: user.email,
    amount: amount * 100,
    currency: "GHS",

    callback: function (response) {
      console.log("PAYSTACK SUCCESS:", response);

      fetch(`${API_BASE}/wallet/deposit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: user.email,
          amount: amount,
          reference: response.reference
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.balance !== undefined) {
          user.balance = data.balance;
          setUser(user);
        }

        alert(data.msg || "Deposit successful");
        updateWallet();
      })
      .catch(err => {
        console.error(err);
        alert("Deposit failed");
      });
    },

    onClose: function () {
      alert("Transaction cancelled");
    }
  });

  handler.openIframe();
}

// ===== EVENTS =====
document.addEventListener("DOMContentLoaded", () => {
  renderBundles();
  updateWallet();

  document.getElementById("buy-wallet-btn")
    ?.addEventListener("click", buyWithWallet);

  document.getElementById("buy-paystack-btn")
    ?.addEventListener("click", buyWithPaystack);

  document.getElementById("deposit-paystack")
    ?.addEventListener("click", depositWithPaystack);

  document.querySelector(".close-btn")
    ?.addEventListener("click", closeCheckoutModal);
});

// ===== GLOBAL =====
window.openCheckout = openCheckout;