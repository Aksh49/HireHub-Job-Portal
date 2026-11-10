const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const express = require("express");
const cors = require("cors");

const app = express();

// Import database connection
const db = require("./config/db");

const {
    verifyToken,
    verifyAdmin
} = require("./middleware/auth");

// Middleware
app.use(cors());
app.use(express.json());

// Test API
app.get("/", (req, res) => {
    res.send("HireHub Backend is Running!");
});

// Get all jobs
app.get("/api/jobs", (req, res) => {

    const sql = "SELECT * FROM jobs";

    db.query(sql, (err, result) => {

        if (err) {
            return res.status(500).json({
                message: "Database error"
            });
        }

        res.json(result);
    });

});

// User Registration
app.post("/api/register", async (req, res) => {

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
    return res.status(400).json({
        message: "All fields are required"
    });
    }

    try {

        // Check if user already exists
        const sql = "SELECT * FROM users WHERE email = ?";

        db.query(sql, [email], async (err, result) => {

            if (err) {
                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (result.length > 0) {
                return res.status(400).json({
                    message: "Email already registered"
                });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert new user
            const insertSql =
                "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

            db.query(
                insertSql,
                [name, email, hashedPassword],
                (err, result) => {

                    if (err) {
                        return res.status(500).json({
                            message: "Registration failed"
                        });
                    }

                    res.status(201).json({
                        message: "Registration successful"
                    });

                }
            );

        });

    } catch (error) {

        res.status(500).json({
            message: "Server error"
        });

    }

});

// User Login
app.post("/api/login", (req, res) => {

    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    // Find user by email
    const sql = "SELECT * FROM users WHERE email = ?";

    db.query(sql, [email], async (err, result) => {

        if (err) {
            return res.status(500).json({
                message: "Database error"
            });
        }

        // User not found
        if (result.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = result[0];

        // Compare entered password with stored hash
        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        // Send token and user details
        res.json({
            message: "Login successful",
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    });

});

// Apply for a job
app.post("/api/applications", verifyToken, (req, res) => {

    const userId = req.user.id;
    const { jobId } = req.body;

    if (!jobId) {
        return res.status(400).json({
            message: "Job ID is required"
        });
    }

    const sql = `
        INSERT INTO applications (user_id, job_id)
        VALUES (?, ?)
    `;

    db.query(sql, [userId, jobId], (err, result) => {

        if (err) {

            if (err.code === "ER_DUP_ENTRY") {
                return res.status(400).json({
                    message: "You have already applied for this job"
                });
            }

            if (err.code === "ER_NO_REFERENCED_ROW_2") {
                return res.status(404).json({
                    message: "Job not found"
                });
            }

            return res.status(500).json({
                message: "Application failed"
            });
        }

        res.status(201).json({
            message: "Application submitted successfully"
        });

    });

});

// Get applications of the logged-in user
app.get("/api/my-applications", verifyToken, (req, res) => {

    const userId = req.user.id;

    const sql = `
        SELECT
            applications.id AS application_id,
            applications.applied_at,
            applications.status,
            jobs.id AS job_id,
            jobs.title,
            jobs.company,
            jobs.location,
            jobs.salary
        FROM applications
        JOIN jobs ON applications.job_id = jobs.id
        WHERE applications.user_id = ?
        ORDER BY applications.applied_at DESC
    `;

    db.query(sql, [userId], (err, result) => {

        if (err) {
            return res.status(500).json({
                message: "Database error"
            });
        }

        res.json(result);

    });

});

// Admin: Add a new job
app.post("/api/admin/jobs", verifyToken, verifyAdmin, (req, res) => {

    const {
        title,
        company,
        location,
        salary,
        description
    } = req.body;

    if (!title || !company) {
        return res.status(400).json({
            message: "Job title and company are required"
        });
    }

    const sql = `
        INSERT INTO jobs (title, company, location, salary, description)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [title, company, location, salary, description],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    message: "Failed to add job"
                });
            }

            res.status(201).json({
                message: "Job added successfully",
                jobId: result.insertId
            });

        }
    );

});

// Admin: Edit an existing job
app.put("/api/admin/jobs/:id", verifyToken, verifyAdmin, (req, res) => {

    const jobId = req.params.id;

    const {
        title,
        company,
        location,
        salary,
        description
    } = req.body;

    if (!title || !company) {
        return res.status(400).json({
            message: "Job title and company are required"
        });
    }

    const sql = `
        UPDATE jobs
        SET title = ?, company = ?, location = ?,
            salary = ?, description = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [title, company, location, salary, description, jobId],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    message: "Failed to update job"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Job not found"
                });
            }

            res.json({
                message: "Job updated successfully"
            });

        }
    );

});

// Admin: Delete a job
app.delete("/api/admin/jobs/:id", verifyToken, verifyAdmin, (req, res) => {

    const jobId = req.params.id;

    const sql = "DELETE FROM jobs WHERE id = ?";

    db.query(sql, [jobId], (err, result) => {

        if (err) {

            if (err.code === "ER_ROW_IS_REFERENCED_2") {
                return res.status(400).json({
                    message: "Cannot delete this job because users have applied for it"
                });
            }

            return res.status(500).json({
                message: "Failed to delete job"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Job not found"
            });
        }

        res.json({
            message: "Job deleted successfully"
        });

    });

});

// Admin: View all user applications
app.get("/api/admin/applications", verifyToken, verifyAdmin, (req, res) => {

    const sql = `
        SELECT
            applications.id AS application_id,
            applications.applied_at,
            applications.status,
            users.name AS user_name,
            users.email AS user_email,
            jobs.title AS job_title,
            jobs.company
        FROM applications
        JOIN users ON applications.user_id = users.id
        JOIN jobs ON applications.job_id = jobs.id
        ORDER BY applications.applied_at DESC
    `;

    db.query(sql, (err, result) => {

        if (err) {
            return res.status(500).json({
                message: "Database error"
            });
        }

        res.json(result);

    });

});

// Admin: Update application status
app.put(
    "/api/admin/applications/:id/status",
    verifyToken,
    verifyAdmin,
    (req, res) => {

        const applicationId = req.params.id;
        const { status } = req.body;

        // Check valid status
        const allowedStatuses = [
            "Applied",
            "Shortlisted",
            "Rejected"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid application status"
            });
        }

        const sql = `
            UPDATE applications
            SET status = ?
            WHERE id = ?
        `;

        db.query(
            sql,
            [status, applicationId],
            (err, result) => {

                if (err) {
                    return res.status(500).json({
                        message: "Failed to update application status"
                    });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({
                        message: "Application not found"
                    });
                }

                res.json({
                    message: "Application status updated successfully"
                });

            }
        );

    }
);

// Start server
const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
