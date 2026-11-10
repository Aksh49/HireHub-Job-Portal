import { useState, useEffect } from "react";
import axios from "axios";

function MyApplications() {

    const [applications, setApplications] = useState([]);
    const [message, setMessage] = useState("");

    useEffect(() => {

        const token = localStorage.getItem("token");

        axios.get("http://localhost:5000/api/my-applications", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        .then(response => {
            setApplications(response.data);
        })
        .catch(error => {
            setMessage(
                error.response?.data?.message ||
                "Failed to load applications"
            );
        });

    }, []);

    return (
        <div className="app">

            <h1>My Applications</h1>

            <p>{message}</p>

            {applications.length === 0 && !message ? (
                <p>You haven't applied for any jobs yet.</p>
            ) : (

                <div className="job-container">

                    {applications.map(application => (

                        <div
                            className="job-card"
                            key={application.application_id}
                        >

                            <h3>{application.title}</h3>

                            <p>Company: {application.company}</p>

                            <p>Location: {application.location}</p>

                            <p>Salary: {application.salary}</p>

                            <p>
                                Status: {application.status}
                            </p>

                            <p>
                                Applied on: {
                                    new Date(
                                        application.applied_at
                                    ).toLocaleDateString()
                                }
                            </p>

                        </div>

                    ))}

                </div>

            )}

        </div>
    );
}

export default MyApplications;