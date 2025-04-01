import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ParticlesBackground from "../../components/ParticlesBackground";

const Details: React.FC = () => {
  const navigate = useNavigate();
  const [university, setUniversity] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Memoize particle background props to prevent re-rendering
  const particleProps = useMemo(() => ({
    particleCount: 150,
    primaryColor: "rgba(255, 255, 255, 0.5)",
    secondaryColor: "rgba(173, 216, 230, 0.5)",
    accentColor: "rgba(135, 206, 250, 0.7)",
    particleSize: { min: 2, max: 6 },
    particleSpeed: 0.3
  }), []);

  // Memoized error clearing function
  const clearError = useCallback(() => {
    if (error) setError("");
  }, [error]);

  // Clear error when user starts typing again
  useEffect(() => {
    clearError();
  }, [university, fieldOfStudy, clearError]);

  // Debug logging for page load and email check
  useEffect(() => {
    console.log('Details Page Mounted');
    const pendingEmail = localStorage.getItem("pendingEmail");
    console.log('Pending Email:', pendingEmail);
    
    if (!pendingEmail) {
      console.warn('No pending email found in localStorage');
    }
  }, []);

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

        navigate("/created-sets");
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
    <div className="relative flex justify-center items-center min-h-screen w-full bg-[#004a74] overflow-hidden">
      {/* Absolute positioned background with fixed z-index */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ParticlesBackground 
          key="details-particles"
          {...particleProps}
        />
      </div>
      
      {/* Content with higher z-index and pointer events */}
      <div className="relative z-10 bg-white p-12 rounded-xl shadow-lg w-[min(550px,90vw)] max-h-[90vh] overflow-y-auto text-center">
        <h1 className="text-[#004a74] text-[min(3.5rem,8vw)] font-bold mb-3 mt-0 leading-tight">
          Just a Few More Details!
        </h1>

        {error && (
          <p className="text-[#e53935] text-sm my-2 p-2 bg-[rgba(229,57,53,0.1)] rounded-md w-full">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="w-full">
          <input
            type="text"
            placeholder="Select Your University"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            required
            aria-label="University"
            className="w-full p-4 my-3 border border-[#e0e0e0] rounded-lg text-lg 
              outline-none transition-all duration-300 
              focus:border-[#004a74] focus:shadow-[0_0_0_3px_rgba(0,74,116,0.1)]"
          />
          
          <input
            type="text"
            placeholder="Enter Your Field of Study (Optional)"
            value={fieldOfStudy}
            onChange={(e) => setFieldOfStudy(e.target.value)}
            aria-label="Field of Study"
            className="w-full p-4 my-3 border border-[#e0e0e0] rounded-lg text-lg 
              outline-none transition-all duration-300 
              focus:border-[#004a74] focus:shadow-[0_0_0_3px_rgba(0,74,116,0.1)]"
          />
          
          <button
            type="submit"
            disabled={loading}
            className="mt-7 w-full p-4 bg-[#004a74] text-white text-lg font-medium 
              rounded-lg cursor-pointer transition-all duration-300 
              hover:bg-[#00659f] active:scale-[0.98] 
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Done"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Details;