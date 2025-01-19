document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('.login-form');
    const departmentField = document.querySelector('#department');
    const passwordField = document.querySelector('#password');
    const errorMessage = document.querySelector('.error-message');
    const loadingPage = document.querySelector('#loading');

    // Check if the user is already logged in by verifying the token
    if (localStorage.getItem('auth_token')) {
        console.log("User is already logged in, redirecting to dashboard...");
        window.location.href = "dashboard.html";  // Redirect if token exists
        return;  // Stop further execution to prevent login form from loading
    }

    if (!form) {
        console.error("Form element with class 'login-form' not found!");
        return;
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();  // Prevent form from submitting by default

        const department = departmentField.value.trim();
        const password = passwordField.value.trim();

        // Check if both fields are filled
        if (department === "" || password === "") {
            errorMessage.textContent = "Please enter both department and password.";
            errorMessage.style.display = "block";
            departmentField.value = '';  // Clear department field
            passwordField.value = '';   // Clear password field
            departmentField.focus();    // Focus on department field
            return;
        }

        // Show loading spinner
        loadingPage.style.display = "flex";

        // Send request to the backend for verification
        fetch('http://localhost:3000/login', {  // Assuming backend route is /login
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ department: department, password: password })
        })
        .then(response => response.json())
        .then(data => {
            loadingPage.style.display = "none";  // Hide loading spinner

            if (data.success) {
                // If login is successful, store the token in localStorage
                console.log("Login successful. Storing token.");
                localStorage.setItem('auth_token', data.token);  // Store token in localStorage

                // Redirect to the dashboard
                window.location.href = "dashboard.html";
            } else {
                // Show error message if login fails
                errorMessage.textContent = data.message || "Invalid department or password.";
                errorMessage.style.display = "block";

                // Clear input fields
                departmentField.value = '';
                passwordField.value = '';
                departmentField.focus();  // Focus on department field
            }
        })
        .catch(error => {
            loadingPage.style.display = "none";  // Hide loading spinner
            console.error("Error occurred:", error);
            errorMessage.textContent = "An error occurred. Please try again.";
            errorMessage.style.display = "block";

            // Clear input fields
            departmentField.value = '';
            passwordField.value = '';
            departmentField.focus();  // Focus on department field
        });
    });
});
