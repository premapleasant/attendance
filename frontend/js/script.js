window.addEventListener("load", () => {
    fetch("https://aaasc-attendance.onrender.com/api/health-check", {
      method: "GET",
      cache: "no-cache",
    })
      .then((response) => {
        if (response.ok) {
          console.log("Backend warmed up!");
        } else {
          console.error("Warm-up failed: ", response.statusText);
        }
      })
      .catch((error) => {
        console.error("Error warming up backend:", error);
      });
  });
  
document.addEventListener("DOMContentLoaded", function () {
    // Navbar Toggle for Mobile
    const navToggle = document.querySelector(".nav-toggle");
    const navLinks = document.querySelector(".nav-links");
  
    function toggleMenu() {
      navLinks.classList.toggle("active");
      navToggle.classList.toggle("open"); // Toggle "X" animation
    }
  
    if (navToggle) {
      navToggle.addEventListener("click", toggleMenu);
    }
  
    // Close menu when clicking a nav link
    document.querySelectorAll(".nav-links a").forEach((link) => {
      link.addEventListener("click", function () {
        navLinks.classList.remove("active");
        navToggle.classList.remove("open"); // Reset "X" animation
      });
    });
  
    // Smooth Scroll to Contact Section
    const contactLink = document.querySelector(".nav-links a[href='#contact']");
    if (contactLink) {
      contactLink.addEventListener("click", function (e) {
        e.preventDefault();
        document.querySelector("#contact").scrollIntoView({ behavior: "smooth" });
      });
    }
  
    // Login Button Animation & Redirect
    const loginBtn = document.querySelector(".login-btn");
    if (loginBtn) {
      loginBtn.addEventListener("click", function () {
        this.classList.add("clicked");
        setTimeout(() => {
          this.classList.remove("clicked");
          window.location.href = "login.html"; // Ensure this file exists
        }, 300);
      });
    } else {
      console.error("Login button not found in the DOM.");
    }
  });
  