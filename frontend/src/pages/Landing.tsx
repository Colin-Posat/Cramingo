import { Link, useNavigate } from "react-router-dom";
import { Brain, Share2, Search } from "lucide-react";
import "../styles/Landing.css";
import "../styles/index.css";
import ParticlesBackground from "../components/ParticlesBackground";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <ParticlesBackground />

      {/* HEADER */}
      <header className="header">
        <Link to="/" className="logo">
          <img src="/images/fliply_logo.png" alt="Fliply Logo" className="logo-img" />
          <span className="nav-title">Fliply</span>
        </Link>
        <nav className="nav">
          <Link className="about" to="/contact">Contact Us</Link>
          <Link className="login" to="/login">Sign In</Link>
        </nav>
      </header>

      {/* HERO SECTION */}
      <main>
        <section className="hero">
          <h1>Create, Share, and Study Smarter with Fliply</h1>
          <p>The shortcut to better grades</p>
          <button onClick={() => navigate("/signup")} className="get-started-btn">
            <span className="btn-text">Get Started</span>
          </button>
        </section>

        {/* FEATURES SECTION */}
        <section className="features">
          <div className="card">
            <Brain size={40} className="icon" />
            <h3>AI-Powered Creation</h3>
            <p>
              Simply upload your notes and let our AI transform them into comprehensive study sets.
            </p>
          </div>
          <div className="card">
            <Share2 size={40} className="icon" />
            <h3>Share with Peers</h3>
            <p>Post your study sets and help others learn. Collaborate with classmates.</p>
          </div>
          <div className="card">
            <Search size={40} className="icon" />
            <h3>Discover Class Sets</h3>
            <p>Browse study sets created by students to find content similar to past homework, quizzes, and exams.</p>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer>
        <p>© 2024 Fliply. All rights reserved.</p>
        <nav>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/privacy">Privacy</Link>
        </nav>
      </footer>
    </div>
  );
};

export default Landing;
