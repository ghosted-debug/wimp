// Mobile menu toggle
const bar = document.getElementById('bar');
const close = document.getElementById('close');
const navbar = document.getElementById('navbar');

if (bar) {
    bar.addEventListener('click', () => {
        navbar.classList.add('active');
    });
}

if (close) {
    close.addEventListener('click', (e) => {
        e.preventDefault();
        navbar.classList.remove('active');
    });
}

// Close menu when clicking on a link
const navLinks = document.querySelectorAll('#navbar li a');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navbar.classList.remove('active');
    });
});

// Load user data on page load
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    setupNewsletter();
});

function loadUserData() {
    const user = JSON.parse(localStorage.getItem('user'));
    const accountStats = JSON.parse(localStorage.getItem('accountStats')) || {
        totalOrders: 0,
        totalTransactions: 0,
        balance: 0
    };

    // Update dashboard with user data if elements exist
    const userBalanceEl = document.getElementById('user-balance');
    const userOrdersEl = document.getElementById('user-orders');
    const userTransactionsEl = document.getElementById('user-transactions');

    if (userBalanceEl) userBalanceEl.textContent = 'GHS ' + (accountStats.balance || 0).toFixed(2);
    if (userOrdersEl) userOrdersEl.textContent = accountStats.totalOrders || 0;
    if (userTransactionsEl) userTransactionsEl.textContent = accountStats.totalTransactions || 0;

    // If user is logged in, update greeting
    if (user && user.fullname) {
        const firstName = user.fullname.split(' ')[0];
        const greetingEl = document.querySelector('.hero-content > p:nth-of-type(1)');
        if (greetingEl) {
            greetingEl.textContent = `Welcome back, ${firstName}!`;
        }
    }
}

function setupNewsletter() {
    const form = document.getElementById('newsletter-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = form.querySelector('input[type="email"]');
            
            if (email && email.value) {
                alert('Thank you for subscribing! Check your email for special offers.');
                form.reset();
            }
        });
    }
}


