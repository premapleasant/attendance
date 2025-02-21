const express = require("express");
const mysql = require("mysql2");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const cors = require("cors");
const logger = require("morgan");

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Enable CORS for trusted domains
app.use(cors());
app.use(express.json());
app.use(logger("dev"));

// Secret key for JWT
const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) {
  console.error("SECRET_KEY not set in the environment variables!");
}

// Database Configuration - MySQL
const db = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT,
  ssl: { rejectUnauthorized: false}, // Aiven requires SSL
  connectTimeout: 10000,
});
db.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
  } else {
    console.log("Connected to MySQL database");
  }
});

function generateToken(department, expiresIn = "1h") {
  return jwt.sign({ department }, SECRET_KEY, {
    expiresIn,
    algorithm: "HS256",
  });
}


function validateToken(req, res) {
  const token = req.headers["authorization"];
  if (!token || !token.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authorization token is missing or invalid.",
    });
  }

  try {
    const decodedToken = jwt.verify(token.split(" ")[1], SECRET_KEY, {
      algorithms: ["HS256"],
    });
    const department = decodedToken.department;
    if (!department) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized access." });
    }
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid token. Please log in again." });
  }
  return true;
}
app.get('/api/health-check', (req, res) => {
  res.status(200).json({ message: 'Server is running and warmed up!' });
});
// Login endpoint
app.post("/login",async (req, res) => {
  const { department, password } = req.body;

 const results = await new Promise((resolve, reject) => {
  db.query(
    "SELECT department_password FROM departments WHERE department_name = ?",
    [department],

    (err, result) => {
      if (err) {
        reject(err);
        console.error("Error during login:", err);
        return res.status(400).json({
          success: false,
          message: "An error occurred during login.",
        });
      }
      resolve(result);
      console.log("Resolved")
    }
  )});
      if(results.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Invalid department or password.",
        });
      }
      const storedHash = results[0].department_password;
      const isPasswordValid = bcrypt.compareSync(password, storedHash);
    

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid department or password.",
        });
      }

      // Generate a token (assuming you have a `generateToken` function)
      const token = generateToken(department);

      // Return success response
      res.status(200).json({
        success: true,
        message: "Login successful!",
        token,
      });
    }
  );



// Admin login endpoint
app.post("/admin_login", (req, res) => {
  const { username, password } = req.body;
  // Retrieve the stored hash from the database
   db.query(
    "SELECT hashed_password FROM admin WHERE username = ?",
    [username],
    (err, results) => {
      if (err) {
        console.error("Error during admin login:", err);
        return res.status(500).json({
          success: false,
          message: "An error occurred during admin login.",
        });
      }

      // Check if the admin exists
      if (results.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Invalid username or password.",
        });
      }

      // Compare the provided password with the stored hash
      const storedHash = results[0].hashed_password;
      const isPasswordValid = bcrypt.compareSync(password, storedHash);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid username or password.",
        });
      }

      // Generate a token
      const token = jwt.sign(
        {
          username: username,
          role: "admin",
        },
        SECRET_KEY,
        { expiresIn: "1hr", algorithm: "HS256" }
      );

      // Return success response
      res.status(200).json({ success: true, token });
    }
  );
});
// Update department password route (Admin access only)
app.post("/update_department_password", (req, res) => {
  const token = req.headers["authorization"];
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Token is missing!" });
  }

  // Verify the token
  try {
    const decodedToken = jwt.verify(token, SECRET_KEY, {
      algorithms: ["HS256"],
    });
    if (decodedToken.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access. Admin role required.",
      });
    }
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token!" });
  }

  const { department, new_password } = req.body;

  // Hash the new password
  const hashed_password = bcrypt.hashSync(new_password, 10);

  // Update the department password in the database
  db.query(
    "UPDATE departments SET department_password = ? WHERE department_name = ?",
    [hashed_password, department],
    (err, results) => {
      if (err) {
        console.error("Error updating department password:", err);
        return res.status(500).json({
          success: false,
          message: "An error occurred while updating the password.",
        });
      }
      console.log(results);
      // Check if the department exists
      if (results.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Department not found.",
        });
      }

      // Return success response
      res.status(200).json({
        success: true,
        message: "Password updated successfully!",
      });
    }
  );
});

