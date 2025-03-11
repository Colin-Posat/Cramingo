import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/login_signup/Details.css";
import "../../styles/index.css";
import ParticlesBackground from "../../components/ParticlesBackground";

const Details = () => {
  const navigate = useNavigate();
  const [university, setUniversity] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const email = localStorage.getItem("pendingEmail"); // ✅ Retrieve stored email
    if (!email) {
      setError("Signup session expired. Please try again.");
      return;
    }

    try {
      const response = await fetch("http://localhost:6500/api/auth/complete-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, university, fieldOfStudy }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log("User signed up successfully:", data);
        localStorage.setItem("user", JSON.stringify(data.user)); // ✅ Store final user data
        localStorage.removeItem("pendingEmail"); // ✅ Cleanup

        navigate("/dashboard"); // ✅ Redirect after signup completion
      } else {
        setError(data.message || "Signup failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Something went wrong. Try again.");
    }
  };

  return (
    <div className="details-container">
      <ParticlesBackground />
      <div className="details-content">
        <h1 className="details-title">Just a Few More Details!</h1>
        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Select Your University" value={university} onChange={(e) => setUniversity(e.target.value)} required />
          <input type="text" placeholder="Enter Your Field of Study (Optional)" value={fieldOfStudy} onChange={(e) => setFieldOfStudy(e.target.value)} />
          <button type="submit" className="details-btn">Done</button>
        </form>

        <img src="/images/fliply_logo.png" alt="Fliply Logo" className="details-logo" />
      </div>
    </div>
  );
};

export default Details;
