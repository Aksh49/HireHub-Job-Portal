import AdminDashboard from "./pages/AdminDashboard";
import MyApplications from "./pages/MyApplications";
import {
    BrowserRouter,
    Routes,
    Route,
    Link,
    Navigate
} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {

    const [jobs, setJobs] = useState([]);
    const [search, setSearch] = useState("");
    const [applicationMessage, setApplicationMessage] = useState("");
    const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user"))
    );

    useEffect(() => {

        axios.get("http://localhost:5000/api/jobs")
            .then(response => {
                setJobs(response.data);
            })
            .catch(error => {
                console.log(error);
            });

    }, []);

    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(search.toLowerCase())
    );

    const handleApply = async (jobId) => {

    const token = localStorage.getItem("token");

    // Check whether user is logged in
    if (!token) {
        setApplicationMessage("Please login first");
        return;
    }

    try {

        const response = await axios.post(
            "http://localhost:5000/api/applications",
            {
                jobId: jobId
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        setApplicationMessage(response.data.message);

    } catch (error) {

        setApplicationMessage(
            error.response?.data?.message || "Application failed"
        );

    }
};

     return (
        <BrowserRouter>
        <nav className="navbar">

    <Link to="/" className="logo">
        <h2>HireHub</h2>
    </Link>

    <span>Find your dream job</span>

    <div>

        {user ? (

            <>
                <span>Welcome, {user.name}</span>

                <Link to="/my-applications"> My Applications </Link>

                {user.role === "admin" && ( <Link to="/admin"> Admin Dashboard </Link> )}

                <button
                    onClick={() => {
                        localStorage.removeItem("token");
                        localStorage.removeItem("user");
                        setUser(null);
                    }}
                >
                    Logout
                </button>
            </>

        ) : (

            <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
            </>

        )}

    </div>

</nav>

    <Routes>

        <Route
            path="/"
            element={
                <div className="app">

                    <section className="hero">

                        <h1>Find Your Next Opportunity</h1>

                        <p>
                            Discover jobs that match your skills and career goals.
                        </p>

                        <input
                            type="text"
                            placeholder="Search jobs by title..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />

                    </section>

                    <section className="jobs-section">

                        <h2>Available Jobs</h2>
                        <p>{applicationMessage}</p>

                        <div className="job-container">

                            {filteredJobs.map(job => (

                                <div className="job-card" key={job.id}>

                                    <h3>{job.title}</h3>

                                    <p>{job.company}</p>

                                    <p>Location: {job.location}</p>

                                    <p>Salary: {job.salary}</p>

                                    <p>{job.description}</p>

                                    <button onClick={() => handleApply(job.id)}> Apply Now </button>

                                </div>

                            ))}

                        </div>

                    </section>

                </div>
            }
        />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/my-applications" element={<MyApplications />}/>

        <Route path="/admin" element={ user?.role === "admin" ? <AdminDashboard /> : <Navigate to="/" /> }/>

    </Routes>

</BrowserRouter>
    );
}

export default App;
