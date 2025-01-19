document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('changePasswordForm');
    const departmentNameField = document.getElementById('department_name');
    const newPasswordField = document.getElementById('new_password');
    const confirmPasswordField = document.getElementById('confirm_password');
    const errorMessage = document.getElementById('error_message');
    const successMessage = document.getElementById('success_message');
    const logoutButton = document.getElementById('logoutButton');
    const downloadDbButton = document.getElementById('downloadDbButton');

    // Check for token on page load
    const token = localStorage.getItem('adminToken');
    if (!token) {
        alert("Unauthorized access. Redirecting to login.");
        window.location.href = "admin_login.html";
        return;
    }

    // Handle form submission
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const departmentName = departmentNameField.value.trim();
        const newPassword = newPasswordField.value.trim();
        const confirmPassword = confirmPasswordField.value.trim();

        // Validate form fields
        if (!departmentName || !newPassword || !confirmPassword) {
            errorMessage.textContent = "All fields are required.";
            errorMessage.style.display = "block";
            successMessage.style.display = "none";
            return;
        }

        // Check if passwords match
        if (newPassword !== confirmPassword) {
            errorMessage.textContent = "Passwords do not match.";
            errorMessage.style.display = "block";
            successMessage.style.display = "none";
            return;
        }

        // Send request to update the password
        fetch('http://localhost:3000/update_department_password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({
                department: departmentName,
                new_password: newPassword
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    successMessage.textContent = "Password updated successfully!";
                    successMessage.style.display = "block";
                    errorMessage.style.display = "none";

                    // Clear the form but do not redirect
                    form.reset();
                } else {
                    errorMessage.textContent = data.message || "Error updating password.";
                    errorMessage.style.display = "block";
                    successMessage.style.display = "none";
                }
            })
            .catch(error => {
                console.error("Error:", error);
                errorMessage.textContent = "Network error. Please try again later.";
                errorMessage.style.display = "block";
                successMessage.style.display = "none";
            });
    });

    // Handle logout
    logoutButton.addEventListener('click', function () {
        localStorage.removeItem('adminToken'); // Clear the token
        window.location.href = "login.html"; // Redirect to login page
    });

    downloadDbButton.addEventListener('click', function () {
        // Send request to download the database
        fetch('http://localhost:3000/download_db', {
            method: 'GET'
        })
        .then(response => {
            if (response.ok) {
                // Return the blob
                return response.blob();
            } else {
                alert("Error downloading database. Please try again.");
                throw new Error('Failed to fetch the database');
            }
        })
        .then(blob => {
            // Create a temporary link element to trigger the download
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob); // Create URL for the blob
            link.download = 'attendance_db.sqlite'; // Suggested filename
            link.click(); // Trigger the download
        })
        .catch(error => {
            console.error("Error:", error);
            alert("Network error. Please try again later.");
        });
    });
});
