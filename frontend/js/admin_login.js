document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('admin-login-form');
    const errorMessage = document.querySelector('.error-message');

    form.addEventListener('submit', function (e) {
        e.preventDefault(); // Prevent the default form submission

        const username = document.querySelector('#username').value.trim();
        const password = document.querySelector('#password').value.trim();

        // Validate the inputs
        if (username === "" || password === "") {
            errorMessage.textContent = "Please enter both username and password.";
            errorMessage.style.display = "block";
        } else {
            // Show loading spinner (optional for better UX)
            const loadingSpinner = document.querySelector('#loading');
            if (loadingSpinner) loadingSpinner.style.display = "flex";

            // Send the credentials to the backend
            fetch('http://localhost:3000/admin_login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: username, password: password }),
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Store the token in localStorage
                        const token = data.token; // Backend must send a token on success
                        localStorage.setItem('adminToken', token);

                        // Redirect to the change password page
                        window.location.href = "change_password.html"; // Correct URL for Flask route
                    } else {
                        // Show error message if login fails
                        errorMessage.textContent = data.message || "Invalid username or password.";
                        errorMessage.style.display = "block";
                    }
                })
                .catch(error => {
                    console.error("Error during login:", error);
                    errorMessage.textContent = "An error occurred. Please try again.";
                    errorMessage.style.display = "block";
                })
                .finally(() => {
                    // Hide the loading spinner once the request completes
                    if (loadingSpinner) loadingSpinner.style.display = "none";
                });
        }
    });
});
