let attendanceData = []; // Initialize as an empty array

// Function to fetch attendance data from the backend
async function fetchAttendanceData() {
    try {
        // Collect filter values
        const date = document.getElementById('attendanceDate').value.trim();
        const course = document.getElementById('course').value.trim();
        const year = document.getElementById('year').value.trim();
        const semester = document.getElementById('semester').value.trim();
          if(!date || !course || !year || !semester) {
            console.warn("All filter fields are required before fetching data.");
            
          }
        // Debug: log the selected filter values
        console.log("Fetching attendance data...");
        console.log(`Date: ${date}, Course: ${course}, Year: ${year}, Semester: ${semester}`);

        // Show loading indicator
        showLoadingIndicator(true);

        // Get token from localStorage
        const token = localStorage.getItem('auth_token');
        // or sessionStorage.getItem('auth_token');

        // Check if token exists
        if (!token) {
            alert("You must be logged in first.");
            console.error("Token is missing.");
            window.location.href = 'login.html'; // Redirect to the login page
            return;
        }

        // Fetch data from backend with token included in the headers
        const response = await fetch(`https://aaasc-attendance.onrender.com/view_attendance?date=${date}&course=${course}&year=${year}&semester=${semester}&nocache=${new Date().getTime()}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}` // Include token in Authorization header
            }
        });

        // Check if the token has expired
        if (response.status === 401) {
            alert("Your session has expired. Please log in again.");
            localStorage.removeItem('auth_token'); // Clear the expired token
            window.location.href = 'login.html'; // Redirect to the login page
            return;
        }

        const data = await response.json();

        // Debug: log the response
        console.log("Fetched data from server:", data);

        if (response.ok && data.success) {
            attendanceData = data.attendance; // Update global attendance data
            populateTable(attendanceData); // Populate table with fetched data
        } else {
            console.error("Error fetching data:", data.message);
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        console.error("Error during data fetch:", error);
        alert("Failed to fetch attendance data. Please try again later.");
    } finally {
        // Hide loading indicator
        showLoadingIndicator(false);
    }
}

// Function to filter attendance data
function filterAttendance() {
    console.log("Filtering attendance data...");
    const date = document.getElementById('attendanceDate').value.trim();
    const course = document.getElementById('course').value.trim();
    const year = document.getElementById('year').value.trim();
    const semester = document.getElementById('semester').value.trim();

    // Ensure required fields are filled
    if (!date || !course || !year || !semester) {
        console.warn("All filter fields are required before fetching data.");
        alert("Please fill in all the fields before proceeding.");
        return;
    }

    // Debug: log the filter criteria
    console.log("Filter criteria:");
    console.log(`Date: ${date}, Course: ${course}, Year: ${year}, Semester: ${semester}`);

    if (!Array.isArray(attendanceData)) {
        console.error("Attendance data is not an array:", attendanceData);
        return;
    }

    // Fetch data if it's not already loaded or if a filter change occurs
    if (attendanceData.length >= 0) {
        fetchAttendanceData();
    } else {
        // Filter data
        const filteredData = attendanceData.filter(item => {
            return (
                (!date || item.date.toLowerCase() === date.toLowerCase()) &&
                (!course || item.course.toLowerCase() === course.toLowerCase()) &&
                (!year || item.year.toLowerCase() === year.toLowerCase()) &&
                (!semester || item.semester.toLowerCase() === semester.toLowerCase())
            );
        });

        console.log("Filtered data:", filteredData);

        // Populate table with filtered data
        populateTable(filteredData);

        // Show or hide filtered data indicator
        const filteredDataIndicator = document.getElementById('filteredDataIndicator');
        if (filteredData.length > 0) {
            filteredDataIndicator.classList.remove('hidden');
            console.log("Filtered data applied.");
        } else {
            filteredDataIndicator.classList.add('hidden');
            console.log("No data found for the selected filters.");
        }
    }
}

// Function to populate the table
function populateTable(data) {
    console.log("Populating table...");
    const tableBody = document.querySelector("#attendance-table tbody");

    if (!tableBody) {
        console.error("Table body not found!");
        return;
    }

    tableBody.innerHTML = ""; // Clear existing table data

    if (Array.isArray(data) && data.length === 0) {
        console.warn("No data to populate.");
        const noDataRow = document.createElement("tr");
        const noDataCell = document.createElement("td");
        noDataCell.colSpan = 6;
        noDataCell.textContent = "No attendance records found.";
        noDataRow.appendChild(noDataCell);
        tableBody.appendChild(noDataRow);
    } else if (Array.isArray(data)) {
        data.forEach(item => {
            const row = document.createElement("tr");

            // Add cells for each column
            // row.appendChild(createCell(item.date.split('T')[0])); // Extract date only
            // row.appendChild(createCell(item.course));
            // row.appendChild(createCell(item.year));
            // row.appendChild(createCell(item.semester));
            row.appendChild(createCell(item.name));
            const statusCell = createCell(item.status);

            // Add status class for color coding
            if (item.status.toLowerCase() === "present") {
                statusCell.classList.add("status-present");
            } else if (item.status.toLowerCase() === "absent") {
                statusCell.classList.add("status-absent");
            } else if (item.status.toLowerCase() === "on_duty") {
                statusCell.classList.add("status-on_duty");
            }

            row.appendChild(statusCell);
            tableBody.appendChild(row);
        });
    } else {
        console.error("Invalid data type for table population. Expected array, got:", typeof data);
    }
}

// Helper function to create a table cell
function createCell(content) {
    const cell = document.createElement("td");
    cell.textContent = content;
    return cell;
}

// Function to show/hide the loading indicator
function showLoadingIndicator(show) {
    const loadingIndicator = document.getElementById("loadingIndicator");
    if (show) {
        loadingIndicator.classList.remove("hidden");
    } else {
        loadingIndicator.classList.add("hidden");
    }
}

// Event listener for filter button click
document.getElementById("filterAttendanceButton").addEventListener("click", filterAttendance);

// Event listener for download button click
document.getElementById("downloadBtn").addEventListener("click", function () {
    downloadCSV(attendanceData); // Call download function
});

// Event listener for print button click
document.getElementById("printBtn").addEventListener("click", function () {
    window.print(); // Print the page
});

// Function to download attendance data as CSV
function downloadCSV(data) {
    const header = ["Date", "Course", "Year", "Semester", "Student Name", "Status"];
    const rows = data.map(item => [
        item.date,
        item.course,
        item.year,
        item.semester,
        item.name,
        item.status
    ]);

    let csvContent = "data:text/csv;charset=utf-8," + header.join(",") + "\n";
    rows.forEach(row => {
        csvContent += row.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "attendance_data.csv");
    document.body.appendChild(link);
    link.click(); // Trigger download
    document.body.removeChild(link);
}

// Initialize event listeners for filter buttons
document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem('auth_token'); // Or sessionStorage.getItem('auth_token')

    // If token is not found, redirect to login page
    if (!token) {
        alert("You must be logged in first.");
        console.error("Token is missing.");
        window.location.href = 'login.html'; // Redirect to the login page
        return; // Prevent further execution
    }

    // If token is present, proceed with the rest of the page logic
    console.log("Token found. Proceeding with page logic.");
});