app.get("/students" , (req , res)=>{
  db.query("SELECT * FROM students" , (err , results)=>{
    if(err){
      console.log(err)
    }
    else{
      res.send(results)
    }
  })
})

// Route to fetch students based on course, year, and semester
app.get("/get_students", (req, res) => {
  if (validateToken(req, res)) {
    const { course, year, semester } = req.query;

    db.query(
      "SELECT id, name, course, year, semester FROM students WHERE course = ? AND year = ? AND semester = ?",
      [course, year, semester],
      (err, results) => {
        if (err) {
          console.error("Error fetching students:", err);
          return res.status(500).json({
            success: false,
            message: "Error occurred while fetching students.",
          });
        }

        if (results.length === 0) {
          return res
            .status(404)
            .json({ success: false, message: "No students found." });
        }
        const studentList = results.map((student) => ({
          id: student.id,
          name: student.name,
          course: student.course,
          year: student.year,
          semester: student.semester,
        }));

        res.status(200).json({ success: true, students: studentList });
      }
    );
  }
});
// Route to view attendance
app.get("/view_attendance", (req, res) => {
  if (validateToken(req, res)) {
    const { date, course, year, semester } = req.query;

    const query = `
            SELECT date, course, year, semester, name, status
            FROM attendance
            WHERE date = ? AND course = ? AND year = ? AND semester = ?
        `;

    db.query(query, [date, course, year, semester], (err, results) => {
      if (err) {
        console.error("Error during attendance retrieval:", err);
        return res.status(500).json({
          success: false,
          message: "An error occurred while fetching attendance records.",
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No attendance records found for the given filters.",
        });
      }

      const attendanceData = results.map((record) => ({
        date: record.date,
        course: record.course,
        year: record.year,
        semester: record.semester,
        name: record.name,
        status: record.status,
      }));

      res.status(200).json({ success: true, attendance: attendanceData });
    });
  }
});
// Route to view summary of attendance
app.get("/view_summary", (req, res) => {
  if (validateToken(req, res)) {
    const { start_date, end_date, course, year, semester } = req.query;

    const query = `
        SELECT name, year, semester, 
               SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present_days,
               SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) AS absent_days,
               SUM(CASE WHEN status = 'on_duty' THEN 1 ELSE 0 END) AS on_duty_days
        FROM attendance
        WHERE course = ? 
          AND year = ? 
          AND semester = ? 
          AND date BETWEEN ? AND ?
        GROUP BY name, year, semester
    `;

    db.query(
      query,
      [course, year, semester, start_date, end_date],
      (err, results) => {
        if (err) {
          console.error("Error during attendance summary retrieval:", err);
          return res.status(500).json({
            success: false,
            message: "An error occurred while fetching attendance summary.",
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            success: false,
            message: "No attendance records found for the given filters.",
          });
        }

        const summaryData = results.map((result) => ({
          name: result.name,
          year: result.year,
          semester: result.semester,
          start_date,
          end_date,
          present_days: result.present_days,
          absent_days: result.absent_days,
          on_duty_days: result.on_duty_days,
        }));

        res.status(200).json({ success: true, summary: summaryData });
      }
    );
  }
});

// Route to add a student to the database
app.post("/add_student", (req, res) => {
  if (validateToken(req, res)) {
    const { name, course, year, semester } = req.body;

    db.query(
      "INSERT INTO students (name, course, year, semester) VALUES (?, ?, ?, ?)",
      [name, course, year, semester],
      (err, results) => {
        if (err) {
          console.error("Error during student addition:", err);
          return res.status(500).json({
            success: false,
            message: "An error occurred while adding the student.",
          });
        }

        res
          .status(201)
          .json({ success: true, message: "Student added successfully" });
      }
    );
  }
});

