import React from 'react';
import { Link, useNavigate } from "react-router-dom";
import { Brain, Share2, Search, ArrowRight } from "lucide-react";
import ModernParticleBackground from "../../components/ParticlesBackground";

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => {
  const processedIcon = React.isValidElement(icon)
    ? React.cloneElement(icon as React.ReactElement<any>, {
        size: 32,
        className: "text-white"
      })
    : icon;

  return (
    <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 
                   hover:border-blue-400/40 transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex flex-col items-center">
        <div className="mb-4">{processedIcon}</div>
        <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
        <p className="text-white/70">{description}</p>
      </div>
    </div>
  );
};

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#004a74] to-[#001f3f]">
      {/* Particle Background */}
      <ModernParticleBackground 
        particleCount={150}
        primaryColor="rgba(255, 255, 255, 0.5)"
        secondaryColor="rgba(173, 216, 230, 0.5)"
        accentColor="rgba(135, 206, 250, 0.7)"
        particleSize={{ min: 2, max: 6 }}
        particleSpeed={0.1}
      />
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Fixed Navigation Header */}
        <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-8 py-4 
                         bg-black/5 backdrop-blur-md border-b border-white/5">
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="/images/fliply_logo.png" 
              alt="Fliply Logo" 
              className="h-8 w-auto" 
            />
            <span className="text-white text-xl font-medium tracking-wide">Fliply</span>
          </Link>
          <nav className="flex items-center space-x-8">
            <Link 
              to="/contact" 
              className="text-white/80 hover:text-white transition-colors text-sm font-medium"
            >
              Contact
            </Link>
            <Link 
              to="/login" 
              className="text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full 
                       transition-colors text-sm font-medium border border-white/10"
            >
              Sign In
            </Link>
          </nav>
        </header>
        
        {/* Content Container */}
        <div className="container mx-auto px-4 flex-grow flex flex-col pt-28 pb-12">
          {/* Flexible Spacer and Content */}
          <div className="flex-1 flex flex-col justify-center">
            {/* Hero Section */}
            <main className="text-center">
              <section className="max-w-4xl mx-auto mb-20">
                <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                  Create, Share, and Study <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-200">Smarter</span>
                </h1>
                <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
                  Revolutionize your learning with AI-powered study tools that make knowledge creation and sharing effortless.
                </p>
                <button 
                  onClick={() => navigate("/signup")} 
                  className="text-white bg-white/10 hover:bg-white/20 px-8 py-4 rounded-full 
                           transition-colors text-xl font-medium border border-white/10"
                >
                  Get Started
                </button>
              </section>
              
              {/* Features Section - 3 Column Layout */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mx-auto px-4">
                <FeatureCard 
                  icon={<Brain />}
                  title="AI-Powered Creation"
                  description="Upload your notes and let our AI transform them into comprehensive study sets as flashcards or quizzes."
                />
                <FeatureCard 
                  icon={<Share2 />}
                  title="Share with Peers"
                  description="Post your study sets and help others learn. Collaborate with classmates and track progress together."
                />
                <FeatureCard 
                  icon={<Search />}
                  title="Discover Class Sets"
                  description="Browse study sets created by other students to find content similar to your coursework."
                />
              </section>
            </main>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center">
            <p className="text-white/50 text-sm mb-4">
              © {new Date().getFullYear()} Fliply. All rights reserved.
            </p>
            <div className="flex justify-center space-x-6">
              <Link 
                to="/terms" 
                className="text-white/50 hover:text-white transition-colors text-sm"
              >
                Terms of Service
              </Link>
              <Link 
                to="/privacy" 
                className="text-white/50 hover:text-white transition-colors text-sm"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Landing;