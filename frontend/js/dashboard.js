document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        alert('Unauthorized access. Please log in.');
        window.location.href = 'login.html';
        return;
    }

    // Hamburger Menu Toggle
    const hamburger = document.getElementById('hamburger');
    const menuLinks = document.getElementById('menuLinks');

    if (hamburger && menuLinks) {
        hamburger.addEventListener('click', () => {
            menuLinks.classList.toggle('active');
        });
    }

    const studentTableBody = document.getElementById('studentTableBody');
    const showStudentsButton = document.getElementById('showStudentsButton');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const submitAttendanceButton = document.getElementById('submitAttendanceButton');
    const attendanceDate = document.getElementById('attendanceDate');

    // Set today's date as the default for attendance
    const today = new Date().toISOString().split('T')[0];
    if (attendanceDate) {
        attendanceDate.setAttribute('max', today);
        attendanceDate.value = today;
    }

    const showLoading = (isLoading) => {
        if (loadingIndicator) {
            loadingIndicator.style.display = isLoading ? 'block' : 'none';
        }
    };

    if (showStudentsButton) {
        showStudentsButton.addEventListener('click', () => {
            const course = document.getElementById('course').value.trim().toLowerCase();
            const year = document.getElementById('year').value.trim().toLowerCase();
            const semester = document.getElementById('semester').value.trim().toLowerCase();

            if (!course || !year || !semester) {
                studentTableBody.innerHTML = `
                    <tr>
                        <td colspan="3">Please select a valid course, year, and semester.</td>
                    </tr>
                `;
                return;
            }

            studentTableBody.innerHTML = ''; // Clear previous data
            showLoading(true);

            const backendURL = `https://attendance-prema.onrender.com/get_students?course=${encodeURIComponent(course)}&year=${encodeURIComponent(year)}&semester=${encodeURIComponent(semester)}`;
            console.log(backendURL);
            fetch(backendURL, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(response => {
                    if (response.status === 404) {
                        return { success: false, message: 'No students found.' }; // Handle 'no students' gracefully
                    }
                    if (!response.ok) {
                        throw new Error(`Server responded with status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success === false && data.message === 'No students found.') {
                        studentTableBody.innerHTML = ''; // Clear previous content
                        const row = document.createElement('tr');
                        const noDataCell = document.createElement('td');
                        noDataCell.textContent = "No students found for the selected course, year, and semester.";
                        noDataCell.setAttribute('colspan', 3); // Adjust colspan for table structure
                        row.appendChild(noDataCell);
                        studentTableBody.appendChild(row);
                        return;
                    }
                    if (data.students && data.students.length > 0) {
                        studentTableBody.innerHTML = ''; // Clear previous content
                        data.students.forEach((student, index) => {
                            const row = createStudentRow(student, index + 1); // Pass index for serial number
                            studentTableBody.appendChild(row);
                        });
                    }
                })
                .catch(error => {
                    console.error('Error fetching students:', error);
                    studentTableBody.innerHTML = ''; // Clear previous content
                    const row = document.createElement('tr');
                    const errorCell = document.createElement('td');
                    errorCell.textContent = "An error occurred while fetching student data. Please try again later.";
                    errorCell.setAttribute('colspan', 3);
                    row.appendChild(errorCell);
                    studentTableBody.appendChild(row);
                });
        });
    }

    if (submitAttendanceButton) {
        submitAttendanceButton.addEventListener('click', () => {
            const attendanceRows = studentTableBody.querySelectorAll('tr');
            if (attendanceRows.length === 0) {
                alert('No students to submit attendance for. Please select a class.');
                return;
            }

            const attendanceData = [];
            const date = attendanceDate.value;
            const course = document.getElementById('course').value.trim().toLowerCase();
            const year = document.getElementById('year').value.trim().toLowerCase();
            const semester = document.getElementById('semester').value.trim().toLowerCase();

            attendanceRows.forEach(row => {
                const select = row.querySelector('select');
                const studentName = row.querySelectorAll('td')[1].textContent; // Adjust for S.No column

                if (select) {
                    const status = select.value;
                    console.log(status);
                    attendanceData.push({
                        name: studentName,
                        status: status
                    });
                }
            });

            const backendSubmitURL = 'https://attendance-prema.onrender.com/submit_attendance';
            showLoading(true);

            fetch(backendSubmitURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    date: date,
                    course: course,
                    year: year,
                    semester: semester,
                    students: attendanceData
                }),
            })
                .then(response => {
                    showLoading(false);
                    if (!response.ok) {
                        throw new Error(`Server responded with status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    const summary = attendanceData.reduce(
                        (acc, student) => {
                            acc[student.status]++;
                            return acc;
                        },
                        { present: 0, absent: 0, on_duty: 0 }
                    );

                    alert(`Attendance submitted successfully!\nPresent: ${summary.present}, Absent: ${summary.absent}, On Duty: ${summary.on_duty}`);
                })
                .catch(error => {
                    alert('Error saving the attendance. Please try again later.');
                    console.error('Error submitting attendance:', error);
                });
        });
    }

    function createStudentRow(student, serialNumber) {
        const row = document.createElement('tr');

        const serialNumberCell = document.createElement('td');
        serialNumberCell.textContent = serialNumber;
        row.appendChild(serialNumberCell);
        

        const nameCell = document.createElement('td');
        nameCell.textContent = student.name;
        row.appendChild(nameCell);

        const statusCell = document.createElement('td');
        const select = document.createElement('select');
        select.innerHTML = `
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="on_duty">On Duty</option>
        `;
        statusCell.appendChild(select);
        row.appendChild(statusCell);

        return row;
    }
});
