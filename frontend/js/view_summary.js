let summaryData = [];  // Declare global variable

document.addEventListener("DOMContentLoaded", function () {
    // Adding event listener for filter button click
    const filterButton = document.getElementById("filterAttendanceButton");
    if (filterButton) {
        filterButton.addEventListener("click", filterSummary);
    } else {
        console.error('Element with ID "filterAttendanceButton" not found!');
    }

    const token = localStorage.getItem('auth_token'); // or sessionStorage.getItem('authToken');
    
    // Check if the token is missing
    if (!token) {
        alert('Please log in first.');
        window.location.href = 'login.html'; // Redirect to login if no token is found
        return;
    }

    // Adding event listener for download button click
    const downloadButton = document.getElementById("downloadSummaryBtn");
    if (downloadButton) {
        downloadButton.addEventListener("click", function () {
            if (summaryData.length === 0) {
                alert("No data available to download.");
            } else {
                downloadCSV(summaryData); // Call download function for summary data
            }
        });
    } else {
        console.error('Element with ID "downloadSummaryBtn" not found!');
    }

    // Adding event listener for print button click
    const printButton = document.getElementById("printSummaryBtn");
    if (printButton) {
        printButton.addEventListener("click", function () {
            window.print(); // Print the summary page
        });
    } else {
        console.error('Element with ID "printSummaryBtn" not found!');
    }

    console.log("Page loaded. Initializing summary view...");
});

// Function to filter and summarize attendance data
function filterSummary() {
    console.log("Filtering summary data...");

    const fromDate = document.getElementById('fromDate').value.trim();
    const toDate = document.getElementById('toDate').value.trim();
    const course = document.getElementById('course').value.trim();
    const year = document.getElementById('year').value.trim();
    const semester = document.getElementById('semester').value.trim();

    // Debug: log the filter criteria
    console.log("Filter criteria:");
    console.log(`From Date: ${fromDate}, To Date: ${toDate}, Course: ${course}, Year: ${year}, Semester: ${semester}`);

    if (!fromDate || !toDate || !course || !year || !semester) {
        alert("Please fill in all the filter fields.");
        return;
    }

    // Show loading indicator
    showLoadingIndicator(true);

    // Get token from localStorage or sessionStorage
    const token = localStorage.getItem('auth_token'); // Corrected key for token
    console.log("Token fetched from localStorage:", token); // Debugging token fetch
    if (!token) {
        alert("You are not logged in. Please log in again.");
        console.log("No token found in localStorage.");
        return;
    }

    // Fetch summary data from the backend
    fetch(`https://aaasc-attendance.onrender.com/view_summary?course=${course}&year=${year}&semester=${semester}&start_date=${fromDate}&end_date=${toDate}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,  // Add token to Authorization header
        }
    })
        .then(response => response.json())
        .then(data => {
            console.log("Fetched summary data:", data);  // Debug: log the response data
            if (data.success) {
                summaryData = data.summary; // Store the data in the global variable
                populateSummaryTable(summaryData); // Populate table with the summary data
            } else {
                alert("No summary records found.");
                console.error("Error fetching summary:", data.message);
                populateSummaryTable([]); // Clear table if no data
            }
            // Hide loading indicator
            showLoadingIndicator(false);
        })
        .catch(error => {
            console.error("Error fetching summary data:", error);
            alert("Error fetching data. Please try again.");
            showLoadingIndicator(false);
        });
}

// Function to populate the summary table
function populateSummaryTable(data) {
    console.log("Populating summary table...");
    const tableBody = document.querySelector("#summary-table tbody");

    if (!tableBody) {
        console.error("Summary table body not found!");
        return;
    }

    tableBody.innerHTML = ""; // Clear existing table data

    if (data.length === 0) {
        console.warn("No summary data to populate.");
        const noDataRow = document.createElement("tr");
        const noDataCell = document.createElement("td");
        noDataCell.colSpan = 6; // Updated colspan to 8
        noDataCell.textContent = "No summary records found.";
        noDataRow.appendChild(noDataCell);
        tableBody.appendChild(noDataRow);
    } else {
        data.forEach(item => {
            const row = document.createElement("tr");

            // Calculate Total Days as the sum of Present Days and On Duty Days
            const totalDays =  +(item.present_days )+ +( item.on_duty_days)

            // Add cells for each column
            row.appendChild(createCell(item.name));
            // row.appendChild(createCell(item.year));  // Display Year
            // row.appendChild(createCell(item.semester));  // Display Semester

            // Display the date range in the Date column (start_date - end_date)
            const dateRange = item.start_date && item.end_date ? `${item.start_date} - ${item.end_date}` : "N/A";
            row.appendChild(createCell(dateRange));  // Date range column

            row.appendChild(createCell(item.present_days));
            row.appendChild(createCell(item.absent_days));
            row.appendChild(createCell(item.on_duty_days));
            row.appendChild(createCell(totalDays));  // Adding Total Days column

            tableBody.appendChild(row);
        });
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

// Function to download summary data as CSV
function downloadCSV(data) {
    if (data.length === 0) {
        alert("No data to download.");
        return;
    }

    const header = ["Student Name", "Year", "Semester", "Date", "Present Days", "Absent Days", "On Duty Days", "Total Days"];
    const rows = data.map(item => [
        item.name,
        item.year,
        item.semester,
        item.start_date && item.end_date ? `${item.start_date} - ${item.end_date}` : "N/A",
        item.present_days,
        item.absent_days,
        item.on_duty_days,
        Number(item.present_days) + Number(item.on_duty_days )// Total Days calculation
    ]);

    let csvContent = "data:text/csv;charset=utf-8," + header.join(",") + "\n";
    rows.forEach(row => {
        csvContent += row.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "attendance_summary.csv");
    document.body.appendChild(link);
    link.click(); // Trigger download
    document.body.removeChild(link);
}
