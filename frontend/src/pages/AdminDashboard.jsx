import { useState, useEffect } from "react";
import axios from "axios";

function AdminDashboard() {

    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);

    const [title, setTitle] = useState("");
    const [company, setCompany] = useState("");
    const [location, setLocation] = useState("");
    const [salary, setSalary] = useState("");
    const [description, setDescription] = useState("");

    const [editingJobId, setEditingJobId] = useState(null);
    const [message, setMessage] = useState("");

    const token = localStorage.getItem("token");

    // Load all jobs
    const fetchJobs = async () => {

        try {

            const response = await axios.get(
                "http://localhost:5000/api/jobs"
            );

            setJobs(response.data);

        } catch (error) {

            setMessage("Failed to load jobs");

        }
    };

    // Load all applications
    const fetchApplications = async () => {

        try {

            const response = await axios.get(
                "http://localhost:5000/api/admin/applications",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setApplications(response.data);

        } catch (error) {

            setMessage(
                error.response?.data?.message ||
                "Failed to load applications"
            );

        }
    };

    // Update application status
const handleStatusChange = async (applicationId, newStatus) => {

    try {

        const response = await axios.put(
            `http://localhost:5000/api/admin/applications/${applicationId}/status`,
            {
                status: newStatus
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        setMessage(response.data.message);

        // Refresh application list
        fetchApplications();

    } catch (error) {

        setMessage(
            error.response?.data?.message ||
            "Failed to update status"
        );

    }
};

    useEffect(() => {
        fetchJobs();
    }, []);

    // Add or update job
    const handleSubmit = async (e) => {

        e.preventDefault();

        const jobData = {
            title,
            company,
            location,
            salary,
            description
        };

        try {

            if (editingJobId) {

                const response = await axios.put(
                    `http://localhost:5000/api/admin/jobs/${editingJobId}`,
                    jobData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                setMessage(response.data.message);

            } else {

                const response = await axios.post(
                    "http://localhost:5000/api/admin/jobs",
                    jobData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                setMessage(response.data.message);

            }

            clearForm();
            fetchJobs();

        } catch (error) {

            setMessage(
                error.response?.data?.message ||
                "Operation failed"
            );

        }
    };

    // Fill form with selected job details
    const handleEdit = (job) => {

        setEditingJobId(job.id);
        setTitle(job.title);
        setCompany(job.company);
        setLocation(job.location || "");
        setSalary(job.salary || "");
        setDescription(job.description || "");

        window.scrollTo(0, 0);
    };

    // Delete job
    const handleDelete = async (jobId) => {

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this job?"
        );

        if (!confirmDelete) {
            return;
        }

        try {

            const response = await axios.delete(
                `http://localhost:5000/api/admin/jobs/${jobId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMessage(response.data.message);
            fetchJobs();

        } catch (error) {

            setMessage(
                error.response?.data?.message ||
                "Failed to delete job"
            );

        }
    };

    // Clear form
    const clearForm = () => {

        setTitle("");
        setCompany("");
        setLocation("");
        setSalary("");
        setDescription("");
        setEditingJobId(null);

    };

    return (

        <div className="app">

            <h1>Admin Dashboard</h1>

            <h2>
                {editingJobId ? "Edit Job" : "Add New Job"}
            </h2>

            <form onSubmit={handleSubmit}>

                <input
                    type="text"
                    placeholder="Job Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />

                <input
                    type="text"
                    placeholder="Company Name"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    required
                />

                <input
                    type="text"
                    placeholder="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                />

                <input
                    type="text"
                    placeholder="Salary"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                />

                <textarea
                    placeholder="Job Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="4"
                />

                <button type="submit">
                    {editingJobId ? "Update Job" : "Add Job"}
                </button>

                {editingJobId && (
                    <button type="button" onClick={clearForm}>
                        Cancel Edit
                    </button>
                )}

            </form>

            <p>{message}</p>

            <hr />

            <h2>Manage Jobs</h2>

            <div className="job-container">

                {jobs.map(job => (

                    <div className="job-card" key={job.id}>

                        <h3>{job.title}</h3>

                        <p>Company: {job.company}</p>

                        <p>Location: {job.location}</p>

                        <p>Salary: {job.salary}</p>

                        <p>{job.description}</p>

                        <button onClick={() => handleEdit(job)}>
                            Edit
                        </button>

                        <button onClick={() => handleDelete(job.id)}>
                            Delete
                        </button>

                    </div>

                ))}

            </div>

            <hr />

            <h2>All User Applications</h2>

            <button onClick={fetchApplications}>
                View All Applications
            </button>

            {applications.map(application => (

    <div
        className="job-card"
        key={application.application_id}
    >

        <h3>{application.job_title}</h3>

        <p>Company: {application.company}</p>

        <p>Applicant: {application.user_name}</p>

        <p>Email: {application.user_email}</p>

        <p>Current Status: {application.status}</p>

        <p>
            Applied on: {
                new Date(
                    application.applied_at
                ).toLocaleDateString()
            }
        </p>

        <label>Change Application Status:</label>

        <select
            value={application.status}
            onChange={(e) =>
                handleStatusChange(
                    application.application_id,
                    e.target.value
                )
            }
        >

            <option value="Applied">Applied</option>

            <option value="Shortlisted">Shortlisted</option>

            <option value="Rejected">Rejected</option>

        </select>

    </div>

))}

        </div>

    );
}

export default AdminDashboard;