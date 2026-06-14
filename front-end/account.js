// account.js

const API_BASE = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", () => {
    initializeAccount();
});

function getUser() {
    return JSON.parse(localStorage.getItem("user"));
}

function initializeAccount() {
    const user = getUser();

    const loggedInView = document.getElementById("logged-in");
    const notLoggedInView = document.getElementById("not-logged-in");

    if (!user || !user.email) {
        if (loggedInView) loggedInView.style.display = "none";
        if (notLoggedInView) notLoggedInView.style.display = "block";
        return;
    }

    if (loggedInView) loggedInView.style.display = "block";
    if (notLoggedInView) notLoggedInView.style.display = "none";

    populateAccountInfo(user);
    loadAccountData(user.email);
    setupLogout();
}

// ==========================
// BASIC INFO
// ==========================
function populateAccountInfo(user) {
    const fullname = document.getElementById("fullname");
    const email = document.getElementById("email");
    const memberSince = document.getElementById("member-since");

    if (fullname) fullname.value = user.fullname || "";
    if (email) email.value = user.email || "";

    if (memberSince && user.createdAt) {
        memberSince.value = new Date(user.createdAt).toLocaleDateString();
    }
}

// ==========================
// LOAD DATA
// ==========================
async function loadAccountData(email) {
    try {
        // ===== WALLET =====
        const walletRes = await fetch(`${API_BASE}/wallet/${email}`);

        if (!walletRes.ok) throw new Error("Wallet request failed");

        const walletData = await walletRes.json();
        const balance = Number(walletData.balance || 0);

        const balanceEl = document.getElementById("account-balance");
        if (balanceEl) {
            balanceEl.textContent = "GHS " + balance.toFixed(2);
        }

        // sync localStorage
        const user = getUser();
        user.balance = balance;
        localStorage.setItem("user", JSON.stringify(user));

        // ===== TRANSACTIONS =====
        const txRes = await fetch(`${API_BASE}/transactions/${email}`);

        if (!txRes.ok) throw new Error("Transactions request failed");

        const transactions = await txRes.json();

        // TOTAL TRANSACTIONS
        const totalTxEl = document.getElementById("total-transactions");
        if (totalTxEl) {
            totalTxEl.textContent = transactions.length;
        }

        // TOTAL ORDERS (only purchases)
        const totalOrdersEl = document.getElementById("total-orders");
        if (totalOrdersEl) {
            const orders = transactions.filter(tx => tx.type === "purchase");
            totalOrdersEl.textContent = orders.length;
        }

        // (optional debug)
        console.log("Transactions:", transactions);

    } catch (err) {
        console.error("Account load error:", err);
    }
}

// ==========================
// LOGOUT
// ==========================
function setupLogout() {
    const logoutBtn = document.getElementById("logout-btn");

    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("user");
        window.location.href = "login-page.html";
    });
}