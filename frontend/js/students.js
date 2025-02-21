document.addEventListener('DOMContentLoaded', function () {
    const courseSelect = document.getElementById('course');
    const yearSelect = document.getElementById('year');
    const semesterSelect = document.getElementById('semester');
    const studentTableBody = document.getElementById('student-table-body');
    const addUpdateBtn = document.getElementById('add-update-btn');
    const studentNameInput = document.getElementById('student-name');
    const courseInput = document.getElementById('course-input');
    const yearInput = document.getElementById('year-input');
    const semesterInput = document.getElementById('semester-input');
    const studentIdInput = document.getElementById('student-id');
    const filterBtn = document.getElementById('filter-btn');

    // Check if all required elements are available
    if (!courseSelect || !yearSelect || !semesterSelect || !studentTableBody || !addUpdateBtn || !studentNameInput || !courseInput || !yearInput || !semesterInput || !studentIdInput || !filterBtn) {
        console.error("One or more elements are missing in the DOM");
        return;
    }

    let selectedStudentId = null;

    // Retrieve the token from localStorage or sessionStorage
    const token = localStorage.getItem('auth_token'); // or sessionStorage.getItem('authToken');
    
    // Check if the token is missing
    if (!token) {
        alert('Please log in first.');
        window.location.href = 'login.html'; // Redirect to login if no token is found
        return;
    }

    // Fetch and display students based on selected filters
    function fetchStudents() {
        const course = courseSelect.value;
        const year = yearSelect.value;
        const semester = semesterSelect.value;

        if (!course || !year || !semester) {
            studentTableBody.innerHTML = `<tr><td colspan="5">Please select all filters.</td></tr>`;
            return;
        }

        fetch(`https://aaasc-attendance.onrender.com/get_students?course=${encodeURIComponent(course)}&year=${encodeURIComponent(year)}&semester=${encodeURIComponent(semester)}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayStudents(data.students);
            } else {
                studentTableBody.innerHTML = `<tr><td colspan="5">${data.message}</td></tr>`;
            }
        })
        .catch(error => {
            console.error('Error fetching students:', error);
            studentTableBody.innerHTML = `<tr><td colspan="5">Error loading student data.</td></tr>`;
        });
    }

    // Display students in the table
    function displayStudents(students) {
        studentTableBody.innerHTML = '';

        students.forEach(student => {
            const row = document.createElement('tr');

            const studentNameCell = document.createElement('td');
            studentNameCell.textContent = student.name;
            row.appendChild(studentNameCell);

            const courseCell = document.createElement('td');
            courseCell.textContent = student.course;
            row.appendChild(courseCell);

            const yearCell = document.createElement('td');
            yearCell.textContent = student.year;
            row.appendChild(yearCell);

            const semesterCell = document.createElement('td');
            semesterCell.textContent = student.semester;
            row.appendChild(semesterCell);

            const actionsCell = document.createElement('td');
            const updateBtn = document.createElement('button');
            updateBtn.textContent = 'Update';
            updateBtn.className = 'update-btn';
            updateBtn.onclick = () => populateStudentForm(student);
            actionsCell.appendChild(updateBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'delete-btn';
            deleteBtn.onclick = () => deleteStudent(student.id);
            actionsCell.appendChild(deleteBtn);

            row.appendChild(actionsCell);

            studentTableBody.appendChild(row);
        });
    }

    // Populate the form for updating a student
    function populateStudentForm(student) {
        selectedStudentId = student.id;
        studentNameInput.value = student.name;
        courseInput.value = student.course;
        yearInput.value = student.year;
        semesterInput.value = student.semester;
        addUpdateBtn.textContent = 'Update Student';
    }

    // Add or Update a student
    addUpdateBtn.addEventListener('click', function (event) {
        event.preventDefault();

        const name = studentNameInput.value.trim();
        const course = courseInput.value.trim();
        const year = yearInput.value.trim();
        const semester = semesterInput.value.trim();

        if (!name || !course || !year || !semester) {
            alert('Please fill all fields.');
            return;
        }

        const studentData = { name, course, year, semester };
        const method = selectedStudentId ? 'PUT' : 'POST';
        const url = selectedStudentId ? `https://aaasc-attendance.onrender.com/update_student?id=${selectedStudentId}` : 'https://aaasc-attendance.onrender.com/add_student';

        if (selectedStudentId) {
            studentData.id = selectedStudentId;
        }

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(studentData),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(selectedStudentId ? 'Student updated successfully' : 'Student added successfully');
                resetForm();
                fetchStudents();
            } else {
                alert(data.message || 'Error during operation.');
            }
        })
        .catch(error => {
            console.error(`Error during ${method}:`, error);
            alert('An error occurred.');
        });
    });

    // Delete student
    function deleteStudent(studentId) {
        if (confirm('Are you sure you want to delete this student?')) {
            fetch(`https://aaasc-attendance.onrender.com/delete_student?id=${studentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Student deleted successfully');
                    fetchStudents();
                } else {
                    alert(data.message || 'Error deleting student.');
                }
            })
            .catch(error => {
                console.error('Error deleting student:', error);
                alert('An error occurred.');
            });
        }
    }

    // Reset the form after add/update
    function resetForm() {
        studentNameInput.value = '';
        courseInput.value = '';
        yearInput.value = '';
        semesterInput.value = '';
        selectedStudentId = null;
        addUpdateBtn.textContent = 'Add Student';
    }

    // Fetch students on Filter button click
    filterBtn.addEventListener('click', function (event) {
        event.preventDefault();
        fetchStudents();
    });

    // Initial fetch to display students
    fetchStudents();
});
