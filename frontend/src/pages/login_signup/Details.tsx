import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/login_signup/Details.css";
import "../../styles/index.css";
import ParticlesBackground from "../../components/ParticlesBackground";

const Details = () => {
  const navigate = useNavigate();
  const [university, setUniversity] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Clear error when user starts typing again
  useEffect(() => {
    if (error) setError("");
  }, [university, fieldOfStudy]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    
    const email = localStorage.getItem("pendingEmail");
    if (!email) {
      setError("Signup session expired. Please try again.");
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch("http://localhost:6500/api/auth/complete-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, university, fieldOfStudy }),
      });
      
      const data = await response.json();
      if (response.ok) {
        console.log("User signed up successfully:", data);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.removeItem("pendingEmail");
        
        navigate("/dashboard");
      } else {
        setError(data.message || "Signup failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="details-container">
      <ParticlesBackground />
      <div className="details-content">
        <h1 className="details-title">Just a Few More Details!</h1>
        {error && <p className="error-message">{error}</p>}
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Select Your University"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            required
            aria-label="University"
          />
          <input
            type="text"
            placeholder="Enter Your Field of Study (Optional)"
            value={fieldOfStudy}
            onChange={(e) => setFieldOfStudy(e.target.value)}
            aria-label="Field of Study"
          />
          <button
            type="submit"
            className="details-btn"
            disabled={loading}
          >
            {loading ? "Processing..." : "Done"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Details;