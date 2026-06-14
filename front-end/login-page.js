// ==========================
// TOGGLE LOGIN / SIGNUP
// ==========================
const toggleSignupLink = document.getElementById('toggle-signup');
const toggleLoginLink = document.getElementById('toggle-login');
const loginBox = document.querySelector('.login-form');
const signupBox = document.querySelector('.signup-form');

if (toggleSignupLink && toggleLoginLink) {
    toggleSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginBox.classList.remove('active');
        signupBox.classList.add('active');
    });

    toggleLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        signupBox.classList.remove('active');
        loginBox.classList.add('active');
    });
}


// ==========================
// LOGIN (BACKEND)
// ==========================
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        console.log("LOGIN CLICKED");

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        if (!email || !password) {
            alert("Please fill in all fields");
            return;
        }

        try {
            const res = await fetch("http://localhost:5000/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok) {
                alert("Login successful");

                // Save user with proper data
                const user = {
                    id: data.user.id,
                    fullname: data.user.fullname,
                    email: data.user.email,
                    balance: data.user.balance || 0,
                    createdAt: data.user.createdAt
                };
                localStorage.setItem("user", JSON.stringify(user));

                // Redirect
                window.location.href = "./account.html";
            } else {
                alert(data.msg || "Login failed");
            }

        } catch (err) {
            console.error(err);
            alert("Server error");
        }
    });
}


// ==========================
// SIGNUP (BACKEND)
// ==========================
const signupForm = document.querySelector('.signup-form form');

if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const fullname = document.getElementById('signup-fullname').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm').value;

        if (!fullname || !email || !password || !confirmPassword) {
            alert("Please fill in all fields");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        if (password.length < 6) {
            alert("Password must be at least 6 characters");
            return;
        }

        try {
            const res = await fetch("http://localhost:5000/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ fullname, email, password })
            });

            const data = await res.json();

            if (res.ok) {
                alert("Account created successfully!");

                // Switch to login
                signupBox.classList.remove('active');
                loginBox.classList.add('active');
                
                // Optionally auto-fill login form
                document.getElementById('email').value = email;
                document.getElementById('email').focus();
            } else {
                alert(data.msg || "Signup failed");
            }

        } catch (err) {
            console.error(err);
            alert("Server error: " + err.message);
        }
    });
}


// ==========================
// MOBILE MENU
// ==========================
const bar = document.getElementById('bar');
const navbar = document.getElementById('navbar');
const close = document.getElementById('close');

if (bar && navbar) {
    bar.addEventListener('click', () => {
        navbar.classList.add('active');
    });
}

if (close && navbar) {
    close.addEventListener('click', () => {
        navbar.classList.remove('active');
    });
}