// Route to update a student in the database
app.put("/update_student", (req, res) => {
  if (validateToken(req, res)) {
    const { id, name, course, year, semester } = req.body;

    db.query(
      "UPDATE students SET name = ?, course = ?, year = ?, semester = ? WHERE id = ?",
      [name, course, year, semester, id],
      (err, results) => {
        if (err) {
          console.error("Error during student update:", err);
          return res.status(500).json({
            success: false,
            message: "An error occurred while updating the student.",
          });
        }

        res
          .status(200)
          .json({ success: true, message: "Student updated successfully" });
      }
    );
  }
});

// Route to delete a student from the database
app.delete("/delete_student", (req, res) => {
  if (validateToken(req, res)) {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required for deletion.",
      });
    }

    // Delete associated attendance records first
    db.query(
      "DELETE FROM attendance WHERE student_id = ?",
      [id],
      (err, results) => {
        if (err) {
          console.error("Error during attendance records deletion:", err);
          return res.status(500).json({
            success: false,
            message:
              "An error occurred while deleting associated attendance records.",
          });
        }

        // Now delete the student
        db.query("DELETE FROM students WHERE id = ?", [id], (err, results) => {
          if (err) {
            console.error("Error during student deletion:", err);
            return res.status(500).json({
              success: false,
              message: "An error occurred while deleting the student.",
            });
          }

          res.status(200).json({
            success: true,
            message:
              "Student and associated attendance records deleted successfully.",
          });
        });
      }
    );
  }
});
// Route to submit attendance
app.post("/submit_attendance", (req, res) => {
  if (validateToken(req, res)) {
    const { date, course, year, semester, students } = req.body;

    // Validate students data
    if (!Array.isArray(students)) {
      return res.status(400).json({
        success: false,
        message: "Students data should be an array of student objects.",
      });
    }

    // Check if attendance records already exist for the given date, course, year, and semester
    db.query(
      "SELECT * FROM attendance WHERE date = ? AND course = ? AND year = ? AND semester = ?",
      [date, course, year, semester],
      (err, results) => {
        if (err) {
          console.error("Error during attendance submission:", err);
          return res.status(500).json({
            success: false,
            message: "An error occurred while submitting attendance.",
          });
        }

        // If records exist, delete them
        if (results.length > 0) {
          db.query(
            "DELETE FROM attendance WHERE date = ? AND course = ? AND year = ? AND semester = ?",
            [date, course, year, semester],
            (err) => {
              if (err) {
                console.error(
                  "Error deleting existing attendance records:",
                  err
                );
                return res.status(500).json({
                  success: false,
                  message: "An error occurred while submitting attendance.",
                });
              }
            }
          );
        }

        // Process each student and insert attendance records
        let studentsProcessed = 0;
        let errorsOccurred = false;

        students.forEach((student) => {
          db.query(
            "SELECT * FROM students WHERE name = ? AND course = ? AND year = ? AND semester = ?",
            [student.name, course, year, semester],
            (err, results) => {
              if (err) {
                console.error("Error fetching student record:", err);
                errorsOccurred = true;
                return res.status(500).json({
                  success: false,
                  message: "An error occurred while submitting attendance.",
                });
              }

              if (results.length > 0) {
                const student_id = results[0].id;
                db.query(
                  "INSERT INTO attendance (student_id, date, course, year, semester, status, name) VALUES (?, ?, ?, ?, ?, ?, ?)",
                  [
                    student_id,
                    date,
                    course,
                    year,
                    semester,
                    student.status,
                    student.name, // Include the name field
                  ],
                  (err) => {
                    if (err) {
                      console.error("Error inserting attendance record:", err);
                      errorsOccurred = true;
                      return res.status(500).json({
                        success: false,
                        message:
                          "An error occurred while submitting attendance.",
                      });
                    }
                  }
                );
              } else {
                console.warn(`Student not found: ${student.name}`);
              }

              studentsProcessed++;

              // If all students are processed, send the response
              if (studentsProcessed === students.length) {
                if (errorsOccurred) {
                  return res.status(500).json({
                    success: false,
                    message: "An error occurred while submitting attendance.",
                  });
                }

                res.status(200).json({
                  success: true,
                  message: "Attendance submitted successfully.",
                });
              }
            }
          );
        });
      }
    );
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
